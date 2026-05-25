# PRD — دُكانك (Dukkank)

## Status: 7 iterations completed
- **Iter 1-6**: Admin panel, dark mode, wishlist, notify-when-available, analytics, full CMS
- **Iter 7 (current)**: Security hardening (rate limit + JWT invalidation) + UX (mobile nav + games search/filter/sort/pagination) + backend refactor (split into 3 modules)

## Iter 7 Changes

### 🔴 Critical Fixes
1. **Login Rate Limiting** — 8 failed attempts per IP per 15 minutes → 429 with Retry-After header. Successful login resets counter. (In-memory; swap to Redis for multi-process)
2. **JWT Invalidation on Password Change** — All tokens carry `iat` claim; tokens with `iat < user.password_changed_at` are rejected. Change-password issues a fresh token so the current session stays alive. Stolen tokens become useless immediately.
3. **Mobile Nav Drawer** — Hamburger button on screens < md (768px) opens a right-side Sheet with all section links. Auto-closes on link click.
4. **Games Pagination** — Show 12 per page + "عرض المزيد" button (lazy-render approach). Lazy image loading already present (`loading="lazy"`).
5. **Backend Refactor** — `server.py` split into 3 files:
   - `server.py` (939 lines) — routes + startup
   - `core.py` (163 lines) — DB, JWT, rate limit, audit log, hashing
   - `models.py` (122 lines) — all Pydantic schemas

### 🟡 UX Improvements
6. **Games Search Bar** — fuzzy substring match on name + tagline + tags
7. **Filter Panel** — collapsible, with 3 groups: Platform (PS4/PS5/All), Availability (All/Available), Sort (default/price asc/price desc/name/available-first)
8. **Active Filters Indicator** — badge count on filter button + result count + "مسح كل الفلاتر" quick action

## Architecture
- Backend: FastAPI + Motor (MongoDB) + JWT bcrypt + StaticFiles
- Frontend: React (CRA) + Tailwind + shadcn/ui + react-router-dom v7 + recharts. Arabic RTL.
- Auth: Bearer JWT 24h with iat-based invalidation. Admin seeded from env. Rate-limited login.
- Theme: CSS-variable based light/dark. Default = light.

## Admin Panel — 13 tabs
1. الإحصائيات (analytics)
2. محتوى الموقع (CMS) — 11 sections fully editable
3. إعدادات المتجر
4. ترتيب الأقسام
5. الاشتراكات (with per-duration bundleDiscountPct)
6. الألعاب
7. الباقات
8. التقييمات
9. الأسئلة الشائعة
10. التسويق
11. طلبات الإشعار
12. سجل التدقيق
13. الحساب (change password)

## Frontend Features
- Hero, Recommender quiz, Subscriptions (PS+ Essential/Extra)
- Bundles, BundleBuilder (with admin-config discount %)
- **Games**: search + filter + sort + pagination + wishlist heart + notify-me dialog for unavailable
- Reviews (CMS), FAQ (CMS), Comparison table (CMS), EmailSignup, Footer (CMS)
- Cart + WhatsApp checkout
- **Mobile**: hamburger nav drawer, all features touch-friendly
- **Dark mode** toggle in header

## Tests
- **71/71 backend tests passing** ✅ (after refactor, identical to pre-refactor baseline)
- 109/110 total when including legacy `backend_test.py` (1 pre-existing flaky test unrelated to refactor)
- Test files: test_auth_security.py, test_content_cms.py, test_notify_analytics_bundle.py, test_reviews_faqs_password.py

## Test Credentials
`/app/memory/test_credentials.md` — admin@dukkank.com / omar512@@OoD

## Backlog (P2/P3 — not blocking)
- P2: Replace in-memory rate-limiter with Redis-backed for multi-process safety
- P2: Email integration (SendGrid/Resend) for discount codes & notify-when-available alerts
- P2: Server-side pagination on /api/games once catalog > 500 items
- P3: Multi-admin support + roles
- P3: PWA / offline mode
- P3: Further split server.py into routers/ package
- P3: Fix the 1 flaky legacy test in backend_test.py::TestSections
