"""Backend tests for new features:
- Notify-when-available customer interest list
- Cart event tracking
- Admin analytics
- Subscription bundleDiscountPct field + migration
- Regression on existing endpoints
"""

import os
import uuid
import pytest
import requests

BASE_URL = "http://localhost:8001"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@dukkank.com"
ADMIN_PASSWORD = "omar512@@OoD"


# ---------------------------- fixtures ----------------------------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------------------- Notify Requests ----------------------------
class TestNotifyRequests:
    """POST /api/notify-requests + admin list/delete"""

    created_ids = []

    def test_create_notify_request_valid(self, session):
        payload = {
            "gameId": f"TEST_game_{uuid.uuid4().hex[:6]}",
            "contact": f"TEST_962{uuid.uuid4().hex[:8]}",
            "name": "TEST_User",
        }
        r = session.post(f"{API}/notify-requests", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert data.get("alreadyRegistered") is False
        # remember for dedupe test
        TestNotifyRequests._payload = payload

    def test_create_notify_request_dedupe(self, session):
        # Second post with SAME gameId+contact must return alreadyRegistered=True
        r = session.post(f"{API}/notify-requests", json=TestNotifyRequests._payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert data.get("alreadyRegistered") is True

    def test_create_notify_request_empty_contact(self, session):
        r = session.post(
            f"{API}/notify-requests",
            json={"gameId": "TEST_g", "contact": "   ", "name": "x"},
        )
        assert r.status_code == 400, r.text

    def test_admin_list_notify_requests_unauthorized(self, session):
        r = session.get(f"{API}/admin/notify-requests")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    def test_admin_list_notify_requests_authorized_and_sorted(self, session, admin_headers):
        # Create a second known request to verify presence + ordering
        p2 = {
            "gameId": f"TEST_game_{uuid.uuid4().hex[:6]}",
            "contact": f"TEST_962{uuid.uuid4().hex[:8]}",
            "name": "TEST_User2",
        }
        r = session.post(f"{API}/notify-requests", json=p2)
        assert r.status_code == 200
        # Fetch list
        r = session.get(f"{API}/admin/notify-requests", headers=admin_headers)
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 2
        # Check fields
        assert "id" in items[0] and "gameId" in items[0] and "contact" in items[0]
        # Sorted desc by created_at
        timestamps = [it.get("created_at", "") for it in items if it.get("created_at")]
        assert timestamps == sorted(timestamps, reverse=True), "Not sorted desc by created_at"
        # Capture ids for cleanup
        for it in items:
            if (it.get("name") or "").startswith("TEST_") or (it.get("gameId") or "").startswith("TEST_"):
                TestNotifyRequests.created_ids.append(it["id"])

    def test_admin_delete_notify_request_nonexistent(self, session, admin_headers):
        r = session.delete(f"{API}/admin/notify-requests/nonexistent-id-xyz", headers=admin_headers)
        assert r.status_code == 404, r.text

    def test_admin_delete_notify_request_success_and_audit(self, session, admin_headers):
        assert TestNotifyRequests.created_ids, "No TEST_ requests captured to delete"
        rid = TestNotifyRequests.created_ids[0]
        r = session.delete(f"{API}/admin/notify-requests/{rid}", headers=admin_headers)
        assert r.status_code == 200, r.text
        assert r.json().get("deleted") == rid
        # Verify gone
        r2 = session.delete(f"{API}/admin/notify-requests/{rid}", headers=admin_headers)
        assert r2.status_code == 404

        # Verify audit log captured the delete (via analytics auditActions presence of 'delete')
        a = session.get(f"{API}/admin/analytics?days=1", headers=admin_headers)
        assert a.status_code == 200
        actions = {x["action"]: x["count"] for x in a.json().get("auditActions", [])}
        assert actions.get("delete", 0) >= 1, f"Expected 'delete' audit action, got {actions}"

    def test_cleanup_remaining_test_notify_requests(self, session, admin_headers):
        # Best-effort cleanup of any remaining TEST_ entries
        r = session.get(f"{API}/admin/notify-requests", headers=admin_headers)
        if r.status_code == 200:
            for it in r.json():
                if (it.get("name") or "").startswith("TEST_") or (it.get("gameId") or "").startswith("TEST_"):
                    session.delete(f"{API}/admin/notify-requests/{it['id']}", headers=admin_headers)


# ---------------------------- Cart Events ----------------------------
class TestCartEvents:
    def test_cart_add_event_public(self, session):
        payload = {
            "itemType": "subscription",
            "itemId": f"TEST_item_{uuid.uuid4().hex[:6]}",
            "itemName": "TEST_CartItem",
        }
        r = session.post(f"{API}/events/cart-add", json=payload)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

    def test_cart_event_persisted_in_analytics(self, session, admin_headers):
        # Add a uniquely-named event then check analytics topItems / counts
        unique = f"TEST_unique_{uuid.uuid4().hex[:8]}"
        for _ in range(2):
            r = session.post(
                f"{API}/events/cart-add",
                json={"itemType": "game", "itemId": unique, "itemName": unique},
            )
            assert r.status_code == 200

        a = session.get(f"{API}/admin/analytics?days=7", headers=admin_headers)
        assert a.status_code == 200
        data = a.json()
        # totals.cartEvents should be >0
        assert data["totals"]["cartEvents"] >= 2


# ---------------------------- Analytics ----------------------------
class TestAdminAnalytics:
    def test_analytics_unauthorized(self, session):
        r = session.get(f"{API}/admin/analytics?days=7")
        assert r.status_code == 401

    def test_analytics_7_days_structure(self, session, admin_headers):
        r = session.get(f"{API}/admin/analytics?days=7", headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        # Required keys
        for k in ["totals", "timeline", "topItems", "auditActions", "rangeDays"]:
            assert k in d, f"missing key {k}"
        # totals shape
        for k in ["subscribers", "cartEvents", "notifyRequests", "auditLog", "games"]:
            assert k in d["totals"]
            assert isinstance(d["totals"][k], int)
        # timeline length = 7
        assert len(d["timeline"]) == 7, f"Expected 7 days, got {len(d['timeline'])}"
        for day in d["timeline"]:
            assert "date" in day and "subscribers" in day and "cartAdds" in day
        # rangeDays echo
        assert d["rangeDays"] == 7
        # topItems / auditActions are lists
        assert isinstance(d["topItems"], list)
        assert isinstance(d["auditActions"], list)

    def test_analytics_30_days_timeline(self, session, admin_headers):
        r = session.get(f"{API}/admin/analytics?days=30", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert len(d["timeline"]) == 30
        assert d["rangeDays"] == 30


# ---------------------------- Bundle Discount Pct (migration & persistence) ----------------------------
class TestBundleDiscountPct:
    def test_subscriptions_include_bundleDiscountPct(self, session):
        r = session.get(f"{API}/subscriptions")
        assert r.status_code == 200
        subs = r.json()
        assert len(subs) > 0, "No subscriptions returned"
        for sub in subs:
            assert "durations" in sub and len(sub["durations"]) > 0
            for dur in sub["durations"]:
                assert "bundleDiscountPct" in dur, (
                    f"Subscription {sub.get('id')} duration {dur.get('id')} "
                    f"missing bundleDiscountPct"
                )
                assert isinstance(dur["bundleDiscountPct"], (int, float))

    def test_update_subscription_persists_bundleDiscountPct(self, session, admin_headers):
        r = session.get(f"{API}/subscriptions")
        subs = r.json()
        sub = subs[0]
        original_durations = sub["durations"]
        # Mutate bundleDiscountPct
        mutated = []
        for i, dur in enumerate(original_durations):
            new_dur = dict(dur)
            new_dur["bundleDiscountPct"] = 15.5 + i  # unique per duration
            mutated.append(new_dur)
        payload = dict(sub)
        payload["durations"] = mutated

        u = session.put(
            f"{API}/admin/subscriptions/{sub['id']}",
            json=payload,
            headers=admin_headers,
        )
        assert u.status_code == 200, u.text

        # GET to verify persistence
        g = session.get(f"{API}/subscriptions")
        new_subs = {s["id"]: s for s in g.json()}
        verified = new_subs[sub["id"]]
        for i, dur in enumerate(verified["durations"]):
            assert dur["bundleDiscountPct"] == 15.5 + i, (
                f"Expected {15.5 + i}, got {dur['bundleDiscountPct']} for duration {dur['id']}"
            )

        # Restore original values
        restore_payload = dict(sub)
        restore_payload["durations"] = original_durations
        rs = session.put(
            f"{API}/admin/subscriptions/{sub['id']}",
            json=restore_payload,
            headers=admin_headers,
        )
        assert rs.status_code == 200


# ---------------------------- Regression ----------------------------
class TestRegression:
    @pytest.mark.parametrize("endpoint", [
        "/store", "/games", "/bundles", "/reviews", "/faqs",
    ])
    def test_public_endpoints(self, session, endpoint):
        r = session.get(f"{API}{endpoint}")
        assert r.status_code == 200, f"{endpoint} -> {r.status_code} {r.text[:200]}"

    def test_admin_change_password_endpoint_validates(self, session, admin_headers):
        # Use wrong current password — must NOT change real password
        r = session.put(
            f"{API}/admin/change-password",
            json={"current_password": "WRONG_PWD_xyz", "new_password": "AnotherPass1234"},
            headers=admin_headers,
        )
        assert r.status_code == 400, r.text

    def test_admin_password_unchanged_at_end(self, session):
        # Final assertion: admin can still log in with original password
        r = session.post(
            f"{API}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert r.status_code == 200, f"Admin password may have changed! {r.status_code} {r.text}"
