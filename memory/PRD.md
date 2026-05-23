# PRD — دُكانك (Dukkank)

## Status: 3 iterations completed
- **Iter 1**: Admin Panel (login, store CRUD, subscriptions CRUD, games CRUD, bundles CRUD) + English language toggle
- **Iter 2**: Removed English, removed Savings Calc, removed top-ups; improved Games editor (3-section layout + live preview); added Sections-order tab (drag-and-drop)
- **Iter 3 (current)**: Live Social Proof, Promo Banner (countdown), WhatsApp Templates, Email Signup (discount codes), Audit Log, Image Upload

## Architecture
- Backend: FastAPI + Motor (MongoDB) + JWT bcrypt + StaticFiles mount for uploads
- Frontend: React (CRA) + Tailwind + shadcn/ui + react-router-dom v7. Arabic RTL only.
- Auth: Bearer JWT 24h in localStorage. Admin seeded from env on startup.

## Implemented Features

### Public-facing (Customer side)
- ✅ Hero, Ticker, Recommender quiz, PS+ Essential/Extra subscriptions
- ✅ Bundles, BundleBuilder (no top-ups), Games grid with details
- ✅ EmailSignup section (instant DUKKANK10-XXXXXX code on submit)
- ✅ Reviews, FAQ, Comparison table
- ✅ Cart with WhatsApp checkout (uses admin-configured templates)
- ✅ **PromoBanner** at top: countdown timer, dismissible per-session
- ✅ **SocialProofToast** bottom-left, rotates messages, dismissible per-session

### Admin Panel (`/admin`) — 7 tabs
1. **إعدادات المتجر** — name, tagline, whatsapp, instagram
2. **ترتيب الأقسام** — drag/arrows reorder + visibility per section (10 sections incl. emailSignup)
3. **الاشتراكات** — edit subscription names/taglines + duration prices PS4/PS5
4. **الألعاب** — search, add/edit/delete games; 3-section editor (Basic / Pricing / Visuals); **upload image from device** + URL input; live preview panel
5. **الباقات** — create/edit bundles with sub/duration/game/tier dropdowns
6. **التسويق** — 4 sub-sections:
   - Promo Banner (enable, title, subtitle, datetime-local endsAt, CTA label/href)
   - Social Proof (enable, interval seconds, messages list add/remove)
   - WhatsApp Templates (general / productInquiry / orderHeader / orderFooter with {storeName} and {productName} variables)
   - Subscribers list (table with email/code/date + delete + copy-all-emails)
7. **سجل التدقيق** — last 200 admin actions with action icons, target type, target label, actor email, timestamp. Search + refresh.

### Backend Endpoints
- Public reads: `/api/{store,subscriptions,games,bundles,sections,promo,social-proof,wa-templates}`
- Auth: `/api/auth/{login,me}`
- Subscribers: POST `/api/subscribers` (public signup), `/api/admin/subscribers` GET/DELETE
- Admin CRUD: all `/api/admin/{store,sections,subscriptions/{id},games/{id},bundles/{id},promo,social-proof,wa-templates,upload,audit}`
- Static uploads: `/api/uploads/<filename>` (mounted from /app/backend/uploads/)
- Every admin write logs to `audit_log` collection via fire-and-forget `log_audit()`

## Tests
- ✅ Backend pytest: **39/39 pass** (auth, public, admin CRUD, sections, promo, social-proof, wa-templates, subscribers, audit, upload)
- ✅ Frontend E2E verified: all 7 tabs, all marketing testids, EmailSignup E2E flow with code shown, Promo banner rendering with countdown, SocialProofToast rotating.

## Test Credentials
`/app/memory/test_credentials.md` — admin@dukkank.com / omar512@@OoD

## Backlog
- P1: Color-coding the admin field labels better in dark dialogs (initial issue noted; fixed with `opacity-75` instead of fixed dark color).
- P2: Send the discount code via email (currently only displayed in-browser; needs SendGrid/Resend integration).
- P2: Replace login URL with a hard-to-guess prefix for added obscurity.
- P3: Multi-admin support.
- P3: PWA / offline mode.

## Domain Question (recurring)
Once user maps a custom domain, admin login is reachable at `https://<domain>/admin/login` with the same credentials.
