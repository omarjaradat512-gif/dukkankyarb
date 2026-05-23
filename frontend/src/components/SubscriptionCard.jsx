import { useState, useMemo, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useLang, pickLocalized } from "../contexts/LanguageContext";
import { toast } from "sonner";

const TIER_LABEL = {
    four: "PS4 (Four)",
    five: "PS5 (Five)",
};

export const SubscriptionCard = ({ sub }) => {
    const { add } = useCart();
    const { format } = useCurrency();
    const { t, lang } = useLang();

    const [tier, setTier] = useState("five");
    const availableDurations = useMemo(
        () => sub.durations.filter((d) => d[tier] != null),
        [sub.durations, tier],
    );
    const [duration, setDuration] = useState(availableDurations[0]?.id);

    useEffect(() => {
        if (!availableDurations.find((d) => d.id === duration)) {
            setDuration(availableDurations[0]?.id);
        }
    }, [tier, availableDurations, duration]);

    const dur = sub.durations.find((d) => d.id === duration) || availableDurations[0];
    const price = dur ? dur[tier] : null;

    const subName = pickLocalized(sub, "name", lang);
    const subTagline = pickLocalized(sub, "tagline", lang);
    const durLabel = dur ? pickLocalized(dur, "label", lang) : "";

    const accentClasses =
        sub.accent === "red"
            ? {
                  bar: "bg-[hsl(var(--brand-red))]",
                  ribbon:
                      "bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))] border-[hsl(var(--brand-red))]/30",
                  price: "text-[hsl(var(--brand-red))]",
              }
            : {
                  bar: "bg-[hsl(var(--brand-blue-deep))]",
                  ribbon:
                      "bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))] border-[hsl(var(--brand-blue))]/40",
                  price: "text-[hsl(var(--brand-blue-deep))]",
              };

    const [adding, setAdding] = useState(false);
    const handleAdd = () => {
        if (price == null) return;
        const item = {
            key: `sub-${sub.id}-${duration}-${tier}`,
            type: "subscription",
            title: `${subName} — ${durLabel}`,
            subtitle: TIER_LABEL[tier],
            price,
        };
        add(item);
        setAdding(true);
        toast.success(t("toast.addedToCart"), {
            description: `${item.title} (${item.subtitle})`,
        });
        setTimeout(() => setAdding(false), 1200);
    };

    return (
        <article
            data-testid={`subscription-card-${sub.id}`}
            className="card-elevated rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 overflow-hidden flex flex-col transition-transform hover:-translate-y-1"
        >
            <div className={`h-1.5 ${accentClasses.bar}`} />
            <div className="p-6 sm:p-7 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-[hsl(var(--brand-ink))]">
                            {subName}
                        </h3>
                        <p className="text-sm text-[hsl(var(--brand-ink))]/65 mt-1">
                            {subTagline}
                        </p>
                    </div>
                    <span
                        className={`text-[11px] font-semibold rounded-full border px-2.5 py-1 ${accentClasses.ribbon}`}
                    >
                        {sub.id === "extra" ? t("card.mostRequested") : t("card.basic")}
                    </span>
                </div>

                {/* Tier selector */}
                <div className="mb-4">
                    <div className="text-xs font-semibold text-[hsl(var(--brand-ink))]/60 mb-2">
                        {t("card.device")}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {["five", "four"].map((tt) => (
                            <button
                                key={tt}
                                onClick={() => setTier(tt)}
                                data-testid={`sub-${sub.id}-tier-${tt}`}
                                data-selected={tier === tt}
                                className="tier-pill text-sm font-semibold rounded-xl border-2 border-[hsl(var(--brand-ink))]/15 h-11 transition-all"
                            >
                                {TIER_LABEL[tt]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration selector */}
                <div className="mb-5">
                    <div className="text-xs font-semibold text-[hsl(var(--brand-ink))]/60 mb-2">
                        {t("card.duration")}
                    </div>
                    <div className="space-y-2">
                        {sub.durations.map((d) => {
                            const isAvailable = d[tier] != null;
                            const selected = d.id === duration;
                            const lbl = pickLocalized(d, "label", lang);
                            if (!isAvailable) {
                                return (
                                    <div
                                        key={d.id}
                                        data-testid={`sub-${sub.id}-duration-${d.id}-disabled`}
                                        className="w-full flex items-center justify-between rounded-xl border-2 border-dashed border-[hsl(var(--brand-ink))]/15 px-4 h-12 text-sm font-medium opacity-50"
                                    >
                                        <span className="text-[hsl(var(--brand-ink))]/60">
                                            {lbl}
                                        </span>
                                        <span className="text-[hsl(var(--brand-ink))]/45 text-xs">
                                            {t("card.notAvailable")}
                                        </span>
                                    </div>
                                );
                            }
                            return (
                                <button
                                    key={d.id}
                                    onClick={() => setDuration(d.id)}
                                    data-testid={`sub-${sub.id}-duration-${d.id}`}
                                    className={`w-full flex items-center justify-between rounded-xl border-2 px-4 h-12 text-sm font-semibold transition-all ${
                                        selected
                                            ? "border-[hsl(var(--brand-blue-deep))] bg-[hsl(var(--brand-blue))]/10 text-[hsl(var(--brand-blue-deep))]"
                                            : "border-[hsl(var(--brand-ink))]/10 bg-[hsl(var(--brand-cream))]/40 text-[hsl(var(--brand-ink))]/80 hover:border-[hsl(var(--brand-ink))]/25"
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {selected && <Check className="w-4 h-4" />}
                                        {lbl}
                                    </span>
                                    <span className="text-[hsl(var(--brand-ink))]/60 text-xs">
                                        {format(d[tier])}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-auto pt-5 border-t border-[hsl(var(--brand-ink))]/10 flex items-end justify-between gap-3">
                    <div>
                        <div className="text-xs text-[hsl(var(--brand-ink))]/55 mb-0.5">
                            {t("card.price")}
                        </div>
                        <div
                            className={`text-3xl font-bold ${accentClasses.price}`}
                            data-testid={`sub-${sub.id}-price`}
                        >
                            {price != null ? format(price) : "—"}
                        </div>
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={price == null}
                        data-testid={`sub-${sub.id}-add-button`}
                        className="inline-flex items-center gap-2 rounded-full px-5 h-11 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-semibold hover:bg-[hsl(var(--brand-blue-deep))] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {adding ? (
                            <>
                                <Check className="w-4 h-4" /> {t("card.added")}
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" /> {t("card.add")}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
};
