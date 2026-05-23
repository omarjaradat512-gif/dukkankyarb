import { ArrowLeft, ArrowRight, BadgeCheck, Zap, MessageCircle } from "lucide-react";
import { quickInquiry } from "../lib/whatsapp";
import { useLang, pickLocalized } from "../contexts/LanguageContext";
import { useStoreData } from "../contexts/DataContext";

export const Hero = () => {
    const { t, isRTL, lang } = useLang();
    const { store, waTemplates } = useStoreData();
    const storeName = pickLocalized(store, "name", lang);
    const Arrow = isRTL ? ArrowLeft : ArrowRight;
    return (
        <section
            id="top"
            data-testid="hero-section"
            className="relative overflow-hidden border-b border-[hsl(var(--brand-ink))]/10"
        >
            {/* keffiyeh stripe accent — top only on mobile, removed from sides for readability */}
            <div className="absolute top-0 right-0 w-full h-3 keffiyeh-pattern md:hidden" />

            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-24 grid md:grid-cols-2 gap-12 items-center">
                <div className="rise">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand-blue))]/15 border border-[hsl(var(--brand-blue))]/30 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[hsl(var(--brand-blue-deep))] mb-6">
                        <BadgeCheck className="w-4 h-4" />
                        {t("hero.badge")}
                    </div>

                    <h1
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-[hsl(var(--brand-ink))]"
                        data-testid="hero-title"
                    >
                        <span className="block">{t("hero.title.line1")}</span>
                        <span className="block text-[hsl(var(--brand-red))]">
                            {t("hero.title.line2")}
                        </span>
                    </h1>

                    <p className="mt-6 text-base sm:text-lg text-[hsl(var(--brand-ink))]/70 max-w-xl leading-relaxed">
                        {t("hero.subtitle")}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <a
                            href="#essential"
                            data-testid="hero-cta-browse"
                            className="inline-flex items-center gap-2 rounded-full px-6 h-12 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-semibold hover:bg-[hsl(var(--brand-blue-deep))] transition-colors"
                        >
                            {t("hero.cta.browse")}
                            <Arrow className="w-4 h-4" />
                        </a>
                        <button
                            onClick={() => quickInquiry(null, store, waTemplates)}
                            data-testid="hero-cta-whatsapp"
                            className="inline-flex items-center gap-2 rounded-full px-6 h-12 bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1DA851] transition-colors"
                        >
                            <MessageCircle className="w-4 h-4 wa-pulse" />
                            {t("hero.cta.whatsapp")}
                        </button>
                    </div>

                    <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
                        {[
                            { icon: Zap, label: t("hero.benefit.instant") },
                            { icon: BadgeCheck, label: t("hero.benefit.original") },
                            { icon: MessageCircle, label: t("hero.benefit.support") },
                        ].map((b, i) => (
                            <div
                                key={i}
                                className="rounded-xl bg-white/70 border border-[hsl(var(--brand-ink))]/10 px-3 py-3 text-center"
                            >
                                <b.icon className="w-4 h-4 mx-auto text-[hsl(var(--brand-red))] mb-1" />
                                <div className="text-xs sm:text-sm font-semibold text-[hsl(var(--brand-ink))]">
                                    {b.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Logo display card */}
                <div className="relative rise">
                    <div className="absolute -inset-6 bg-[hsl(var(--brand-blue))]/20 blur-3xl rounded-full" />
                    <div className="relative card-elevated rounded-[2rem] bg-[hsl(var(--brand-blue))] p-8 sm:p-12 overflow-hidden">
                        <div className="absolute -top-10 -left-10 w-48 h-48 keffiyeh-pattern opacity-30 rotate-12" />
                        <div className="absolute -bottom-10 -right-10 w-56 h-56 keffiyeh-pattern opacity-30 -rotate-12" />
                        <img
                            src="/logo.png"
                            alt={storeName}
                            className="relative w-full max-w-sm mx-auto drop-shadow-2xl"
                        />
                        <div className="relative mt-6 text-center">
                            <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand-cream))]/95 px-4 py-2 text-sm font-bold text-[hsl(var(--brand-blue-deep))]">
                                {storeName} • Dukkank
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
