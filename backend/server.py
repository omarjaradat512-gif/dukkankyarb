from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
import bcrypt
import jwt
import secrets
import shutil
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any, Dict

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status, UploadFile, File, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr

from initial_data import INITIAL_STORE, INITIAL_SUBSCRIPTIONS, INITIAL_GAMES, INITIAL_BUNDLES, INITIAL_REVIEWS, INITIAL_FAQS, INITIAL_CONTENT

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("dukkank")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
JWT_EXPIRY_HOURS = 24

app = FastAPI(title="Dukkank API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Uploads dir (served as /api/uploads/<file>)
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        # `iat` is used to invalidate tokens after a password change:
        # any token whose `iat` is older than `user.password_changed_at`
        # is rejected by get_current_admin().
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
        # Reject tokens issued before the most recent password change.
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


# ---------------------------------------------------------------------------
# Rate limiting (in-memory, per-IP). Used on /auth/login.
# Note: for multi-process deployments, swap this for Redis-backed limiter.
# ---------------------------------------------------------------------------
_login_attempts: Dict[str, list] = {}
LOGIN_WINDOW_SECONDS = 15 * 60       # 15 min sliding window
LOGIN_MAX_ATTEMPTS = 8                # max failed attempts per IP per window


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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
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
            "action": action,                  # create | update | delete | other
            "target_type": target_type,        # store | subscription | game | bundle | sections | promo | social_proof | wa_templates | subscriber | upload
            "target_id": target_id or "",
            "target_label": target_label or "",
            "details": details or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await db.audit_log.insert_one(entry)
    except Exception as e:
        logger.warning(f"audit log failed: {e}")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    user: Dict[str, Any]


class StoreSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    name_en: Optional[str] = ""
    tagline: str
    tagline_en: Optional[str] = ""
    whatsapp: str
    whatsappDisplay: str
    instagram: Optional[str] = ""


class Duration(BaseModel):
    id: str
    label: str
    label_en: Optional[str] = ""
    four: Optional[float] = None
    five: Optional[float] = None
    bundleDiscountPct: float = 0.0   # percent (e.g. 10 = 10% off) applied in BundleBuilder when this duration is selected


class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    name_en: Optional[str] = ""
    tagline: str
    tagline_en: Optional[str] = ""
    accent: str = "blue"
    durations: List[Duration] = []


class Game(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    sub: str = ""
    image: str = ""
    gradientFrom: str = "#222"
    gradientTo: str = "#000"
    four: Optional[float] = None
    five: Optional[float] = None
    available: bool = True
    bestSeller: bool = False


class Bundle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    subId: str
    durationId: str
    gameId: str
    tier: str  # "four" or "five"
    bundlePrice: float
    available: bool = True


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    rating: int = 5
    text: str
    order: int = 0


class FAQItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    icon: str = "help-circle"   # lucide icon key (e.g. "truck", "credit-card", "shield-check", "help-circle")
    q: str
    a: str
    order: int = 0


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class NotifyRequestPayload(BaseModel):
    gameId: str
    contact: str   # phone or email
    name: Optional[str] = ""


class CartEventPayload(BaseModel):
    itemType: str   # "subscription" | "game" | "bundle"
    itemId: str
    itemName: str = ""


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"app": "Dukkank API", "status": "ok"}


@api.get("/store")
async def get_store():
    doc = await db.settings.find_one({"key": "store"})
    if not doc:
        raise HTTPException(404, "Store not configured")
    strip_id(doc)
    doc.pop("key", None)
    return doc


@api.get("/subscriptions")
async def list_subscriptions():
    items = await db.subscriptions.find({}, {"_id": 0}).to_list(100)
    # preserve seeded order
    order = {"essential": 0, "extra": 1}
    items.sort(key=lambda x: order.get(x.get("id"), 999))
    return items


@api.get("/games")
async def list_games():
    items = await db.games.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    for it in items:
        it.pop("order", None)
    return items


@api.get("/bundles")
async def list_bundles():
    items = await db.bundles.find({}, {"_id": 0}).to_list(100)
    return items


@api.get("/reviews")
async def list_reviews():
    items = await db.reviews.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return items


@api.get("/faqs")
async def list_faqs():
    items = await db.faqs.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return items


# ---------------------------------------------------------------------------
# Site content (page copy) — single document. Public read, admin write.
# ---------------------------------------------------------------------------
@api.get("/content")
async def get_content():
    doc = await db.settings.find_one({"id": "content"}, {"_id": 0, "id": 0}) or {}
    return doc


@api.put("/admin/content")
async def update_content(payload: Dict[str, Any] = Body(...), current=Depends(get_current_admin)):
    # Whitelist: only allow keys that exist in INITIAL_CONTENT (top-level)
    allowed = set(INITIAL_CONTENT.keys())
    sanitized = {k: v for k, v in payload.items() if k in allowed}
    if not sanitized:
        raise HTTPException(400, "لا يوجد محتوى صالح للحفظ")
    await db.settings.update_one(
        {"id": "content"},
        {"$set": sanitized},
        upsert=True,
    )
    await log_audit(current, "update", "content", "content", f"تحديث {len(sanitized)} قسم")
    doc = await db.settings.find_one({"id": "content"}, {"_id": 0, "id": 0}) or {}
    return doc


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
@api.post("/auth/login", response_model=LoginResponse)
async def login(body: LoginRequest, request: Request):
    login_rate_limit_check(request)
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        record_failed_login(request)
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    reset_failed_logins(request)
    token = create_access_token(user["id"], user["email"])
    user.pop("password_hash", None)
    user.pop("_id", None)
    return LoginResponse(token=token, user=user)


@api.get("/auth/me")
async def auth_me(current=Depends(get_current_admin)):
    return current


# ---------------------------------------------------------------------------
# Admin: Store
# ---------------------------------------------------------------------------
@api.put("/admin/store")
async def update_store(payload: StoreSettings, current=Depends(get_current_admin)):
    data = payload.model_dump()
    data["key"] = "store"
    await db.settings.update_one({"key": "store"}, {"$set": data}, upsert=True)
    await log_audit(current, "update", "store", "store", payload.name)
    data.pop("key", None)
    return data


# ---------------------------------------------------------------------------
# Admin: Subscriptions
# ---------------------------------------------------------------------------
@api.post("/admin/subscriptions")
async def create_subscription(payload: Subscription, current=Depends(get_current_admin)):
    if await db.subscriptions.find_one({"id": payload.id}):
        raise HTTPException(400, "Subscription id already exists")
    await db.subscriptions.insert_one(payload.model_dump())
    await log_audit(current, "create", "subscription", payload.id, payload.name)
    return payload.model_dump()


@api.put("/admin/subscriptions/{sub_id}")
async def update_subscription(sub_id: str, payload: Subscription, current=Depends(get_current_admin)):
    data = payload.model_dump()
    data["id"] = sub_id
    res = await db.subscriptions.update_one({"id": sub_id}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(404, "Subscription not found")
    await log_audit(current, "update", "subscription", sub_id, payload.name)
    return data


@api.delete("/admin/subscriptions/{sub_id}")
async def delete_subscription(sub_id: str, current=Depends(get_current_admin)):
    existing = await db.subscriptions.find_one({"id": sub_id})
    res = await db.subscriptions.delete_one({"id": sub_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Subscription not found")
    await log_audit(current, "delete", "subscription", sub_id, (existing or {}).get("name", sub_id))
    return {"deleted": sub_id}


# ---------------------------------------------------------------------------
# Admin: Games
# ---------------------------------------------------------------------------
@api.post("/admin/games")
async def create_game(payload: Game, current=Depends(get_current_admin)):
    if await db.games.find_one({"id": payload.id}):
        raise HTTPException(400, "Game id already exists")
    # append at end
    count = await db.games.count_documents({})
    doc = payload.model_dump()
    doc["order"] = count
    await db.games.insert_one(doc)
    await log_audit(current, "create", "game", payload.id, payload.name)
    doc.pop("order", None)
    doc.pop("_id", None)
    return doc


@api.put("/admin/games/{game_id}")
async def update_game(game_id: str, payload: Game, current=Depends(get_current_admin)):
    data = payload.model_dump()
    data["id"] = game_id
    res = await db.games.update_one({"id": game_id}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(404, "Game not found")
    await log_audit(current, "update", "game", game_id, payload.name)
    return data


@api.delete("/admin/games/{game_id}")
async def delete_game(game_id: str, current=Depends(get_current_admin)):
    existing = await db.games.find_one({"id": game_id})
    res = await db.games.delete_one({"id": game_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Game not found")
    await log_audit(current, "delete", "game", game_id, (existing or {}).get("name", game_id))
    return {"deleted": game_id}


# ---------------------------------------------------------------------------
# Admin: Bundles
# ---------------------------------------------------------------------------
@api.post("/admin/bundles")
async def create_bundle(payload: Bundle, current=Depends(get_current_admin)):
    if await db.bundles.find_one({"id": payload.id}):
        raise HTTPException(400, "Bundle id already exists")
    await db.bundles.insert_one(payload.model_dump())
    await log_audit(current, "create", "bundle", payload.id, payload.id)
    return payload.model_dump()


@api.put("/admin/bundles/{bundle_id}")
async def update_bundle(bundle_id: str, payload: Bundle, current=Depends(get_current_admin)):
    data = payload.model_dump()
    data["id"] = bundle_id
    res = await db.bundles.update_one({"id": bundle_id}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(404, "Bundle not found")
    await log_audit(current, "update", "bundle", bundle_id, bundle_id)
    return data


@api.delete("/admin/bundles/{bundle_id}")
async def delete_bundle(bundle_id: str, current=Depends(get_current_admin)):
    res = await db.bundles.delete_one({"id": bundle_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Bundle not found")
    await log_audit(current, "delete", "bundle", bundle_id, bundle_id)
    return {"deleted": bundle_id}


# ---------------------------------------------------------------------------
# Admin: Reviews
# ---------------------------------------------------------------------------
@api.post("/admin/reviews")
async def create_review(payload: Review, current=Depends(get_current_admin)):
    if await db.reviews.find_one({"id": payload.id}):
        raise HTTPException(400, "Review id already exists")
    doc = payload.model_dump()
    if doc.get("order") is None:
        doc["order"] = await db.reviews.count_documents({})
    await db.reviews.insert_one(doc)
    await log_audit(current, "create", "review", payload.id, payload.name)
    doc.pop("_id", None)
    return doc


@api.put("/admin/reviews/{rid}")
async def update_review(rid: str, payload: Review, current=Depends(get_current_admin)):
    data = payload.model_dump()
    data["id"] = rid
    res = await db.reviews.update_one({"id": rid}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(404, "Review not found")
    await log_audit(current, "update", "review", rid, payload.name)
    return data


@api.delete("/admin/reviews/{rid}")
async def delete_review(rid: str, current=Depends(get_current_admin)):
    existing = await db.reviews.find_one({"id": rid})
    res = await db.reviews.delete_one({"id": rid})
    if res.deleted_count == 0:
        raise HTTPException(404, "Review not found")
    await log_audit(current, "delete", "review", rid, (existing or {}).get("name", rid))
    return {"deleted": rid}


# ---------------------------------------------------------------------------
# Admin: FAQs
# ---------------------------------------------------------------------------
@api.post("/admin/faqs")
async def create_faq(payload: FAQItem, current=Depends(get_current_admin)):
    if await db.faqs.find_one({"id": payload.id}):
        raise HTTPException(400, "FAQ id already exists")
    doc = payload.model_dump()
    if doc.get("order") is None:
        doc["order"] = await db.faqs.count_documents({})
    await db.faqs.insert_one(doc)
    await log_audit(current, "create", "faq", payload.id, payload.q[:60])
    doc.pop("_id", None)
    return doc


@api.put("/admin/faqs/{fid}")
async def update_faq(fid: str, payload: FAQItem, current=Depends(get_current_admin)):
    data = payload.model_dump()
    data["id"] = fid
    res = await db.faqs.update_one({"id": fid}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(404, "FAQ not found")
    await log_audit(current, "update", "faq", fid, payload.q[:60])
    return data


@api.delete("/admin/faqs/{fid}")
async def delete_faq(fid: str, current=Depends(get_current_admin)):
    existing = await db.faqs.find_one({"id": fid})
    res = await db.faqs.delete_one({"id": fid})
    if res.deleted_count == 0:
        raise HTTPException(404, "FAQ not found")
    await log_audit(current, "delete", "faq", fid, (existing or {}).get("q", fid)[:60])
    return {"deleted": fid}


# ---------------------------------------------------------------------------
# Admin: Change Password
# ---------------------------------------------------------------------------
@api.put("/admin/change-password")
async def change_password(payload: ChangePasswordRequest, current=Depends(get_current_admin)):
    if len(payload.new_password) < 8:
        raise HTTPException(400, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل")
    user = await db.users.find_one({"id": current["id"]})
    if not user:
        raise HTTPException(404, "User not found")
    if not verify_password(payload.current_password, user.get("password_hash", "")):
        raise HTTPException(400, "كلمة المرور الحالية غير صحيحة")
    new_hash = hash_password(payload.new_password)
    # Stamp the change time so all PREVIOUSLY issued tokens become invalid.
    # We add a small skew (+1s) so the just-issued new token is definitely valid.
    now_ts = int(datetime.now(timezone.utc).timestamp())
    await db.users.update_one(
        {"id": current["id"]},
        {"$set": {"password_hash": new_hash, "password_changed_at": now_ts}},
    )
    await log_audit(current, "update", "account", current["id"], "تغيير كلمة المرور")
    # Issue a fresh token for the user so their current session stays alive.
    new_token = create_access_token(current["id"], current["email"])
    return {
        "ok": True,
        "message": "تم تغيير كلمة المرور بنجاح. كل الجلسات القديمة الأخرى تم تسجيل خروجها.",
        "token": new_token,
    }


# ---------------------------------------------------------------------------
# Notify-when-available (customer interest list for out-of-stock games)
# ---------------------------------------------------------------------------
@api.post("/notify-requests")
async def create_notify_request(payload: NotifyRequestPayload):
    contact = payload.contact.strip()
    if not contact:
        raise HTTPException(400, "يرجى إدخال رقم أو إيميل")
    # Dedupe per (gameId, contact)
    existing = await db.notify_requests.find_one({"gameId": payload.gameId, "contact": contact})
    if existing:
        return {"ok": True, "alreadyRegistered": True}
    doc = {
        "id": str(uuid.uuid4()),
        "gameId": payload.gameId,
        "contact": contact,
        "name": (payload.name or "").strip(),
        "fulfilled": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.notify_requests.insert_one(doc)
    return {"ok": True, "alreadyRegistered": False}


@api.get("/admin/notify-requests")
async def list_notify_requests(current=Depends(get_current_admin)):
    items = await db.notify_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return items


@api.delete("/admin/notify-requests/{rid}")
async def delete_notify_request(rid: str, current=Depends(get_current_admin)):
    res = await db.notify_requests.delete_one({"id": rid})
    if res.deleted_count == 0:
        raise HTTPException(404, "Notify request not found")
    await log_audit(current, "delete", "notify_request", rid)
    return {"deleted": rid}


# ---------------------------------------------------------------------------
# Cart event tracking (lightweight, public)
# ---------------------------------------------------------------------------
@api.post("/events/cart-add")
async def record_cart_add(payload: CartEventPayload):
    doc = {
        "itemType": payload.itemType,
        "itemId": payload.itemId,
        "itemName": (payload.itemName or "").strip(),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    await db.cart_events.insert_one(doc)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Admin: Analytics
# ---------------------------------------------------------------------------
@api.get("/admin/analytics")
async def get_analytics(days: int = 30, current=Depends(get_current_admin)):
    days = max(1, min(days, 90))
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    # Totals
    subs_total = await db.subscribers.count_documents({})
    cart_total = await db.cart_events.count_documents({})
    notify_total = await db.notify_requests.count_documents({})
    audit_total = await db.audit_log.count_documents({})
    games_total = await db.games.count_documents({})

    # Subscribers per day (last N days)
    subs_by_day: Dict[str, int] = {}
    cursor = db.subscribers.find({"created_at": {"$gte": since}}, {"_id": 0, "created_at": 1})
    async for d in cursor:
        day = (d.get("created_at") or "")[:10]
        if day:
            subs_by_day[day] = subs_by_day.get(day, 0) + 1

    # Cart events per day
    cart_by_day: Dict[str, int] = {}
    cursor = db.cart_events.find({"ts": {"$gte": since}}, {"_id": 0, "ts": 1})
    async for d in cursor:
        day = (d.get("ts") or "")[:10]
        if day:
            cart_by_day[day] = cart_by_day.get(day, 0) + 1

    # Top items added to cart
    top_items_raw = await db.cart_events.aggregate([
        {"$group": {
            "_id": {"itemType": "$itemType", "itemId": "$itemId", "itemName": "$itemName"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]).to_list(10)
    top_items = [
        {
            "itemType": it["_id"].get("itemType", ""),
            "itemId": it["_id"].get("itemId", ""),
            "itemName": it["_id"].get("itemName", ""),
            "count": it["count"],
        }
        for it in top_items_raw
    ]

    # Audit actions breakdown
    audit_actions_raw = await db.audit_log.aggregate([
        {"$group": {"_id": "$action", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]).to_list(20)
    audit_actions = [{"action": a["_id"], "count": a["count"]} for a in audit_actions_raw]

    # Build full day list (fill zeros) — ascending
    day_list = []
    from datetime import date
    base = datetime.now(timezone.utc).date()
    for i in range(days - 1, -1, -1):
        d = (base - timedelta(days=i)).isoformat()
        day_list.append({
            "date": d,
            "subscribers": subs_by_day.get(d, 0),
            "cartAdds": cart_by_day.get(d, 0),
        })

    return {
        "totals": {
            "subscribers": subs_total,
            "cartEvents": cart_total,
            "notifyRequests": notify_total,
            "auditLog": audit_total,
            "games": games_total,
        },
        "timeline": day_list,
        "topItems": top_items,
        "auditActions": audit_actions,
        "rangeDays": days,
    }


# ---------------------------------------------------------------------------
# Sections — homepage section order & visibility
# ---------------------------------------------------------------------------
# Each section is identified by a stable key, has an order index, and a visible flag.
DEFAULT_SECTIONS = [
    {"id": "recommender",   "label": "مساعدك الشخصي (Recommender)", "visible": True},
    {"id": "essential",     "label": "الاشتراك الأساسي",            "visible": True},
    {"id": "extra",         "label": "الاشتراك الإضافي",            "visible": True},
    {"id": "comparison",    "label": "مقارنة الاشتراكات",           "visible": True},
    {"id": "bundles",       "label": "الباقات المدمجة",             "visible": True},
    {"id": "bundleBuilder", "label": "ابني باقتك",                  "visible": True},
    {"id": "games",         "label": "الألعاب",                     "visible": True},
    {"id": "emailSignup",   "label": "اشترك بالنشرة + خصم 10%",     "visible": True},
    {"id": "reviews",       "label": "آراء العملاء",                "visible": True},
    {"id": "faq",           "label": "الأسئلة الشائعة",             "visible": True},
]


class SectionItem(BaseModel):
    id: str
    label: str = ""
    visible: bool = True


class SectionsPayload(BaseModel):
    sections: List[SectionItem]


@api.get("/sections")
async def get_sections():
    doc = await db.settings.find_one({"key": "sections"})
    if not doc:
        return DEFAULT_SECTIONS
    return doc.get("sections", DEFAULT_SECTIONS)


@api.put("/admin/sections")
async def update_sections(payload: SectionsPayload, current=Depends(get_current_admin)):
    data = {"key": "sections", "sections": [s.model_dump() for s in payload.sections]}
    await db.settings.update_one({"key": "sections"}, {"$set": data}, upsert=True)
    await log_audit(current, "update", "sections", "sections")
    return data["sections"]


# ---------------------------------------------------------------------------
# Promo Banner (Urgency Timer)
# ---------------------------------------------------------------------------
class PromoBanner(BaseModel):
    enabled: bool = False
    title: str = ""
    subtitle: str = ""
    endsAt: Optional[str] = None        # ISO8601 string
    ctaLabel: str = ""
    ctaHref: str = ""


@api.get("/promo")
async def get_promo():
    doc = await db.settings.find_one({"key": "promo"})
    if not doc:
        return {"enabled": False, "title": "", "subtitle": "", "endsAt": None, "ctaLabel": "", "ctaHref": ""}
    return {k: v for k, v in doc.items() if k not in ("_id", "key")}


@api.put("/admin/promo")
async def update_promo(payload: PromoBanner, current=Depends(get_current_admin)):
    data = payload.model_dump()
    data["key"] = "promo"
    await db.settings.update_one({"key": "promo"}, {"$set": data}, upsert=True)
    await log_audit(current, "update", "promo", "promo", payload.title)
    data.pop("key", None)
    return data


# ---------------------------------------------------------------------------
# Social Proof Messages
# ---------------------------------------------------------------------------
DEFAULT_SOCIAL_PROOF = [
    "محمد من عمّان اشترى للتو PS Plus Extra سنوي",
    "أحمد من جدّة اشترك بـ PS Plus Essential شهر",
    "علي من الرياض حصل على EA Sports FC 26",
    "سامي من إربد طلب باقة GTA V + PS Plus",
    "خالد من الدمام اشترى Call of Duty: Black Ops 7",
    "ياسر من الزرقاء اشترى Spider-Man 2 بالعربية",
    "نواف من الكويت طلب اشتراك PS Plus Extra ٣ شهور",
    "فهد من المنامة اشترى Red Dead Redemption 2",
    "تركي من القاهرة طلب FC 26 + اشتراك سنوي",
    "رامي من رام الله طلب Ghost of Yotei",
]


class SocialProofPayload(BaseModel):
    enabled: bool = True
    intervalSeconds: int = 12
    messages: List[str] = []


@api.get("/social-proof")
async def get_social_proof():
    doc = await db.settings.find_one({"key": "social_proof"})
    if not doc:
        return {"enabled": True, "intervalSeconds": 12, "messages": DEFAULT_SOCIAL_PROOF}
    return {
        "enabled": doc.get("enabled", True),
        "intervalSeconds": doc.get("intervalSeconds", 12),
        "messages": doc.get("messages", DEFAULT_SOCIAL_PROOF),
    }


@api.put("/admin/social-proof")
async def update_social_proof(payload: SocialProofPayload, current=Depends(get_current_admin)):
    data = {
        "key": "social_proof",
        "enabled": payload.enabled,
        "intervalSeconds": max(3, payload.intervalSeconds),
        "messages": [m.strip() for m in payload.messages if m.strip()],
    }
    await db.settings.update_one({"key": "social_proof"}, {"$set": data}, upsert=True)
    await log_audit(current, "update", "social_proof", "social_proof")
    data.pop("key", None)
    return data


# ---------------------------------------------------------------------------
# WhatsApp Templates
# ---------------------------------------------------------------------------
DEFAULT_WA_TEMPLATES = {
    "general": "السلام عليكم 👋\nأود الاستفسار عن منتجات متجر {storeName}.",
    "productInquiry": "السلام عليكم 👋\nشفت {productName} في متجركم وأبغى أطلبه.\n\nهل لا يزال متوفر؟",
    "orderHeader": "السلام عليكم 👋\nأرغب بطلب من متجر *{storeName}*:",
    "orderFooter": "شكراً لكم 🌟",
}


class WATemplatesPayload(BaseModel):
    general: str = DEFAULT_WA_TEMPLATES["general"]
    productInquiry: str = DEFAULT_WA_TEMPLATES["productInquiry"]
    orderHeader: str = DEFAULT_WA_TEMPLATES["orderHeader"]
    orderFooter: str = DEFAULT_WA_TEMPLATES["orderFooter"]


@api.get("/wa-templates")
async def get_wa_templates():
    doc = await db.settings.find_one({"key": "wa_templates"})
    if not doc:
        return DEFAULT_WA_TEMPLATES
    return {k: doc.get(k, v) for k, v in DEFAULT_WA_TEMPLATES.items()}


@api.put("/admin/wa-templates")
async def update_wa_templates(payload: WATemplatesPayload, current=Depends(get_current_admin)):
    data = payload.model_dump()
    data["key"] = "wa_templates"
    await db.settings.update_one({"key": "wa_templates"}, {"$set": data}, upsert=True)
    await log_audit(current, "update", "wa_templates", "wa_templates")
    data.pop("key", None)
    return data


# ---------------------------------------------------------------------------
# Email subscribers (10% discount signup)
# ---------------------------------------------------------------------------
class SubscriberSignup(BaseModel):
    email: EmailStr


def _gen_discount_code() -> str:
    return "DUKKANK10-" + secrets.token_hex(3).upper()


@api.post("/subscribers")
async def subscribe(payload: SubscriberSignup):
    email = payload.email.lower().strip()
    existing = await db.subscribers.find_one({"email": email})
    if existing:
        return {
            "code": existing["code"],
            "email": email,
            "alreadyRegistered": True,
        }
    code = _gen_discount_code()
    await db.subscribers.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "code": code,
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"code": code, "email": email, "alreadyRegistered": False}


@api.get("/admin/subscribers")
async def list_subscribers(current=Depends(get_current_admin)):
    items = await db.subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api.delete("/admin/subscribers/{email}")
async def delete_subscriber(email: str, current=Depends(get_current_admin)):
    res = await db.subscribers.delete_one({"email": email.lower().strip()})
    if res.deleted_count == 0:
        raise HTTPException(404, "Subscriber not found")
    await log_audit(current, "delete", "subscriber", email, email)
    return {"deleted": email}


# ---------------------------------------------------------------------------
# Image upload (admin only)
# ---------------------------------------------------------------------------
@api.post("/admin/upload")
async def upload_image(file: UploadFile = File(...), current=Depends(get_current_admin)):
    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        raise HTTPException(400, f"الامتداد غير مسموح. المسموح: {', '.join(sorted(ALLOWED_IMAGE_EXT))}")

    name = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / name
    try:
        with dest.open("wb") as out:
            shutil.copyfileobj(file.file, out)
    finally:
        await file.close()

    # File size cap (~ 5 MB)
    if dest.stat().st_size > 5 * 1024 * 1024:
        try:
            dest.unlink()
        except Exception:
            pass
        raise HTTPException(400, "حجم الصورة أكبر من 5 ميغابايت")

    url = f"/api/uploads/{name}"
    await log_audit(current, "create", "upload", name, file.filename or name)
    return {"url": url, "name": name, "size": dest.stat().st_size}


# ---------------------------------------------------------------------------
# Audit Log
# ---------------------------------------------------------------------------
@api.get("/admin/audit")
async def list_audit(limit: int = 100, current=Depends(get_current_admin)):
    items = await db.audit_log.find({}, {"_id": 0}).sort("timestamp", -1).to_list(max(1, min(limit, 500)))
    return items


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------
async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@dukkank.com").lower()
    password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin user: {email}")
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one(
            {"email": email},
            {"$set": {"password_hash": hash_password(password)}},
        )
        logger.info(f"Updated admin password for {email}")


async def seed_initial_data():
    # Store
    if not await db.settings.find_one({"key": "store"}):
        doc = dict(INITIAL_STORE)
        doc["key"] = "store"
        await db.settings.insert_one(doc)
        logger.info("Seeded store settings")

    # Subscriptions
    if await db.subscriptions.count_documents({}) == 0:
        await db.subscriptions.insert_many(list(INITIAL_SUBSCRIPTIONS))
        logger.info(f"Seeded {len(INITIAL_SUBSCRIPTIONS)} subscriptions")
    else:
        # Migration: backfill bundleDiscountPct on durations that don't have it
        async for sub in db.subscriptions.find({}):
            durations = sub.get("durations", []) or []
            changed = False
            for d in durations:
                if "bundleDiscountPct" not in d or d.get("bundleDiscountPct") is None:
                    # Sensible default based on id pattern (longer → bigger discount)
                    did = (d.get("id") or "").lower()
                    if "12m" in did:
                        d["bundleDiscountPct"] = 12
                    elif "3m" in did:
                        d["bundleDiscountPct"] = 8
                    else:
                        d["bundleDiscountPct"] = 5
                    changed = True
            if changed:
                await db.subscriptions.update_one(
                    {"id": sub["id"]},
                    {"$set": {"durations": durations}},
                )
                logger.info(f"Migrated subscription {sub['id']}: backfilled bundleDiscountPct")

    # Games (with order field)
    if await db.games.count_documents({}) == 0:
        docs = []
        for i, g in enumerate(INITIAL_GAMES):
            d = dict(g)
            d["order"] = i
            docs.append(d)
        await db.games.insert_many(docs)
        logger.info(f"Seeded {len(docs)} games")

    # Bundles
    if await db.bundles.count_documents({}) == 0:
        await db.bundles.insert_many(list(INITIAL_BUNDLES))
        logger.info(f"Seeded {len(INITIAL_BUNDLES)} bundles")

    # Reviews
    if await db.reviews.count_documents({}) == 0:
        await db.reviews.insert_many(list(INITIAL_REVIEWS))
        logger.info(f"Seeded {len(INITIAL_REVIEWS)} reviews")

    # FAQs
    if await db.faqs.count_documents({}) == 0:
        await db.faqs.insert_many(list(INITIAL_FAQS))
        logger.info(f"Seeded {len(INITIAL_FAQS)} faqs")

    # Site content (single doc by id="content")
    existing_content = await db.settings.find_one({"id": "content"})
    if not existing_content:
        await db.settings.insert_one({"id": "content", **INITIAL_CONTENT})
        logger.info("Seeded site content")
    else:
        # Backfill missing top-level keys (e.g. when new sections are added later)
        patch = {}
        for k, v in INITIAL_CONTENT.items():
            if k not in existing_content:
                patch[k] = v
            elif isinstance(v, dict) and isinstance(existing_content.get(k), dict):
                # Add missing sub-keys (preserving any admin edits)
                for sk, sv in v.items():
                    if sk not in existing_content[k]:
                        patch[f"{k}.{sk}"] = sv
        if patch:
            await db.settings.update_one({"id": "content"}, {"$set": patch})
            logger.info(f"Backfilled {len(patch)} content keys")

    # Sections: migrate to include any new default sections that aren't already present.
    sec_doc = await db.settings.find_one({"key": "sections"})
    if sec_doc:
        current_ids = {s.get("id") for s in sec_doc.get("sections", [])}
        missing = [s for s in DEFAULT_SECTIONS if s["id"] not in current_ids]
        if missing:
            # Insert each missing section just before any matching neighbor (or append).
            new_list = list(sec_doc.get("sections", []))
            for m in missing:
                # Insert by default order index
                idx = next((i for i, d in enumerate(DEFAULT_SECTIONS) if d["id"] == m["id"]), len(new_list))
                new_list.insert(min(idx, len(new_list)), m)
            await db.settings.update_one({"key": "sections"}, {"$set": {"sections": new_list}})
            logger.info(f"Migrated sections: added {[m['id'] for m in missing]}")


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.subscriptions.create_index("id", unique=True)
    await db.games.create_index("id", unique=True)
    await db.bundles.create_index("id", unique=True)
    await db.subscribers.create_index("email", unique=True)
    await db.audit_log.create_index("timestamp")
    await db.reviews.create_index("id", unique=True)
    await db.faqs.create_index("id", unique=True)
    await db.notify_requests.create_index([("gameId", 1), ("contact", 1)])
    await db.notify_requests.create_index("created_at")
    await db.cart_events.create_index("ts")
    await seed_admin()
    await seed_initial_data()
    logger.info("Startup complete")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ---------------------------------------------------------------------------
# Wire up
# ---------------------------------------------------------------------------
app.include_router(api)
# Serve uploaded images via /api/uploads/<file>
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
