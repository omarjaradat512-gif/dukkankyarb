"""
Tests for new auth security hardening:
- Rate limiting on /api/auth/login (8 failed attempts / 15min / IP -> 429)
- JWT invalidation on password change (iat < password_changed_at -> 401)

Notes:
- We hit http://localhost:8001 directly to control X-Forwarded-For (per-IP counter).
- We restore the admin password at the very end.
- Rate-limit test runs LAST because it pollutes _login_attempts for that IP.
"""
import os
import time
import jwt
import pytest
import requests

BASE = "http://localhost:8001"
ADMIN_EMAIL = "admin@dukkank.com"
ADMIN_PASSWORD = "omar512@@OoD"
TEMP_PASSWORD = "TempPwd_Test_12345!"


def _h(ip: str):
    return {"X-Forwarded-For": ip, "Content-Type": "application/json"}


# ---------- module-level ordering helper (pytest runs top-to-bottom by default)


# --- 1. login success returns token + resets counter ---
def test_login_success_returns_token_and_user():
    ip = "10.0.0.10"
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      headers=_h(ip))
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 20
    assert data["user"]["email"] == ADMIN_EMAIL
    assert data["user"].get("role") == "admin"
    assert "password_hash" not in data["user"]


def test_jwt_contains_iat_claim():
    ip = "10.0.0.11"
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      headers=_h(ip))
    assert r.status_code == 200
    token = r.json()["token"]
    decoded = jwt.decode(token, options={"verify_signature": False})
    assert "iat" in decoded
    assert isinstance(decoded["iat"], int)
    # iat should be very close to now (within last 60s)
    assert abs(int(time.time()) - decoded["iat"]) < 60
    assert decoded.get("type") == "access"
    assert decoded.get("email") == ADMIN_EMAIL


def test_wrong_password_returns_401():
    ip = "10.0.0.12"
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": "wrong_pwd_xx"},
                      headers=_h(ip))
    assert r.status_code == 401


def test_success_resets_failed_counter():
    """3 failed attempts, then 1 success, then 6 more failed should still NOT trigger 429
    (counter must have been reset by the success)."""
    ip = "10.0.0.13"
    # 3 failed
    for _ in range(3):
        r = requests.post(f"{BASE}/api/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "bad"},
                          headers=_h(ip))
        assert r.status_code == 401
    # success
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      headers=_h(ip))
    assert r.status_code == 200
    # now 6 more failed should all be 401 (because counter reset, limit is 8)
    for i in range(6):
        r = requests.post(f"{BASE}/api/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "bad"},
                          headers=_h(ip))
        assert r.status_code == 401, f"attempt {i}: {r.status_code} {r.text}"


# --- 2. JWT invalidation on password change ---
def test_change_password_invalidates_old_tokens_and_returns_new_valid_token():
    ip = "10.0.0.20"
    current_pwd = ADMIN_PASSWORD
    try:
        # Log in -> token A (issued BEFORE password change)
        r = requests.post(f"{BASE}/api/auth/login",
                          json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                          headers=_h(ip))
        assert r.status_code == 200
        token_a = r.json()["token"]

        # token_a works on /auth/me
        r = requests.get(f"{BASE}/api/auth/me",
                         headers={"Authorization": f"Bearer {token_a}"})
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

        # Wait 1s so password_changed_at > token_a.iat strictly
        time.sleep(1.2)

        # Change password using token_a
        r = requests.put(f"{BASE}/api/admin/change-password",
                         json={"current_password": ADMIN_PASSWORD, "new_password": TEMP_PASSWORD},
                         headers={"Authorization": f"Bearer {token_a}",
                                  "Content-Type": "application/json"})
        assert r.status_code == 200, r.text
        current_pwd = TEMP_PASSWORD  # now we're on TEMP
        body = r.json()
        assert body.get("ok") is True
        assert "token" in body and isinstance(body["token"], str)
        token_b = body["token"]
        assert token_b != token_a

        # token_a should now be REJECTED with 401 "Token invalidated (password changed)"
        r = requests.get(f"{BASE}/api/auth/me",
                         headers={"Authorization": f"Bearer {token_a}"})
        assert r.status_code == 401, r.text
        assert "invalidated" in r.text.lower() or "password changed" in r.text.lower()

        # token_b should be ACCEPTED
        r = requests.get(f"{BASE}/api/auth/me",
                         headers={"Authorization": f"Bearer {token_b}"})
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

        # Also test on another admin endpoint with token_a -> 401, token_b -> 200
        r = requests.get(f"{BASE}/api/admin/audit",
                         headers={"Authorization": f"Bearer {token_a}"})
        assert r.status_code == 401, f"old token must be rejected on admin endpoint, got {r.status_code}"
        r = requests.get(f"{BASE}/api/admin/audit",
                         headers={"Authorization": f"Bearer {token_b}"})
        assert r.status_code == 200, f"new token must work on admin endpoint, got {r.status_code} {r.text}"

        # Login with the NEW password should also work
        ip2 = "10.0.0.21"
        r = requests.post(f"{BASE}/api/auth/login",
                          json={"email": ADMIN_EMAIL, "password": TEMP_PASSWORD},
                          headers=_h(ip2))
        assert r.status_code == 200
        token_c = r.json()["token"]
        r = requests.get(f"{BASE}/api/auth/me",
                         headers={"Authorization": f"Bearer {token_c}"})
        assert r.status_code == 200
    finally:
        # ---- Always restore admin password ----
        if current_pwd != ADMIN_PASSWORD:
            ip_r = "10.0.0.250"
            rr = requests.post(f"{BASE}/api/auth/login",
                               json={"email": ADMIN_EMAIL, "password": current_pwd},
                               headers=_h(ip_r))
            if rr.status_code == 200:
                tok = rr.json()["token"]
                requests.put(f"{BASE}/api/admin/change-password",
                             json={"current_password": current_pwd, "new_password": ADMIN_PASSWORD},
                             headers={"Authorization": f"Bearer {tok}",
                                      "Content-Type": "application/json"})


# --- 3. Rate limiting (run LAST since it pollutes counter for that IP) ---
def test_z_rate_limit_kicks_in_after_8_failed_attempts():
    """Use a fresh IP, 8 failed attempts -> still 401, 9th -> 429.
    Then verify even CORRECT credentials get 429."""
    ip = "10.0.0.99"
    # 8 fails -> all 401
    for i in range(8):
        r = requests.post(f"{BASE}/api/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "bad"},
                          headers=_h(ip))
        assert r.status_code == 401, f"attempt {i}: expected 401, got {r.status_code}"

    # 9th -> 429 with Retry-After
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": "bad"},
                      headers=_h(ip))
    assert r.status_code == 429, r.text
    assert "Retry-After" in r.headers
    retry_after = int(r.headers["Retry-After"])
    assert retry_after >= 60

    # Even CORRECT credentials must be 429 now
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      headers=_h(ip))
    assert r.status_code == 429, f"correct creds should still be rate-limited; got {r.status_code}"


def test_zz_other_ip_unaffected_by_rate_limit():
    """Different X-Forwarded-For -> independent counter."""
    ip = "10.0.0.77"  # fresh
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      headers=_h(ip))
    assert r.status_code == 200, r.text


def test_zzz_admin_password_is_restored():
    """Final sanity: original admin password works from yet another IP."""
    ip = "10.0.0.55"
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      headers=_h(ip))
    assert r.status_code == 200, f"ADMIN PASSWORD NOT RESTORED: {r.text}"
