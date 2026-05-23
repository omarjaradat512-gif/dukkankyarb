"""
Backend API tests for Dukkank.
Covers: auth (login, /auth/me), public endpoints, admin CRUD on store/games/subscriptions/bundles.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://web-polish-21.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@dukkank.com"
ADMIN_PASSWORD = "omar512@@OoD"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and data["token"]
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------------------------------------------------------------------------
# Auth tests
# ---------------------------------------------------------------------------
class TestAuth:
    def test_login_success(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data.get("token"), str) and len(data["token"]) > 10
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        assert "password_hash" not in data["user"]
        assert "_id" not in data["user"]

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpassword"}, timeout=30)
        assert r.status_code == 401

    def test_login_unknown_user(self, session):
        r = session.post(f"{API}/auth/login", json={"email": "noone@example.com", "password": "x"}, timeout=30)
        assert r.status_code == 401

    def test_me_with_token(self, session, auth_headers):
        r = session.get(f"{API}/auth/me", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"

    def test_me_without_token(self, session):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_me_with_bad_token(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer not-a-real-token"}, timeout=30)
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------
class TestPublic:
    def test_get_store(self, session):
        r = session.get(f"{API}/store", timeout=30)
        assert r.status_code == 200
        data = r.json()
        for k in ("name", "tagline", "whatsapp", "whatsappDisplay"):
            assert k in data, f"missing {k} in store response"
        assert "_id" not in data
        assert "key" not in data

    def test_get_subscriptions(self, session):
        r = session.get(f"{API}/subscriptions", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 2
        ids = {it["id"] for it in items}
        assert "essential" in ids and "extra" in ids
        for it in items:
            assert "name" in it and "durations" in it and isinstance(it["durations"], list)

    def test_get_games(self, session):
        r = session.get(f"{API}/games", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 22, f"expected at least 22 games, got {len(items)}"
        for g in items[:3]:
            for k in ("id", "name", "image", "gradientFrom", "gradientTo"):
                assert k in g

    def test_get_bundles(self, session):
        r = session.get(f"{API}/bundles", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)


# ---------------------------------------------------------------------------
# Admin: requires auth
# ---------------------------------------------------------------------------
class TestAdminAuthGuard:
    def test_put_store_unauthenticated(self):
        r = requests.put(f"{API}/admin/store", json={
            "name": "x", "tagline": "y", "whatsapp": "1", "whatsappDisplay": "1"
        }, timeout=30)
        assert r.status_code == 401

    def test_create_game_unauthenticated(self):
        r = requests.post(f"{API}/admin/games", json={"id": "x", "name": "x"}, timeout=30)
        assert r.status_code == 401

    def test_delete_bundle_unauthenticated(self):
        r = requests.delete(f"{API}/admin/bundles/nonexistent", timeout=30)
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# Admin: Store update
# ---------------------------------------------------------------------------
class TestAdminStore:
    def test_update_store_and_verify(self, session, auth_headers):
        # Get current
        cur = session.get(f"{API}/store", timeout=30).json()
        # Update with marker
        marker = f"TEST_{uuid.uuid4().hex[:6]}"
        payload = {
            "name": cur.get("name", "Dukkank"),
            "name_en": cur.get("name_en", "Dukkank"),
            "tagline": marker,
            "tagline_en": cur.get("tagline_en", ""),
            "whatsapp": cur.get("whatsapp", "9647700000000"),
            "whatsappDisplay": cur.get("whatsappDisplay", "0770 000 0000"),
            "instagram": cur.get("instagram", ""),
        }
        r = session.put(f"{API}/admin/store", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        # Persistence
        r2 = session.get(f"{API}/store", timeout=30)
        assert r2.status_code == 200
        assert r2.json()["tagline"] == marker
        # Restore original
        session.put(f"{API}/admin/store", json={
            "name": cur.get("name", "Dukkank"),
            "name_en": cur.get("name_en", ""),
            "tagline": cur.get("tagline", ""),
            "tagline_en": cur.get("tagline_en", ""),
            "whatsapp": cur.get("whatsapp", ""),
            "whatsappDisplay": cur.get("whatsappDisplay", ""),
            "instagram": cur.get("instagram", ""),
        }, headers=auth_headers, timeout=30)


# ---------------------------------------------------------------------------
# Admin: Games full CRUD
# ---------------------------------------------------------------------------
class TestAdminGamesCRUD:
    test_game_id = f"TEST_game_{uuid.uuid4().hex[:6]}"

    def test_full_crud(self, session, auth_headers):
        gid = self.__class__.test_game_id
        payload = {
            "id": gid,
            "name": "TEST Game",
            "sub": "Test Sub",
            "image": "https://example.com/x.png",
            "gradientFrom": "#111",
            "gradientTo": "#222",
            "four": 10.5,
            "five": 12.5,
            "available": True,
            "bestSeller": False,
        }
        # CREATE
        r = session.post(f"{API}/admin/games", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["id"] == gid
        # Verify via GET list
        games = session.get(f"{API}/games", timeout=30).json()
        assert any(g["id"] == gid for g in games)

        # UPDATE
        payload["name"] = "TEST Game Updated"
        payload["four"] = 99.99
        r = session.put(f"{API}/admin/games/{gid}", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        updated = next(g for g in session.get(f"{API}/games", timeout=30).json() if g["id"] == gid)
        assert updated["name"] == "TEST Game Updated"
        assert updated["four"] == 99.99

        # DELETE
        r = session.delete(f"{API}/admin/games/{gid}", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        # Verify absent
        games = session.get(f"{API}/games", timeout=30).json()
        assert not any(g["id"] == gid for g in games)

        # DELETE non-existing → 404
        r = session.delete(f"{API}/admin/games/{gid}", headers=auth_headers, timeout=30)
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Admin: Subscriptions update
# ---------------------------------------------------------------------------
class TestAdminSubscriptions:
    def test_update_subscription_pricing(self, session, auth_headers):
        subs = session.get(f"{API}/subscriptions", timeout=30).json()
        target = next(s for s in subs if s["id"] == "essential")
        # Modify a duration price
        original = [dict(d) for d in target["durations"]]
        modified = [dict(d) for d in target["durations"]]
        if modified and "four" in modified[0]:
            modified[0]["four"] = 77.77

        payload = {
            "id": "essential",
            "name": target["name"],
            "name_en": target.get("name_en", ""),
            "tagline": target.get("tagline", ""),
            "tagline_en": target.get("tagline_en", ""),
            "accent": target.get("accent", "blue"),
            "durations": modified,
        }
        r = session.put(f"{API}/admin/subscriptions/essential", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        # Verify persistence
        subs2 = session.get(f"{API}/subscriptions", timeout=30).json()
        target2 = next(s for s in subs2 if s["id"] == "essential")
        if target2["durations"]:
            assert target2["durations"][0].get("four") == 77.77
        # Restore
        payload["durations"] = original
        session.put(f"{API}/admin/subscriptions/essential", json=payload, headers=auth_headers, timeout=30)

    def test_update_nonexistent_subscription(self, session, auth_headers):
        payload = {
            "id": "nope", "name": "x", "tagline": "y", "accent": "blue", "durations": []
        }
        r = session.put(f"{API}/admin/subscriptions/nope", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Admin: Bundles full CRUD
# ---------------------------------------------------------------------------
class TestAdminBundlesCRUD:
    bundle_id = f"TEST_bundle_{uuid.uuid4().hex[:6]}"

    def test_full_crud(self, session, auth_headers):
        bid = self.__class__.bundle_id
        payload = {
            "id": bid,
            "subId": "essential",
            "durationId": "1m",
            "gameId": "fc25",
            "tier": "four",
            "bundlePrice": 25.0,
            "available": True,
        }
        # CREATE
        r = session.post(f"{API}/admin/bundles", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        items = session.get(f"{API}/bundles", timeout=30).json()
        assert any(b["id"] == bid for b in items)

        # UPDATE
        payload["bundlePrice"] = 33.33
        r = session.put(f"{API}/admin/bundles/{bid}", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        upd = next(b for b in session.get(f"{API}/bundles", timeout=30).json() if b["id"] == bid)
        assert upd["bundlePrice"] == 33.33

        # DELETE
        r = session.delete(f"{API}/admin/bundles/{bid}", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        items = session.get(f"{API}/bundles", timeout=30).json()
        assert not any(b["id"] == bid for b in items)


# ---------------------------------------------------------------------------
# Sections — homepage section order/visibility
# ---------------------------------------------------------------------------
DEFAULT_SECTION_IDS = [
    "recommender", "essential", "extra", "comparison",
    "bundles", "bundleBuilder", "games", "reviews", "faq",
]


class TestSections:
    def test_get_sections_default_or_persisted(self, session):
        r = session.get(f"{API}/sections", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) == 9
        ids = [s["id"] for s in items]
        assert sorted(ids) == sorted(DEFAULT_SECTION_IDS)
        for s in items:
            assert "id" in s and "visible" in s
            assert isinstance(s["visible"], bool)

    def test_update_sections_unauthenticated(self):
        r = requests.put(f"{API}/admin/sections", json={"sections": []}, timeout=30)
        assert r.status_code == 401

    def test_reorder_and_toggle_visibility_persists(self, session, auth_headers):
        # Build a reordered + hidden payload
        reordered = [
            {"id": "faq", "label": "الأسئلة الشائعة", "visible": True},
            {"id": "recommender", "label": "مساعدك", "visible": False},
            {"id": "essential", "label": "الأساسي", "visible": True},
            {"id": "extra", "label": "الإضافي", "visible": True},
            {"id": "comparison", "label": "مقارنة", "visible": True},
            {"id": "bundles", "label": "باقات", "visible": True},
            {"id": "bundleBuilder", "label": "ابني", "visible": True},
            {"id": "games", "label": "ألعاب", "visible": True},
            {"id": "reviews", "label": "آراء", "visible": True},
        ]
        try:
            r = session.put(f"{API}/admin/sections", json={"sections": reordered},
                            headers=auth_headers, timeout=30)
            assert r.status_code == 200, r.text
            data = r.json()
            assert isinstance(data, list) and len(data) == 9
            assert data[0]["id"] == "faq"
            assert data[1]["id"] == "recommender" and data[1]["visible"] is False

            # Verify persistence via public GET
            r2 = session.get(f"{API}/sections", timeout=30)
            assert r2.status_code == 200
            persisted = r2.json()
            assert [s["id"] for s in persisted] == [s["id"] for s in reordered]
            rec = next(s for s in persisted if s["id"] == "recommender")
            assert rec["visible"] is False
        finally:
            # Reset to default
            default_payload = [
                {"id": sid, "label": "", "visible": True} for sid in DEFAULT_SECTION_IDS
            ]
            session.put(f"{API}/admin/sections", json={"sections": default_payload},
                        headers=auth_headers, timeout=30)

    def test_sections_reset_to_default(self, session):
        # After previous teardown, ordering should match defaults
        r = session.get(f"{API}/sections", timeout=30)
        assert r.status_code == 200
        ids = [s["id"] for s in r.json()]
        assert ids == DEFAULT_SECTION_IDS
        assert all(s["visible"] is True for s in r.json())


# ---------------------------------------------------------------------------
# Iter3: Promo Banner
# ---------------------------------------------------------------------------
class TestPromo:
    def test_get_promo_returns_shape(self, session):
        r = session.get(f"{API}/promo", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ("enabled", "title", "subtitle", "endsAt", "ctaLabel", "ctaHref"):
            assert k in d

    def test_put_promo_unauthenticated(self):
        r = requests.put(f"{API}/admin/promo", json={"enabled": False}, timeout=30)
        assert r.status_code == 401

    def test_put_promo_persists_and_reset(self, session, auth_headers):
        before = session.get(f"{API}/promo", timeout=30).json()
        payload = {
            "enabled": True,
            "title": "TEST_promo_title",
            "subtitle": "TEST_sub",
            "endsAt": "2026-12-31T23:59:00Z",
            "ctaLabel": "TEST_cta",
            "ctaHref": "#test",
        }
        try:
            r = session.put(f"{API}/admin/promo", json=payload, headers=auth_headers, timeout=30)
            assert r.status_code == 200, r.text
            got = session.get(f"{API}/promo", timeout=30).json()
            assert got["enabled"] is True
            assert got["title"] == "TEST_promo_title"
            assert got["ctaLabel"] == "TEST_cta"
        finally:
            # Reset to disabled (per agent context note)
            session.put(f"{API}/admin/promo", json={
                "enabled": False, "title": "", "subtitle": "",
                "endsAt": None, "ctaLabel": "", "ctaHref": ""
            }, headers=auth_headers, timeout=30)


# ---------------------------------------------------------------------------
# Iter3: Social Proof
# ---------------------------------------------------------------------------
DEFAULT_SOCIAL_PROOF_MSGS = [
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


class TestSocialProof:
    def test_get_social_proof(self, session):
        r = session.get(f"{API}/social-proof", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d.get("messages"), list) and len(d["messages"]) >= 1
        assert isinstance(d.get("enabled"), bool)
        assert isinstance(d.get("intervalSeconds"), int)

    def test_put_social_proof_persists_and_reset(self, session, auth_headers):
        payload = {
            "enabled": True,
            "intervalSeconds": 8,
            "messages": ["TEST_msg_1", "TEST_msg_2", "TEST_msg_3"],
        }
        try:
            r = session.put(f"{API}/admin/social-proof", json=payload, headers=auth_headers, timeout=30)
            assert r.status_code == 200, r.text
            got = session.get(f"{API}/social-proof", timeout=30).json()
            assert got["intervalSeconds"] == 8
            assert got["messages"] == ["TEST_msg_1", "TEST_msg_2", "TEST_msg_3"]
        finally:
            # Reset to defaults
            session.put(f"{API}/admin/social-proof", json={
                "enabled": True, "intervalSeconds": 12, "messages": DEFAULT_SOCIAL_PROOF_MSGS,
            }, headers=auth_headers, timeout=30)

    def test_put_social_proof_min_interval(self, session, auth_headers):
        # Server should clamp interval to >= 3
        try:
            r = session.put(f"{API}/admin/social-proof", json={
                "enabled": True, "intervalSeconds": 1, "messages": ["x"],
            }, headers=auth_headers, timeout=30)
            assert r.status_code == 200
            got = session.get(f"{API}/social-proof", timeout=30).json()
            assert got["intervalSeconds"] >= 3
        finally:
            session.put(f"{API}/admin/social-proof", json={
                "enabled": True, "intervalSeconds": 12, "messages": DEFAULT_SOCIAL_PROOF_MSGS,
            }, headers=auth_headers, timeout=30)


# ---------------------------------------------------------------------------
# Iter3: WhatsApp Templates
# ---------------------------------------------------------------------------
class TestWATemplates:
    def test_get_returns_four_keys(self, session):
        r = session.get(f"{API}/wa-templates", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ("general", "productInquiry", "orderHeader", "orderFooter"):
            assert k in d and isinstance(d[k], str)

    def test_put_unauthenticated(self):
        r = requests.put(f"{API}/admin/wa-templates", json={}, timeout=30)
        assert r.status_code == 401

    def test_put_and_reset(self, session, auth_headers):
        original = session.get(f"{API}/wa-templates", timeout=30).json()
        try:
            payload = {
                "general": "TEST general {storeName}",
                "productInquiry": "TEST inquiry {productName}",
                "orderHeader": "TEST header",
                "orderFooter": "TEST footer",
            }
            r = session.put(f"{API}/admin/wa-templates", json=payload, headers=auth_headers, timeout=30)
            assert r.status_code == 200
            got = session.get(f"{API}/wa-templates", timeout=30).json()
            assert got["general"] == "TEST general {storeName}"
            assert got["productInquiry"] == "TEST inquiry {productName}"
        finally:
            session.put(f"{API}/admin/wa-templates", json=original, headers=auth_headers, timeout=30)


# ---------------------------------------------------------------------------
# Iter3: Subscribers
# ---------------------------------------------------------------------------
class TestSubscribers:
    test_email = f"TEST_iter3_{uuid.uuid4().hex[:6]}@example.com"

    def test_signup_returns_code_and_idempotent(self, session, auth_headers):
        email = self.__class__.test_email
        try:
            r = session.post(f"{API}/subscribers", json={"email": email}, timeout=30)
            assert r.status_code == 200, r.text
            d = r.json()
            assert d["email"] == email.lower()
            assert d["alreadyRegistered"] is False
            assert isinstance(d["code"], str)
            assert d["code"].startswith("DUKKANK10-") and len(d["code"]) == len("DUKKANK10-") + 6
            first_code = d["code"]

            # Second post → alreadyRegistered True, same code
            r2 = session.post(f"{API}/subscribers", json={"email": email}, timeout=30)
            assert r2.status_code == 200
            d2 = r2.json()
            assert d2["alreadyRegistered"] is True
            assert d2["code"] == first_code

            # Admin list contains email
            lst = session.get(f"{API}/admin/subscribers", headers=auth_headers, timeout=30)
            assert lst.status_code == 200
            assert any(s["email"] == email.lower() for s in lst.json())
        finally:
            # Cleanup
            session.delete(f"{API}/admin/subscribers/{email}", headers=auth_headers, timeout=30)

    def test_subscribers_list_unauthenticated(self):
        r = requests.get(f"{API}/admin/subscribers", timeout=30)
        assert r.status_code == 401

    def test_delete_unknown_returns_404(self, session, auth_headers):
        r = session.delete(f"{API}/admin/subscribers/NOT_EXIST_{uuid.uuid4().hex}@x.com",
                           headers=auth_headers, timeout=30)
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Iter3: Audit Log
# ---------------------------------------------------------------------------
class TestAudit:
    def test_audit_requires_admin(self):
        r = requests.get(f"{API}/admin/audit?limit=5", timeout=30)
        assert r.status_code == 401

    def test_audit_records_admin_write(self, session, auth_headers):
        # Do an audited action (toggle social proof) and verify a new audit entry appears
        marker = f"TEST_audit_{uuid.uuid4().hex[:6]}"
        # Use a wa-templates update to embed marker
        original = session.get(f"{API}/wa-templates", timeout=30).json()
        try:
            payload = dict(original)
            payload["general"] = marker
            r = session.put(f"{API}/admin/wa-templates", json=payload, headers=auth_headers, timeout=30)
            assert r.status_code == 200
            # Fetch audit log
            a = session.get(f"{API}/admin/audit?limit=20", headers=auth_headers, timeout=30)
            assert a.status_code == 200
            entries = a.json()
            assert isinstance(entries, list) and len(entries) >= 1
            for e in entries[:3]:
                for k in ("actor_email", "action", "target_type", "target_id", "timestamp"):
                    assert k in e
            # Recent entry should reference wa_templates update
            assert any(e["target_type"] == "wa_templates" and e["action"] == "update" for e in entries[:5])
        finally:
            session.put(f"{API}/admin/wa-templates", json=original, headers=auth_headers, timeout=30)


# ---------------------------------------------------------------------------
# Iter3: Image upload
# ---------------------------------------------------------------------------
class TestUpload:
    # Tiny 1x1 PNG bytes
    PNG_BYTES = bytes.fromhex(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
        "890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082"
    )

    def test_upload_unauthenticated(self):
        files = {"file": ("a.png", self.PNG_BYTES, "image/png")}
        r = requests.post(f"{API}/admin/upload", files=files, timeout=30)
        assert r.status_code == 401

    def test_upload_png_success_and_served(self, auth_headers):
        # Use bearer header only (no Content-Type so requests sets multipart boundary)
        h = {"Authorization": auth_headers["Authorization"]}
        files = {"file": ("test.png", self.PNG_BYTES, "image/png")}
        r = requests.post(f"{API}/admin/upload", headers=h, files=files, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["url"].startswith("/api/uploads/")
        assert d["name"].endswith(".png")
        assert d["size"] > 0
        # GET the file
        r2 = requests.get(f"{BASE_URL}{d['url']}", timeout=30)
        assert r2.status_code == 200
        assert r2.content[:4] == b"\x89PNG"

    def test_upload_rejects_non_image(self, auth_headers):
        h = {"Authorization": auth_headers["Authorization"]}
        files = {"file": ("evil.exe", b"MZxxxx", "application/octet-stream")}
        r = requests.post(f"{API}/admin/upload", headers=h, files=files, timeout=30)
        assert r.status_code == 400
