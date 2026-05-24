import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { Toaster } from "sonner";
import { CartProvider } from "./contexts/CartContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { DataProvider, useStoreData } from "./contexts/DataContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Ticker } from "./components/Ticker";
import { SubscriptionCard } from "./components/SubscriptionCard";
import { GameCard } from "./components/GameCard";
import { CartDrawer } from "./components/CartDrawer";
import { Footer } from "./components/Footer";
import { ComparisonTable } from "./components/ComparisonTable";
import { Reviews } from "./components/Reviews";
import { FAQ } from "./components/FAQ";
import { Bundles } from "./components/Bundles";
import { BundleBuilder } from "./components/BundleBuilder";
import { Recommender } from "./components/Recommender";
import { CompareButton } from "./components/GameCompare";
import { PromoBanner } from "./components/PromoBanner";
import { SocialProofToast } from "./components/SocialProofToast";
import { EmailSignup } from "./components/EmailSignup";
import { HomeSkeleton } from "./components/Skeletons";
import { WishlistDrawer } from "./components/WishlistDrawer";
import GameDetail from "./pages/GameDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { MessageCircle } from "lucide-react";
import { quickInquiry } from "./lib/whatsapp";

const SECTION_RENDERERS = {
    recommender: () => <Recommender />,
    essential: ({ subscriptions, content }) => {
        const essential = subscriptions.find((s) => s.id === "essential");
        if (!essential) return null;
        const c = content.essential || {};
        return (
            <section
                id="essential"
                data-testid="essential-section"
                className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20"
            >
                <SectionHeader
                    eyebrow={c.eyebrow}
                    title={c.title}
                    description={c.description}
                />
                <div className="grid md:grid-cols-2 gap-6 sm:gap-8 stagger">
                    <SubscriptionCard sub={essential} />
                    <FeatureHighlight
                        title={c.featureTitle}
                        bullets={c.featureBullets || []}
                    />
                </div>
            </section>
        );
    },
    extra: ({ subscriptions, content }) => {
        const extra = subscriptions.find((s) => s.id === "extra");
        if (!extra) return null;
        const c = content.extra || {};
        return (
            <section
                id="extra"
                data-testid="extra-section"
                className="bg-white/60 border-y border-[hsl(var(--brand-ink))]/10"
            >
                <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
                    <SectionHeader
                        eyebrow={c.eyebrow}
                        title={c.title}
                        description={c.description}
                        accent="red"
                    />
                    <div className="grid md:grid-cols-2 gap-6 sm:gap-8 stagger">
                        <FeatureHighlight
                            title={c.featureTitle}
                            bullets={c.featureBullets || []}
                            accent="red"
                        />
                        <SubscriptionCard sub={extra} />
                    </div>
                </div>
            </section>
        );
    },
    comparison: () => <ComparisonTable />,
    bundles: () => <Bundles />,
    bundleBuilder: () => <BundleBuilder />,
    games: ({ games, store, waTemplates, content }) => {
        const c = content.games || {};
        return (
            <section
                id="games"
                data-testid="games-section"
                className="bg-white/60 border-y border-[hsl(var(--brand-ink))]/10"
            >
                <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
                        <SectionHeader
                            eyebrow={c.eyebrow}
                            title={c.title}
                            description={c.description}
                        />
                        <div className="shrink-0">
                            <CompareButton />
                        </div>
                    </div>
                    <div
                        data-testid="games-grid"
                        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 stagger"
                    >
                        {games.map((g) => (
                            <GameCard key={g.id} game={g} />
                        ))}
                    </div>

                    <div className="mt-12 rounded-3xl bg-[hsl(var(--brand-blue-deep))] text-[hsl(var(--brand-cream))] p-8 sm:p-12 relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-44 h-44 keffiyeh-pattern opacity-30 rotate-12" />
                        <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-6">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-bold leading-tight">
                                    {c.customGameTitle}
                                </h3>
                                <p className="opacity-85 mt-2 text-sm sm:text-base">
                                    {c.customGameSubtitle}
                                </p>
                            </div>
                            <button
                                onClick={() => quickInquiry("لعبة مخصصة بطلب عميل", store, waTemplates)}
                                data-testid="cta-custom-game"
                                className="inline-flex items-center justify-center gap-2 rounded-full px-6 h-12 bg-[#25D366] text-white font-semibold hover:bg-[#1DA851] transition-colors w-fit"
                            >
                                <MessageCircle className="w-4 h-4 wa-pulse" />
                                {c.customGameCta}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    },
    reviews: () => <Reviews />,
    emailSignup: () => <EmailSignup />,
    faq: () => <FAQ />,
};

function HomePage() {
    const [cartOpen, setCartOpen] = useState(false);
    const [wishOpen, setWishOpen] = useState(false);
    const { subscriptions, games, store, sections, waTemplates, content, loading } = useStoreData();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const p = params.get("p");
        if (p && p.startsWith("game-")) {
            const id = p.slice(5);
            setTimeout(() => {
                const el = document.getElementById(`game-${id}`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    el.style.transition = "box-shadow 0.5s ease";
                    el.style.boxShadow = "0 0 0 4px hsl(var(--brand-red) / 0.6)";
                    setTimeout(() => {
                        el.style.boxShadow = "";
                    }, 2200);
                }
            }, 800);
        }
    }, []);

    if (loading && games.length === 0) {
        return (
            <div className="min-h-screen bg-[hsl(var(--brand-cream))] grain-bg" data-testid="app-root">
                <Header onOpenCart={() => setCartOpen(true)} onOpenWishlist={() => setWishOpen(true)} />
                <HomeSkeleton />
                <Footer />
            </div>
        );
    }

    const visibleSections = (sections || []).filter((s) => s.visible !== false);

    return (
        <div
            className="min-h-screen bg-[hsl(var(--brand-cream))] grain-bg"
            data-testid="app-root"
        >
            <Header onOpenCart={() => setCartOpen(true)} onOpenWishlist={() => setWishOpen(true)} />
            <PromoBanner />
            <Hero />
            <Ticker />

            {visibleSections.map((s) => {
                const Renderer = SECTION_RENDERERS[s.id];
                if (!Renderer) return null;
                return (
                    <Renderer
                        key={s.id}
                        subscriptions={subscriptions}
                        games={games}
                        store={store}
                        waTemplates={waTemplates}
                        content={content}
                    />
                );
            })}

            <Footer />

            <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
            <WishlistDrawer open={wishOpen} onOpenChange={setWishOpen} />
            <SocialProofToast />

            <button
                onClick={() => quickInquiry(null, store, waTemplates)}
                data-testid="floating-whatsapp"
                aria-label="تواصل عبر واتساب"
                className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/40 flex items-center justify-center hover:bg-[#1DA851] transition-colors wa-pulse"
            >
                <MessageCircle className="w-6 h-6" />
            </button>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <LanguageProvider>
                    <AuthProvider>
                        <DataProvider>
                            <CurrencyProvider>
                                <WishlistProvider>
                                    <CartProvider>
                                        <Routes>
                                            <Route path="/" element={<HomePage />} />
                                            <Route path="/game/:id" element={<GameDetail />} />
                                            <Route path="/admin/login" element={<AdminLogin />} />
                                            <Route path="/admin" element={<AdminDashboard />} />
                                        </Routes>
                                        <Toaster
                                            position="top-center"
                                            richColors
                                            closeButton
                                            toastOptions={{
                                                style: {
                                                    fontFamily: "'Tajawal', sans-serif",
                                                    direction: "rtl",
                                                    textAlign: "right",
                                                },
                                            }}
                                        />
                                    </CartProvider>
                                </WishlistProvider>
                            </CurrencyProvider>
                        </DataProvider>
                    </AuthProvider>
                </LanguageProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

const SectionHeader = ({ eyebrow, title, description, accent = "blue" }) => (
    <div className="mb-8 sm:mb-12 max-w-3xl">
        <div
            className={`inline-block text-xs font-bold uppercase tracking-[0.18em] mb-3 ${
                accent === "red"
                    ? "text-[hsl(var(--brand-red))]"
                    : "text-[hsl(var(--brand-blue-deep))]"
            }`}
        >
            {eyebrow}
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--brand-ink))] leading-tight">
            {title}
        </h2>
        {description && (
            <p className="mt-3 text-base sm:text-lg text-[hsl(var(--brand-ink))]/70 leading-relaxed">
                {description}
            </p>
        )}
    </div>
);

const FeatureHighlight = ({ title, bullets, accent = "blue" }) => (
    <div
        className={`rounded-2xl border-2 border-dashed p-7 sm:p-8 flex flex-col justify-center ${
            accent === "red"
                ? "border-[hsl(var(--brand-red))]/30 bg-[hsl(var(--brand-red))]/5"
                : "border-[hsl(var(--brand-blue))]/30 bg-[hsl(var(--brand-blue))]/5"
        }`}
    >
        <h3 className="text-xl sm:text-2xl font-bold text-[hsl(var(--brand-ink))] mb-4">
            {title}
        </h3>
        <ul className="space-y-3">
            {bullets.map((b, i) => (
                <li
                    key={i}
                    className="flex items-start gap-3 text-sm sm:text-base text-[hsl(var(--brand-ink))]/80"
                >
                    <span
                        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            accent === "red"
                                ? "bg-[hsl(var(--brand-red))]"
                                : "bg-[hsl(var(--brand-blue-deep))]"
                        }`}
                    />
                    <span>{b}</span>
                </li>
            ))}
        </ul>
    </div>
);

export default App;
