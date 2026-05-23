import { useState } from "react";
import { Plus, Check, Sparkles, Package } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useStoreData } from "../contexts/DataContext";
import { useLang, pickLocalized } from "../contexts/LanguageContext";
import { toast } from "sonner";

const TIER_LABEL = { four: "PS4 (Four)", five: "PS5 (Five)" };

const BundleCard = ({ bundle, subscriptions, games }) => {
    const { add } = useCart();
    const { format } = useCurrency();
    const { t, lang } = useLang();
    const [adding, setAdding] = useState(false);
    const [imgError, setImgError] = useState(false);

    const sub = subscriptions.find((s) => s.id === bundle.subId);
    const dur = sub?.durations.find((d) => d.id === bundle.durationId);
    const game = games.find((g) => g.id === bundle.gameId);

    if (!sub || !dur || !game) return null;

    const subName = pickLocalized(sub, "name", lang);
    const durLabel = pickLocalized(dur, "label", lang);

    const subPrice = dur[bundle.tier];
    const gamePrice = game[bundle.tier];
    if (subPrice == null || gamePrice == null) return null;

    const original = subPrice + gamePrice;
    const saved = original - bundle.bundlePrice;
    const percent = Math.round((saved / original) * 100);

    const isAvailable = bundle.available !== false && game.available !== false;
    const showImage = game.image && !imgError;

    const handleAdd = () => {
        if (!isAvailable) return;
        add({
            key: `bundle-${bundle.id}`,
            type: "bundle",
            title: `${subName} (${durLabel}) + ${game.name}`,
            subtitle: `${TIER_LABEL[bundle.tier]} — ${lang === "ar" ? "باقة موفّرة" : "Saver bundle"}`,
            price: bundle.bundlePrice,
        });
        setAdding(true);
        toast.success(lang === "ar" ? "تمت إضافة الباقة إلى السلة" : "Bundle added to cart", {
            description: `${lang === "ar" ? "وفّرت" : "You saved"} ${format(saved)} (${percent}%) 🎉`,
        });
        setTimeout(() => setAdding(false), 1400);
    };

    return (
        <article
            data-testid={`bundle-card-${bundle.id}`}
            className="card-elevated rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 overflow-hidden flex flex-col transition-transform hover:-translate-y-1"
        >
            {/* Header strip */}
            <div className="relative h-44 sm:h-48 overflow-hidden">
                {showImage ? (
                    <img
                        src={game.image}
                        alt={game.name}
                        onError={() => setImgError(true)}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(135deg, ${game.gradientFrom} 0%, ${game.gradientTo} 100%)`,
                        }}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                {/* Savings badge */}
                <div
                    className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold text-[#1a3a05] shadow-lg"
                    style={{
                        background:
                            "linear-gradient(135deg, #c8ff7c 0%, #7CFF8A 100%)",
                    }}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    {lang === "ar" ? `وفّر ${percent}%` : `Save ${percent}%`}
                </div>

                <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white">
                    {TIER_LABEL[bundle.tier]}
                </div>

                <div className="absolute bottom-3 right-3 left-3">
                    <div className="text-[11px] uppercase tracking-wider text-white/70 font-bold">
                        {lang === "ar" ? "باقة موفّرة" : "Saver bundle"}
                    </div>
                    <div
                        className="text-white text-lg sm:text-xl font-extrabold leading-tight latin-tight"
                        dir="ltr"
                    >
                        {game.name}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 flex flex-col flex-1">
                <ul className="space-y-2 mb-5">
                    <li className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-[hsl(var(--brand-ink))]/80">
                            <Check className="w-4 h-4 text-[hsl(var(--brand-blue-deep))]" />
                            {subName} ({durLabel})
                        </span>
                        <span className="text-[hsl(var(--brand-ink))]/50 text-xs">
                            {format(subPrice)}
                        </span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-[hsl(var(--brand-ink))]/80">
                            <Check className="w-4 h-4 text-[hsl(var(--brand-blue-deep))]" />
                            <span dir="ltr" className="latin-tight">
                                {game.name}
                            </span>
                        </span>
                        <span className="text-[hsl(var(--brand-ink))]/50 text-xs">
                            {format(gamePrice)}
                        </span>
                    </li>
                </ul>

                <div className="mt-auto pt-4 border-t border-[hsl(var(--brand-ink))]/10 flex items-end justify-between gap-3">
                    <div>
                        <div className="text-xs text-[hsl(var(--brand-ink))]/55 mb-0.5 flex items-center gap-2">
                            <span className="line-through">{format(original)}</span>
                            <span className="rounded-full bg-[#7CFF8A]/20 text-[#1a6e22] px-2 py-0.5 text-[10px] font-bold">
                                -{format(saved)}
                            </span>
                        </div>
                        <div
                            className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--brand-red))]"
                            data-testid={`bundle-${bundle.id}-price`}
                        >
                            {format(bundle.bundlePrice)}
                        </div>
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={!isAvailable}
                        data-testid={`bundle-${bundle.id}-add-button`}
                        className="inline-flex items-center gap-2 rounded-full px-5 h-11 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-semibold hover:bg-[hsl(var(--brand-blue-deep))] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {adding ? (
                            <>
                                <Check className="w-4 h-4" /> {t("card.added")}
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" /> {lang === "ar" ? "أضف الباقة" : "Add bundle"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
};

export const Bundles = () => {
    const { bundles, subscriptions, games } = useStoreData();
    const { t, lang } = useLang();
    if (!bundles?.length) return null;
    return (
        <section
            id="bundles"
            data-testid="bundles-section"
            className="bg-[hsl(var(--brand-cream))]"
        >
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
                <div className="mb-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] mb-3 text-[hsl(var(--brand-red))]">
                        <Package className="w-4 h-4" />
                        {t("section.bundles")}
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--brand-ink))] leading-tight">
                        {lang === "ar" ? "خذ اشتراك + لعبة بسعر أقل" : "Get a subscription + game at a better price"}
                    </h2>
                    <p className="mt-3 text-base sm:text-lg text-[hsl(var(--brand-ink))]/70 leading-relaxed">
                        {t("section.bundlesDesc")}
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 stagger">
                    {bundles.map((b) => (
                        <BundleCard key={b.id} bundle={b} subscriptions={subscriptions} games={games} />
                    ))}
                </div>
            </div>
        </section>
    );
};
