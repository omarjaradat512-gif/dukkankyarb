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

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr

from initial_data import INITIAL_STORE, INITIAL_SUBSCRIPTIONS, INITIAL_GAMES, INITIAL_BUNDLES

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
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
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
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


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


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
@api.post("/auth/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
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
