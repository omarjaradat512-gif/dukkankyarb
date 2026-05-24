"""Shared infrastructure for Dukkank API.

Owns:
- MongoDB connection (`db`)
- Environment-driven config (JWT_SECRET, expiry, etc.)
- Password hashing (bcrypt)
- JWT issuance + verification (with iat-based invalidation)
- Login rate limiter (per-IP, in-memory)
- Audit log helper

Kept separate from `server.py` so it can be imported by routers/tests
without circular dependencies, and so server.py stays focused on routing.
"""
from datetime import datetime, timedelta, timezone
import logging
import os
import uuid
from typing import Dict, Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient


logger = logging.getLogger("dukkank")

# ─── Mongo ────────────────────────────────────────────────────────────────
_mongo_url = os.environ["MONGO_URL"]
_client = AsyncIOMotorClient(_mongo_url)
db = _client[os.environ["DB_NAME"]]


# ─── JWT config ───────────────────────────────────────────────────────────
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
JWT_EXPIRY_HOURS = 24

security = HTTPBearer(auto_error=False)


# ─── Password hashing ─────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ─── JWT ──────────────────────────────────────────────────────────────────
def create_access_token(user_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        # `iat` is used to invalidate tokens after a password change:
        # tokens with iat < user.password_changed_at are rejected.
        "iat": int(now.timestamp()),
        "exp": now + timedelta(hours=JWT_EXPIRY_HOURS),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Admin only")
        pwd_changed = user.get("password_changed_at")
        token_iat = payload.get("iat")
        if pwd_changed and token_iat is not None and int(token_iat) < int(pwd_changed):
            raise HTTPException(status_code=401, detail="Token invalidated (password changed)")
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─── Login rate limiting (in-memory, per-IP) ──────────────────────────────
# For multi-process deployments swap this for a Redis-backed limiter.
_login_attempts: Dict[str, list] = {}
LOGIN_WINDOW_SECONDS = 15 * 60         # 15 min sliding window
LOGIN_MAX_ATTEMPTS = 8                  # failed attempts per IP per window


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def login_rate_limit_check(request: Request):
    """Raise 429 if too many recent FAILED login attempts from this IP."""
    ip = _client_ip(request)
    now = datetime.now(timezone.utc).timestamp()
    cutoff = now - LOGIN_WINDOW_SECONDS
    history = [t for t in _login_attempts.get(ip, []) if t > cutoff]
    _login_attempts[ip] = history
    if len(history) >= LOGIN_MAX_ATTEMPTS:
        retry_after = int(history[0] + LOGIN_WINDOW_SECONDS - now)
        raise HTTPException(
            status_code=429,
            detail=f"محاولات كثيرة متتالية، حاول مرة أخرى بعد {max(60, retry_after)} ثانية.",
            headers={"Retry-After": str(max(60, retry_after))},
        )


def record_failed_login(request: Request):
    ip = _client_ip(request)
    now = datetime.now(timezone.utc).timestamp()
    _login_attempts.setdefault(ip, []).append(now)


def reset_failed_logins(request: Request):
    ip = _client_ip(request)
    _login_attempts.pop(ip, None)


# ─── Misc ────────────────────────────────────────────────────────────────
def strip_id(doc: Optional[dict]) -> Optional[dict]:
    if doc is None:
        return None
    doc.pop("_id", None)
    return doc


async def log_audit(actor: dict, action: str, target_type: str, target_id: str = "",
                    target_label: str = "", details: Optional[dict] = None):
    """Insert an audit-log entry. Fire-and-forget; failures must not break the request."""
    try:
        entry = {
            "id": str(uuid.uuid4()),
            "actor_email": actor.get("email", "system") if actor else "system",
            "action": action,
            "target_type": target_type,
            "target_id": target_id or "",
            "target_label": target_label or "",
            "details": details or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await db.audit_log.insert_one(entry)
    except Exception as e:
        logger.warning(f"audit log failed: {e}")
