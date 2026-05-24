# PRD — دُكانك (Dukkank)

## Project
متجر اشتراكات وألعاب رقمية (Arabic RTL) — Checkout via WhatsApp deep link, no payment gateway.

## Status: 4 iterations completed
- **Iter 1**: Admin Panel (login, store CRUD, subscriptions CRUD, games CRUD, bundles CRUD) + English language toggle
- **Iter 2**: Removed English, removed Savings Calc, removed top-ups; improved Games editor (3-section layout + live preview); added Sections-order tab (drag-and-drop)
- **Iter 3**: Live Social Proof, Promo Banner (countdown), WhatsApp Templates, Email Signup (discount codes), Audit Log, Image Upload
- **Iter 4 (current)**: Reviews & FAQ admin management, Change Password from admin panel, Professional Dark Mode (full site + admin), Skeleton Loaders for initial data fetch

## Architecture
- Backend: FastAPI + Motor (MongoDB) + JWT bcrypt + StaticFiles mount for uploads
- Frontend: React (CRA) + Tailwind + shadcn/ui + react-router-dom v7. Arabic RTL only.
- Auth: Bearer JWT 24h in localStorage. Admin seeded from env on startup.
- Theme: CSS variables flipped under `.dark` class; persisted in localStorage; respects `prefers-color-scheme` on first visit.

## Implemented Features

### Public-facing (Customer side)
- Hero, Ticker, Recommender quiz, PS+ Essential/Extra subscriptions
- Bundles, BundleBuilder (no top-ups), Games grid with details
- EmailSignup section (instant DUKKANK10-XXXXXX code on submit)
- Reviews (loaded from API, manageable from admin)
- FAQ (loaded from API, manageable from admin, custom icons)
- Comparison table
- Cart with WhatsApp checkout (uses admin-configured templates)
- **PromoBanner** at top: countdown timer, dismissible per-session
- **SocialProofToast** bottom-left, rotates messages, dismissible per-session
- **Dark Mode** toggle in header (sun/moon switch) — persists across reloads, follows system preference by default
- **Skeleton loaders** during initial data fetch (HeroSkeleton, SubscriptionsSkeleton, GamesSkeleton, SectionSkeleton) — replaces blank "جاري التحميل" screen

### Admin Panel (`/admin`) — 10 tabs
1. **إعدادات المتجر** — name, tagline, whatsapp, instagram
2. **ترتيب الأقسام** — drag/arrows reorder + visibility per section
3. **الاشتراكات** — edit subscription names/taglines + duration prices PS4/PS5
4. **الألعاب** — search, add/edit/delete games; 3-section editor; upload image; live preview
5. **الباقات** — create/edit bundles with sub/duration/game/tier dropdowns
6. **التقييمات** *(new)* — full CRUD on customer reviews, star picker, inline editor
7. **الأسئلة الشائعة** *(new)* — full CRUD on FAQs, 10-icon picker (truck, credit-card, shield-check, etc.), multi-line answers
8. **التسويق** — Promo Banner, Social Proof, WhatsApp Templates, Subscribers list
9. **سجل التدقيق** — last 200 admin actions
10. **الحساب** *(new)* — display admin email + change-password form (current + new + confirm, eye toggle, strength meter)

### Backend Endpoints
- Public reads: `/api/{store,subscriptions,games,bundles,sections,promo,social-proof,wa-templates,reviews,faqs}`
- Auth: `/api/auth/{login,me}`
- Subscribers: POST `/api/subscribers`, `/api/admin/subscribers` GET/DELETE
- Admin CRUD: all `/api/admin/{store,sections,subscriptions/{id},games/{id},bundles/{id},reviews/{id},faqs/{id},promo,social-proof,wa-templates,upload,audit,change-password}`
- Static uploads: `/api/uploads/<filename>`
- Audit log entries on every admin write including password change

## Tests
- Iter 1-3 backend pytest: 39/39 pass (legacy)
- Iter 4 backend pytest: **20/20 pass** — Reviews CRUD, FAQs CRUD, Change Password (happy + wrong current + short new + no token), regression on existing public reads, audit log verification
- Frontend visually verified: dark mode toggle works site-wide; all 10 admin tabs render; Reviews/FAQs/Account tabs all functional

## Test Credentials
`/app/memory/test_credentials.md` — admin@dukkank.com / omar512@@OoD

## Backlog
- P2: Send the discount code via email (currently only displayed in-browser; needs SendGrid/Resend integration)
- P2: Replace login URL with a hard-to-guess prefix
- P2: Token invalidation on password change (currently old JWT remains valid until 24h expiry)
- P3: Rate limiting on /api/auth/login
- P3: Multi-admin support
- P3: PWA / offline mode
- P3: Split server.py into routers (it's ~860 lines)
