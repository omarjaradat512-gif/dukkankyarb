# PRD — دُكانك (Dukkank)

## Project
متجر اشتراكات وألعاب رقمية (Arabic RTL) — Checkout via WhatsApp deep link, no payment gateway.

## Status: 5 iterations completed
- **Iter 1**: Admin Panel (login, store CRUD, subscriptions CRUD, games CRUD, bundles CRUD)
- **Iter 2**: Sections-order tab, Games editor (3-section layout + live preview)
- **Iter 3**: Live Social Proof, Promo Banner (countdown), WhatsApp Templates, Email Signup, Audit Log, Image Upload
- **Iter 4**: Reviews & FAQ admin, Change Password, Dark Mode, Skeleton Loaders
- **Iter 5 (current)**: Wishlist, Notify-when-available, per-duration Bundle Discount, Analytics dashboard, Comparison badge fix, Dark Mode contrast fixes (default = LIGHT now)

## Architecture
- Backend: FastAPI + Motor (MongoDB) + JWT bcrypt + StaticFiles
- Frontend: React (CRA) + Tailwind + shadcn/ui + react-router-dom v7 + recharts. Arabic RTL.
- Auth: Bearer JWT 24h in localStorage. Admin seeded from env.
- Theme: CSS-variable based light/dark with `.dark` class. **Default = light** (no longer follows OS pref). Persisted in localStorage.
- Wishlist: localStorage only, no auth required.

## Implemented Features

### Public-facing (Customer)
- Hero, Ticker, Recommender quiz, PS+ Essential/Extra subscriptions
- Bundles, **BundleBuilder** with **per-subscription-per-duration discount %** (admin-configurable, no more hardcoded count-based tiers)
- Games grid with details + **Wishlist heart button** (saves to localStorage)
- **NotifyMe dialog** on unavailable games (records customer interest)
- EmailSignup, Reviews (CMS), FAQ (CMS), Comparison table (badge fixed)
- Cart with WhatsApp checkout
- PromoBanner, SocialProofToast
- **Dark Mode** toggle (default = light, persisted)
- Skeleton loaders during initial data fetch
- **Wishlist Drawer** accessible via header heart icon

### Admin Panel (`/admin`) — 12 tabs
1. **الإحصائيات** *(new)* — KPI cards + recharts: 30-day timeline (subscribers + cart events), top-10 cart items, audit-actions pie chart, range selector (7/14/30/90 days)
2. **إعدادات المتجر** — name, tagline, whatsapp, instagram
3. **ترتيب الأقسام** — drag/visibility per section
4. **الاشتراكات** — names, taglines, duration prices (PS4/PS5), **bundleDiscountPct per duration**
5. **الألعاب** — CRUD with image upload + live preview
6. **الباقات** — bundle CRUD
7. **التقييمات** — CRUD with star picker
8. **الأسئلة الشائعة** — CRUD with 10-icon picker
9. **التسويق** — Promo Banner, Social Proof, WhatsApp Templates, Subscribers
10. **طلبات الإشعار** *(new)* — grouped by game; copy-all-contacts; WhatsApp deep-link if phone
11. **سجل التدقيق** — last N admin actions
12. **الحساب** — change password with strength meter

### Backend Endpoints
Public reads: `/api/{store,subscriptions,games,bundles,sections,promo,social-proof,wa-templates,reviews,faqs}`
Auth: `/api/auth/{login,me}`
Public actions: `/api/subscribers` (POST), `/api/notify-requests` (POST), `/api/events/cart-add` (POST)
Admin CRUD: `/api/admin/{store,sections,subscriptions/{id},games/{id},bundles/{id},reviews/{id},faqs/{id},notify-requests/{id},promo,social-proof,wa-templates,subscribers/{email},upload,audit,change-password}`
Analytics: `/api/admin/analytics?days={7|14|30|90}` — returns totals, timeline, topItems, auditActions

## Tests
- **Iter 5 backend pytest: 22/22 pass** (notify, cart-events, analytics, bundleDiscountPct migration & persistence)
- **Iter 4 pytest: 20/20 still pass** (reviews, faqs, change-password regression)
- Iter 1-3 backend: 39/39 still pass
- Frontend visually verified: dark mode professional in all sections, wishlist E2E works, comparison badge unclipped, all 12 admin tabs render

## Test Credentials
`/app/memory/test_credentials.md` — admin@dukkank.com / omar512@@OoD

## Backlog
- P2: Send the discount code via email (SendGrid/Resend)
- P2: Token invalidation on password change
- P2: Rate limiting on POST /api/events/cart-add (analytics abuse prevention)
- P2: Phone/email regex validation on /api/notify-requests
- P3: Multi-admin support
- P3: PWA / offline mode
- P3: Split server.py into routers (now ~1036 lines)
- P3: Add DB index on cart_events.ts and subscribers.created_at for scale
