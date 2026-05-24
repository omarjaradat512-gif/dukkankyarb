"""Pydantic request/response models for Dukkank API.

Kept in a dedicated module so server.py focuses on routing and business logic.
"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# ─── Auth ────────────────────────────────────────────────────────────────


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    user: Dict[str, Any]


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ─── Store + catalog ─────────────────────────────────────────────────────


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
    # Percent (e.g. 10 = 10% off) applied in BundleBuilder when this
    # subscription+duration is selected. 0 means no discount.
    bundleDiscountPct: float = 0.0


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


# ─── CMS (reviews / faqs) ────────────────────────────────────────────────


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
    icon: str = "help-circle"
    q: str
    a: str
    order: int = 0


# ─── Customer interactions ──────────────────────────────────────────────


class NotifyRequestPayload(BaseModel):
    gameId: str
    contact: str          # phone or email
    name: Optional[str] = ""


class CartEventPayload(BaseModel):
    itemType: str         # "subscription" | "game" | "bundle"
    itemId: str
    itemName: str = ""
