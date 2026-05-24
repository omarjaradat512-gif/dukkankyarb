"""Backend tests for the new CMS content endpoints.

Coverage:
- GET /api/content (public) — returns all 11 sections, omits _id/id
- PUT /api/admin/content — auth required, partial update, whitelist enforcement
- Round-trip of complex shapes (comparison.rows, essential.featureBullets)
- Audit log entry recorded with action='update', target_type='content'
- Regression on: /api/reviews, /api/faqs, /api/store, /api/subscriptions, /api/admin/analytics
- Idempotent: saves originals, mutates, restores at end
"""

import copy
import pytest
import requests

BASE_URL = "http://localhost:8001"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@dukkank.com"
ADMIN_PASSWORD = "omar512@@OoD"

EXPECTED_SECTIONS = {
    "hero", "essential", "extra", "comparison", "bundles",
    "bundleBuilder", "games", "reviews", "faq", "emailSignup", "footer",
}


# ---------------------------- fixtures ----------------------------
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def original_content():
    r = requests.get(f"{API}/content")
    assert r.status_code == 200
    return copy.deepcopy(r.json())


@pytest.fixture(scope="module", autouse=True)
def restore_content_after_module(original_content, admin_headers):
    """Auto-runs after the module: restores content to whatever was there at start."""
    yield
    # restore full snapshot (admin PUT whitelists by top-level keys)
    r = requests.put(f"{API}/admin/content", json=original_content, headers=admin_headers)
    assert r.status_code == 200, f"Failed to restore content: {r.text}"


# ============================ GET /api/content ============================
class TestGetContent:
    def test_get_returns_200(self):
        r = requests.get(f"{API}/content")
        assert r.status_code == 200

    def test_get_contains_all_11_sections(self):
        r = requests.get(f"{API}/content")
        data = r.json()
        assert isinstance(data, dict)
        missing = EXPECTED_SECTIONS - set(data.keys())
        assert not missing, f"Missing sections: {missing}"

    def test_get_omits_mongo_id_and_id(self):
        r = requests.get(f"{API}/content")
        data = r.json()
        assert "_id" not in data
        assert "id" not in data

    def test_hero_has_expected_keys(self):
        data = requests.get(f"{API}/content").json()
        hero = data["hero"]
        for k in ("badge", "titleLine1", "titleLine2", "subtitle", "ctaBrowse", "ctaWhatsApp"):
            assert k in hero, f"hero missing key {k}"

    def test_comparison_rows_is_list_of_dicts(self):
        data = requests.get(f"{API}/content").json()
        rows = data["comparison"]["rows"]
        assert isinstance(rows, list) and len(rows) >= 1
        for row in rows:
            assert "feature" in row
            assert "essential" in row
            assert "extra" in row

    def test_essential_featurebullets_is_list_of_strings(self):
        data = requests.get(f"{API}/content").json()
        bullets = data["essential"]["featureBullets"]
        assert isinstance(bullets, list) and len(bullets) >= 1
        assert all(isinstance(s, str) for s in bullets)


# ============================ PUT /api/admin/content ============================
class TestUpdateContent:
    def test_put_without_token_returns_401(self):
        r = requests.put(f"{API}/admin/content", json={"hero": {"badge": "x"}})
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}: {r.text}"

    def test_put_with_invalid_token_returns_401(self):
        r = requests.put(
            f"{API}/admin/content",
            json={"hero": {"badge": "x"}},
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert r.status_code == 401

    def test_put_empty_payload_returns_400(self, admin_headers):
        r = requests.put(f"{API}/admin/content", json={}, headers=admin_headers)
        assert r.status_code == 400

    def test_put_only_unknown_keys_returns_400(self, admin_headers):
        r = requests.put(
            f"{API}/admin/content",
            json={"unknownSection": {"foo": "bar"}, "another_bad": 1},
            headers=admin_headers,
        )
        assert r.status_code == 400, f"Expected 400 when no valid keys; got {r.status_code}"

    def test_partial_update_only_touches_provided_section(self, admin_headers, original_content):
        # Mutate only `hero.badge` — `footer.copyright` must remain unchanged.
        new_badge = "TEST_BADGE_PARTIAL_123"
        original_footer = copy.deepcopy(original_content["footer"])

        r = requests.put(
            f"{API}/admin/content",
            json={"hero": {**original_content["hero"], "badge": new_badge}},
            headers=admin_headers,
        )
        assert r.status_code == 200, r.text

        # Verify via fresh GET
        fresh = requests.get(f"{API}/content").json()
        assert fresh["hero"]["badge"] == new_badge
        assert fresh["footer"] == original_footer, "footer was mutated by a hero-only update"

    def test_unknown_top_level_keys_are_ignored_when_mixed_with_valid(self, admin_headers, original_content):
        # When both a valid and an invalid section are sent, request should succeed
        # (valid one sanitized through), invalid one ignored.
        marker = "TEST_REVIEWS_EYEBROW_456"
        payload = {
            "reviews": {**original_content["reviews"], "eyebrow": marker},
            "evilSection": {"x": 1},
            "__proto__": "bad",
        }
        r = requests.put(f"{API}/admin/content", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text

        fresh = requests.get(f"{API}/content").json()
        assert fresh["reviews"]["eyebrow"] == marker
        assert "evilSection" not in fresh
        assert "__proto__" not in fresh

    def test_comparison_rows_round_trip(self, admin_headers):
        new_rows = [
            {"feature": "TEST_feature_A", "essential": True, "extra": True},
            {"feature": "TEST_feature_B", "essential": False, "extra": True},
            {"feature": "TEST_feature_C", "essential": True, "extra": False},
        ]
        r = requests.put(
            f"{API}/admin/content",
            json={"comparison": {"rows": new_rows}},
            headers=admin_headers,
        )
        assert r.status_code == 200, r.text

        fresh = requests.get(f"{API}/content").json()
        got_rows = fresh["comparison"]["rows"]
        assert got_rows == new_rows, f"round-trip mismatch: {got_rows}"

    def test_essential_feature_bullets_round_trip(self, admin_headers):
        new_bullets = ["TEST_bullet_one", "TEST_bullet_two", "TEST_bullet_three"]
        r = requests.put(
            f"{API}/admin/content",
            json={"essential": {"featureBullets": new_bullets}},
            headers=admin_headers,
        )
        assert r.status_code == 200, r.text

        fresh = requests.get(f"{API}/content").json()
        assert fresh["essential"]["featureBullets"] == new_bullets

    def test_response_omits_mongo_id_and_id(self, admin_headers, original_content):
        r = requests.put(
            f"{API}/admin/content",
            json={"hero": original_content["hero"]},
            headers=admin_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert "_id" not in data
        assert "id" not in data


# ============================ Audit log ============================
class TestAuditLog:
    def test_update_creates_audit_entry(self, admin_headers, original_content):
        # Trigger an update
        r = requests.put(
            f"{API}/admin/content",
            json={"footer": {**original_content["footer"], "tagline": "TEST_AUDIT_TAGLINE_789"}},
            headers=admin_headers,
        )
        assert r.status_code == 200

        # Fetch audit log
        logs_resp = requests.get(f"{API}/admin/audit", headers=admin_headers)
        if logs_resp.status_code == 404:
            pytest.skip("Audit-log listing endpoint not exposed; cannot verify entry directly")
        assert logs_resp.status_code == 200, logs_resp.text
        logs = logs_resp.json()
        if isinstance(logs, dict) and "items" in logs:
            logs = logs["items"]
        # Find at least one entry with action='update' and target_type='content'
        match = [e for e in logs if e.get("action") == "update" and e.get("target_type") == "content"]
        assert match, f"No audit entry recorded for content update; got: {logs[:5]}"


# ============================ Regression ============================
class TestRegression:
    def test_reviews_endpoint(self):
        r = requests.get(f"{API}/reviews")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 1
        assert "text" in data[0]

    def test_faqs_endpoint(self):
        r = requests.get(f"{API}/faqs")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 1
        assert "q" in data[0] and "a" in data[0]

    def test_store_endpoint(self):
        r = requests.get(f"{API}/store")
        assert r.status_code == 200
        data = r.json()
        assert data.get("name")
        assert data.get("whatsapp")

    def test_subscriptions_have_bundle_discount(self):
        r = requests.get(f"{API}/subscriptions")
        assert r.status_code == 200
        subs = r.json()
        assert isinstance(subs, list) and len(subs) >= 1
        for sub in subs:
            for d in sub.get("durations", []):
                assert "bundleDiscountPct" in d, f"sub {sub.get('id')} duration {d.get('id')} missing bundleDiscountPct"

    def test_admin_analytics(self, admin_headers):
        r = requests.get(f"{API}/admin/analytics", headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, dict)
