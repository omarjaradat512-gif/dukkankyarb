# PRD — دُكانك (Dukkank)

## Status: 6 iterations completed
- **Iter 1-5**: Admin panel basics, dark mode, wishlist, notify-when-available, bundle discount per duration, analytics
- **Iter 6 (current)**: **Full CMS** — every static page text editable from admin in a beautiful section-by-section tab

## Iter 6 Changes (Site Content CMS)
- **Backend**: New `site_content` document in MongoDB settings collection, 11 sections (hero, essential, extra, comparison, bundles, bundleBuilder, games, reviews, faq, emailSignup, footer). GET `/api/content` (public) + PUT `/api/admin/content` (admin). Whitelist + audit log integration.
- **Frontend**: All static text strings replaced with `content.section.field` reads. Components updated: Hero, App.js section renderers, Bundles, BundleBuilder, ComparisonTable, Reviews, FAQ.
- **New Admin Tab "محتوى الموقع" (ContentTab)**: Accordion per section (collapsible), per-section save (not all-or-nothing). Field types supported:
  - `text` (single line)
  - `textarea` (multi-line)
  - `array-string` (e.g. featureBullets) with add/remove/reorder
  - `array-row` (e.g. comparison.rows) with editable columns including bool toggles for ✓/✗ per plan
- **Migration**: backfills missing top-level + sub-keys on existing data so new fields don't appear blank.

## Architecture
- Backend: FastAPI + Motor (MongoDB) + JWT bcrypt + StaticFiles
- Frontend: React (CRA) + Tailwind + shadcn/ui + react-router-dom v7 + recharts. Arabic RTL.
- Auth: Bearer JWT 24h. Admin seeded from env.
- Theme: CSS-variable based light/dark. Default = light.

## Admin Panel — 13 tabs total
1. **الإحصائيات** — KPI cards + recharts
2. **محتوى الموقع** *(new)* — full CMS for all page text
3. **إعدادات المتجر** — name/tagline/whatsapp/instagram
4. **ترتيب الأقسام** — drag/visibility
5. **الاشتراكات** — names, durations (prices PS4/PS5 + bundleDiscountPct)
6. **الألعاب** — CRUD + image upload + preview
7. **الباقات** — bundle CRUD
8. **التقييمات** — CRUD with star picker
9. **الأسئلة الشائعة** — CRUD with 10 icon picker
10. **التسويق** — Promo, Social Proof, WhatsApp Templates, Subscribers
11. **طلبات الإشعار** — grouped by game + WhatsApp deep-link
12. **سجل التدقيق** — last N admin actions
13. **الحساب** — change password

## Backend Endpoints
- Public: `/api/{store,subscriptions,games,bundles,sections,promo,social-proof,wa-templates,reviews,faqs,content}`
- Public actions: `/api/subscribers` POST, `/api/notify-requests` POST, `/api/events/cart-add` POST
- Auth: `/api/auth/{login,me}`
- Admin: `/api/admin/{content,store,sections,subscriptions/*,games/*,bundles/*,reviews/*,faqs/*,notify-requests/*,promo,social-proof,wa-templates,subscribers/*,upload,audit,change-password,analytics}`

## Tests (cumulative)
- **Iter 6 CMS: 21/21 ✅** — content endpoints, partial updates, auth gates, audit log, array shapes
- **Iter 5: 22/22 ✅** still pass — notify, cart events, analytics, bundleDiscountPct
- **Iter 4: 20/20 ✅** still pass — reviews, faqs, change-password
- **Iter 1-3: 39/39 ✅** still pass — base endpoints
- **Total: 102/102 backend tests passing**

## Test Credentials
`/app/memory/test_credentials.md` — admin@dukkank.com / omar512@@OoD

## Backlog
- P2: SendGrid/Resend email integration for discount codes & order notifications
- P2: Token invalidation on password change
- P2: Rate limiting on POST `/api/events/cart-add` to prevent analytics abuse
- P2: Phone/email validation on `/api/notify-requests`
- P2: Deep-merge for content sub-keys (currently full-section overwrite — safe today since FE sends full section, but more robust would be sub-key whitelist)
- P3: Split server.py into routers (~1080 lines now)
- P3: Multi-admin support + roles
- P3: PWA / offline mode
- P3: Per-section Pydantic models for richer content validation
