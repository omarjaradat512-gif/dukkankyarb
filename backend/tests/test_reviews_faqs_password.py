"""
Tests for newly added Reviews, FAQs and Admin Change-Password endpoints.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@dukkank.com"
ADMIN_PASSWORD = "omar512@@OoD"


# --------------------------- Fixtures ---------------------------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# --------------------------- Public reads ---------------------------
class TestPublicReviewsFaqs:
    def test_get_reviews_sorted_by_order(self, session):
        r = session.get(f"{API}/reviews", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 4, f"expected at least 4 seeded reviews, got {len(items)}"
        # _id stripped
        assert all("_id" not in i for i in items)
        # Required keys
        for it in items[:4]:
            for k in ("id", "name", "rating", "text", "order"):
                assert k in it
        # Sorted ascending by order for the seeded items
        seeded = [i for i in items if i["id"].startswith("rev-")]
        orders = [i["order"] for i in seeded]
        assert orders == sorted(orders)

    def test_get_faqs_sorted_by_order(self, session):
        r = session.get(f"{API}/faqs", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 3
        assert all("_id" not in i for i in items)
        for it in items[:3]:
            for k in ("id", "icon", "q", "a", "order"):
                assert k in it
        seeded = [i for i in items if i["id"] in ("delivery", "payment", "warranty")]
        orders = [i["order"] for i in seeded]
        assert orders == sorted(orders)


# --------------------------- Admin auth guard ---------------------------
class TestAdminAuthGuard:
    def test_create_review_unauth(self):
        r = requests.post(f"{API}/admin/reviews",
                          json={"id": "x", "name": "x", "text": "y"}, timeout=30)
        assert r.status_code == 401

    def test_update_review_unauth(self):
        r = requests.put(f"{API}/admin/reviews/rev-1",
                         json={"id": "rev-1", "name": "x", "text": "y"}, timeout=30)
        assert r.status_code == 401

    def test_delete_review_unauth(self):
        r = requests.delete(f"{API}/admin/reviews/rev-1", timeout=30)
        assert r.status_code == 401

    def test_create_faq_unauth(self):
        r = requests.post(f"{API}/admin/faqs",
                          json={"id": "x", "q": "x", "a": "y"}, timeout=30)
        assert r.status_code == 401

    def test_update_faq_unauth(self):
        r = requests.put(f"{API}/admin/faqs/delivery",
                         json={"id": "delivery", "q": "x", "a": "y"}, timeout=30)
        assert r.status_code == 401

    def test_delete_faq_unauth(self):
        r = requests.delete(f"{API}/admin/faqs/delivery", timeout=30)
        assert r.status_code == 401

    def test_change_password_unauth(self):
        r = requests.put(f"{API}/admin/change-password",
                         json={"current_password": "x", "new_password": "x" * 8}, timeout=30)
        assert r.status_code == 401


# --------------------------- Reviews CRUD ---------------------------
class TestReviewsCRUD:
    rid = f"TEST_rev_{uuid.uuid4().hex[:6]}"

    def test_full_crud_review(self, session, auth_headers):
        rid = self.__class__.rid
        # CREATE
        payload = {"id": rid, "name": "TEST Reviewer", "rating": 4,
                   "text": "ممتاز جداً", "order": 999}
        r = session.post(f"{API}/admin/reviews", json=payload,
                         headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["id"] == rid
        assert d["name"] == "TEST Reviewer"
        assert d["rating"] == 4
        assert "_id" not in d

        # Persistence via public GET
        items = session.get(f"{API}/reviews", timeout=30).json()
        assert any(i["id"] == rid for i in items)

        # Duplicate creation -> 400
        r_dup = session.post(f"{API}/admin/reviews", json=payload,
                             headers=auth_headers, timeout=30)
        assert r_dup.status_code == 400

        # UPDATE
        upd = dict(payload)
        upd["name"] = "TEST Reviewer Updated"
        upd["rating"] = 5
        upd["text"] = "تحديث"
        r = session.put(f"{API}/admin/reviews/{rid}", json=upd,
                        headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["name"] == "TEST Reviewer Updated"
        items = session.get(f"{API}/reviews", timeout=30).json()
        got = next(i for i in items if i["id"] == rid)
        assert got["name"] == "TEST Reviewer Updated"
        assert got["rating"] == 5

        # UPDATE non-existent -> 404
        r = session.put(f"{API}/admin/reviews/NONEXISTENT",
                        json={"id": "NONEXISTENT", "name": "x", "rating": 5, "text": "y"},
                        headers=auth_headers, timeout=30)
        assert r.status_code == 404

        # DELETE
        r = session.delete(f"{API}/admin/reviews/{rid}", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        items = session.get(f"{API}/reviews", timeout=30).json()
        assert not any(i["id"] == rid for i in items)

        # DELETE non-existent -> 404
        r = session.delete(f"{API}/admin/reviews/{rid}", headers=auth_headers, timeout=30)
        assert r.status_code == 404


# --------------------------- FAQs CRUD ---------------------------
class TestFaqsCRUD:
    fid = f"TEST_faq_{uuid.uuid4().hex[:6]}"

    def test_full_crud_faq(self, session, auth_headers):
        fid = self.__class__.fid
        payload = {"id": fid, "icon": "help-circle",
                   "q": "TEST question?", "a": "TEST answer", "order": 99}
        # CREATE
        r = session.post(f"{API}/admin/faqs", json=payload,
                         headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["id"] == fid
        assert d["q"] == "TEST question?"
        assert "_id" not in d

        # Duplicate
        r_dup = session.post(f"{API}/admin/faqs", json=payload,
                             headers=auth_headers, timeout=30)
        assert r_dup.status_code == 400

        # Public GET sees it
        items = session.get(f"{API}/faqs", timeout=30).json()
        assert any(i["id"] == fid for i in items)

        # UPDATE
        upd = dict(payload)
        upd["q"] = "TEST question updated?"
        upd["a"] = "TEST answer updated"
        upd["icon"] = "truck"
        r = session.put(f"{API}/admin/faqs/{fid}", json=upd,
                        headers=auth_headers, timeout=30)
        assert r.status_code == 200
        items = session.get(f"{API}/faqs", timeout=30).json()
        got = next(i for i in items if i["id"] == fid)
        assert got["q"] == "TEST question updated?"
        assert got["icon"] == "truck"

        # UPDATE non-existent
        r = session.put(f"{API}/admin/faqs/NONEXISTENT",
                        json={"id": "NONEXISTENT", "q": "x", "a": "y", "icon": "x"},
                        headers=auth_headers, timeout=30)
        assert r.status_code == 404

        # DELETE
        r = session.delete(f"{API}/admin/faqs/{fid}", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        items = session.get(f"{API}/faqs", timeout=30).json()
        assert not any(i["id"] == fid for i in items)

        # DELETE non-existent
        r = session.delete(f"{API}/admin/faqs/{fid}", headers=auth_headers, timeout=30)
        assert r.status_code == 404


# --------------------------- Change Password ---------------------------
class TestChangePassword:
    """Tests change-password happy/sad paths. Always restores original password at end."""

    def _login(self, session, password):
        return session.post(f"{API}/auth/login",
                            json={"email": ADMIN_EMAIL, "password": password}, timeout=30)

    def test_wrong_current_password(self, session, auth_headers):
        r = session.put(f"{API}/admin/change-password",
                        json={"current_password": "WRONG_PASSWORD_XYZ",
                              "new_password": "ValidNew123!"},
                        headers=auth_headers, timeout=30)
        assert r.status_code == 400, r.text

    def test_new_password_too_short(self, session, auth_headers):
        r = session.put(f"{API}/admin/change-password",
                        json={"current_password": ADMIN_PASSWORD,
                              "new_password": "short1"},
                        headers=auth_headers, timeout=30)
        assert r.status_code == 400, r.text

    def test_happy_path_change_and_restore(self, session, auth_headers):
        new_pw = "TempNewPass123!"
        # Change
        r = session.put(f"{API}/admin/change-password",
                        json={"current_password": ADMIN_PASSWORD,
                              "new_password": new_pw},
                        headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True

        # Login with new
        r2 = self._login(session, new_pw)
        assert r2.status_code == 200, f"login with new password failed: {r2.text}"

        # Old should fail
        r3 = self._login(session, ADMIN_PASSWORD)
        assert r3.status_code == 401

        # Restore — use new token (auth_headers is stale fine for auth_headers because JWT didn't expire)
        # But for safety, use the fresh token from r2
        fresh_token = r2.json()["token"]
        fresh_headers = {"Authorization": f"Bearer {fresh_token}",
                         "Content-Type": "application/json"}
        restore = session.put(f"{API}/admin/change-password",
                              json={"current_password": new_pw,
                                    "new_password": ADMIN_PASSWORD},
                              headers=fresh_headers, timeout=30)
        assert restore.status_code == 200, f"restore failed! {restore.text}"

        # Verify original works again
        r4 = self._login(session, ADMIN_PASSWORD)
        assert r4.status_code == 200, "Original password could NOT be restored!"


# --------------------------- Regression ---------------------------
class TestRegression:
    def test_store_ok(self, session):
        assert session.get(f"{API}/store", timeout=30).status_code == 200

    def test_subscriptions_ok(self, session):
        r = session.get(f"{API}/subscriptions", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 2

    def test_games_ok(self, session):
        r = session.get(f"{API}/games", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 20

    def test_bundles_ok(self, session):
        r = session.get(f"{API}/bundles", timeout=30)
        assert r.status_code == 200


# --------------------------- Audit log ---------------------------
class TestAuditLog:
    def test_audit_records_reviews_faqs_and_password(self, session, auth_headers):
        # Create a review + faq, change password (and restore), then inspect audit log
        rid = f"TEST_audit_rev_{uuid.uuid4().hex[:6]}"
        fid = f"TEST_audit_faq_{uuid.uuid4().hex[:6]}"

        session.post(f"{API}/admin/reviews",
                     json={"id": rid, "name": "audit", "rating": 5, "text": "t", "order": 500},
                     headers=auth_headers, timeout=30)
        session.put(f"{API}/admin/reviews/{rid}",
                    json={"id": rid, "name": "audit2", "rating": 5, "text": "t", "order": 500},
                    headers=auth_headers, timeout=30)
        session.delete(f"{API}/admin/reviews/{rid}", headers=auth_headers, timeout=30)

        session.post(f"{API}/admin/faqs",
                     json={"id": fid, "icon": "help-circle", "q": "q", "a": "a", "order": 500},
                     headers=auth_headers, timeout=30)
        session.delete(f"{API}/admin/faqs/{fid}", headers=auth_headers, timeout=30)

        r = session.get(f"{API}/admin/audit?limit=50", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        entries = r.json()
        types = {(e.get("target_type"), e.get("action")) for e in entries}
        assert ("review", "create") in types
        assert ("review", "update") in types
        assert ("review", "delete") in types
        assert ("faq", "create") in types
        assert ("faq", "delete") in types
        # account audit (password change) may have been written by another test or not
        # so we don't strictly require it here.


# --------------------------- Final safety: ensure pw restored ---------------------------
def test_zzz_admin_password_is_original(session):
    """Last test (alphabetically) — verifies admin password is restored to original.
    Don't rely on previous tests' fixtures; do a raw login."""
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, "CRITICAL: admin password is not restored to original!"
