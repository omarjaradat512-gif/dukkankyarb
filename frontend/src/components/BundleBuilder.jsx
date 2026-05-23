import { useState, useMemo } from "react";
import {
    Plus,
    Check,
    Wand2,
    X,
    ShoppingBag,
    Sparkles,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useStoreData } from "../contexts/DataContext";
import { toast } from "sonner";

const TIER_LABEL = { four: "PS4", five: "PS5" };

// Discount tiers based on number of items selected
const getDiscount = (count) => {
    if (count >= 4) return 0.15;
    if (count === 3) return 0.1;
    if (count === 2) return 0.05;
    return 0;
};

const Section = ({ title, hint, children }) => (
    <div>
        <div className="flex items-baseline justify-between gap-3 mb-3">
            <h3 className="font-bold text-[hsl(var(--brand-ink))]">{title}</h3>
            {hint && (
                <span className="text-[11px] text-[hsl(var(--brand-ink))]/55">
                    {hint}
                </span>
            )}
        </div>
        {children}
    </div>
);

const Chip = ({ selected, onClick, disabled, testId, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        data-testid={testId}
        data-selected={selected || undefined}
        className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 h-10 text-xs sm:text-sm font-semibold transition-all ${
            selected
                ? "bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] border-[hsl(var(--brand-ink))]"
                : "bg-white border-[hsl(var(--brand-ink))]/12 text-[hsl(var(--brand-ink))] hover:border-[hsl(var(--brand-ink))]/35 disabled:opacity-35 disabled:cursor-not-allowed"
        }`}
    >
        {selected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        {children}
    </button>
);

export const BundleBuilder = () => {
    const { add } = useCart();
    const { format } = useCurrency();
    const { subscriptions: SUBSCRIPTIONS, games: GAMES } = useStoreData();
    const [tier, setTier] = useState("five");
    const [subId, setSubId] = useState(null); // null = no subscription picked
    const [subDur, setSubDur] = useState("ext-3m"); // default duration
    const [gameIds, setGameIds] = useState([]);
    const [adding, setAdding] = useState(false);

    const sub = SUBSCRIPTIONS.find((s) => s.id === subId);
    const dur = sub?.durations.find((d) => d.id === subDur);
    const subPrice = sub && dur ? dur[tier] : null;

    const selectedGames = useMemo(
        () => gameIds.map((id) => GAMES.find((g) => g.id === id)).filter(Boolean),
        [gameIds],
    );

    // Build line items (only counted if has price > 0)
    const lineItems = useMemo(() => {
        const items = [];
        if (sub && subPrice != null) {
            items.push({
                key: `bb-sub`,
                label: `${sub.name} (${dur.label})`,
                price: subPrice,
            });
        }
        for (const g of selectedGames) {
            const p = g[tier];
            if (p != null && g.available !== false) {
                items.push({
                    key: `bb-game-${g.id}`,
                    label: g.name,
                    price: p,
                });
            }
        }
        return items;
    }, [sub, dur, subPrice, selectedGames, tier]);

    const subtotal = lineItems.reduce((s, i) => s + i.price, 0);
    const discountPct = getDiscount(lineItems.length);
    const discount = subtotal * discountPct;
    const total = subtotal - discount;
    const nextThreshold = lineItems.length < 4
        ? lineItems.length + 1
        : null;
    const nextPct = nextThreshold ? getDiscount(nextThreshold) : null;

    const toggleGame = (id) => {
        setGameIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const handleAddAll = () => {
        if (lineItems.length === 0) {
            toast.error("اختر اشتراك أو لعبة لإضافتها للسلة");
            return;
        }
        // Add each as separate cart item, but apply the discount as a single negative line
        for (const item of lineItems) {
            const matchTitle =
                item.key === "bb-sub"
                    ? `${item.label} — ${TIER_LABEL[tier]}`
                    : `${item.label} (باقتك)`;
            add({
                key: `${item.key}-${Date.now()}`,
                type: item.key.startsWith("bb-sub") ? "subscription" : "game",
                title: matchTitle,
                subtitle: TIER_LABEL[tier],
                price: item.price,
            });
        }
        if (discount > 0) {
            add({
                key: `bb-discount-${Date.now()}`,
                type: "discount",
                title: `خصم باقتك (-${Math.round(discountPct * 100)}%)`,
                subtitle: "وفّرت بدمج المنتجات",
                price: -discount,
            });
        }
        setAdding(true);
        toast.success("تمت إضافة باقتك للسلة", {
            description:
                discount > 0
                    ? `وفّرت ${format(discount)} (${Math.round(discountPct * 100)}%)`
                    : `${lineItems.length} عنصر`,
        });
        setTimeout(() => setAdding(false), 1400);
    };

    return (
        <section
            id="build-bundle"
            data-testid="bundle-builder-section"
            className="bg-white/60 border-y border-[hsl(var(--brand-ink))]/10"
        >
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
                <div className="mb-8 max-w-3xl">
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] mb-3 text-[hsl(var(--brand-red))]">
                        <Wand2 className="w-4 h-4" />
                        ابني باقتك
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--brand-ink))] leading-tight">
                        اختار أنت، واحنا نخصملك
                    </h2>
                    <p className="mt-3 text-base sm:text-lg text-[hsl(var(--brand-ink))]/70 leading-relaxed">
                        ضمّ اشتراك + ألعاب، وكل ما زدت عنصر زاد الخصم تلقائياً.
                    </p>

                    {/* Discount ladder */}
                    <div className="mt-5 grid grid-cols-3 gap-2 max-w-md text-center text-[11px] sm:text-xs">
                        {[
                            { count: 2, pct: 5 },
                            { count: 3, pct: 10 },
                            { count: 4, pct: 15 },
                        ].map((step) => {
                            const active = lineItems.length >= step.count;
                            return (
                                <div
                                    key={step.count}
                                    className={`rounded-full px-3 py-2 font-bold transition-all ${
                                        active
                                            ? "bg-[#7CFF8A]/20 text-[#1a6e22] border-2 border-[#7CFF8A]/40"
                                            : "bg-[hsl(var(--brand-ink))]/5 text-[hsl(var(--brand-ink))]/55 border-2 border-transparent"
                                    }`}
                                >
                                    {step.count}+ عناصر = خصم {step.pct}%
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_360px] gap-6 sm:gap-8 items-start">
                    {/* Left: controls */}
                    <div className="space-y-7 sm:space-y-9">
                        {/* Step 1: tier */}
                        <Section title="١) اختر جهازك" hint="السعر يتغير حسب الجهاز">
                            <div className="grid grid-cols-2 gap-2 max-w-xs">
                                {["five", "four"].map((t) => (
                                    <Chip
                                        key={t}
                                        selected={tier === t}
                                        onClick={() => setTier(t)}
                                        testId={`builder-tier-${t}`}
                                    >
                                        {TIER_LABEL[t]}
                                    </Chip>
                                ))}
                            </div>
                        </Section>

                        {/* Step 2: subscription */}
                        <Section title="٢) أضف اشتراك (اختياري)">
                            <div className="grid sm:grid-cols-2 gap-3">
                                {SUBSCRIPTIONS.map((s) => {
                                    const active = subId === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() =>
                                                setSubId(active ? null : s.id)
                                            }
                                            data-testid={`builder-sub-${s.id}`}
                                            className={`rounded-2xl border-2 px-4 py-3.5 text-right transition-all ${
                                                active
                                                    ? "border-[hsl(var(--brand-ink))] bg-[hsl(var(--brand-ink))]/5"
                                                    : "border-[hsl(var(--brand-ink))]/12 bg-white hover:border-[hsl(var(--brand-ink))]/35"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <span className="font-bold text-sm">
                                                    {s.name}
                                                </span>
                                                {active && (
                                                    <Check className="w-4 h-4 text-[hsl(var(--brand-red))]" />
                                                )}
                                            </div>
                                            <div className="text-[11px] text-[hsl(var(--brand-ink))]/55">
                                                {s.tagline}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {sub && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {sub.durations.map((d) => {
                                        const av = d[tier] != null;
                                        return (
                                            <Chip
                                                key={d.id}
                                                selected={subDur === d.id && av}
                                                disabled={!av}
                                                onClick={() => setSubDur(d.id)}
                                                testId={`builder-dur-${d.id}`}
                                            >
                                                {d.label}
                                                {av && (
                                                    <span className="opacity-70 text-[10px] mr-1">
                                                        {format(d[tier])}
                                                    </span>
                                                )}
                                            </Chip>
                                        );
                                    })}
                                </div>
                            )}
                        </Section>

                        {/* Step 3: games */}
                        <Section
                            title="٣) أضف ألعاب"
                            hint={`المحدد: ${gameIds.length}`}
                        >
                            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                                {GAMES.filter(
                                    (g) =>
                                        g.available !== false &&
                                        g[tier] != null,
                                ).map((g) => (
                                    <Chip
                                        key={g.id}
                                        selected={gameIds.includes(g.id)}
                                        onClick={() => toggleGame(g.id)}
                                        testId={`builder-game-${g.id}`}
                                    >
                                        <span dir="ltr">{g.name}</span>
                                        <span className="opacity-70 text-[10px] mr-1">
                                            {format(g[tier])}
                                        </span>
                                    </Chip>
                                ))}
                            </div>
                        </Section>
                    </div>

                    {/* Right: summary */}
                    <aside
                        data-testid="builder-summary"
                        className="lg:sticky lg:top-24 rounded-3xl bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] p-5 sm:p-6 shadow-2xl"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingBag className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-[0.15em] opacity-70">
                                ملخص باقتك
                            </span>
                        </div>

                        {lineItems.length === 0 ? (
                            <p className="text-sm opacity-60 py-6">
                                لسه ما اخترت شي. ابدأ بإضافة اشتراك أو لعبة.
                            </p>
                        ) : (
                            <ul className="space-y-2.5 mb-4 max-h-64 overflow-y-auto">
                                {lineItems.map((item) => (
                                    <li
                                        key={item.key}
                                        className="flex items-start justify-between gap-3 text-sm pb-2.5 border-b border-[hsl(var(--brand-cream))]/10 last:border-0"
                                    >
                                        <span className="opacity-90 leading-tight">
                                            {item.label}
                                        </span>
                                        <span className="font-bold whitespace-nowrap">
                                            {format(item.price)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {lineItems.length > 0 && (
                            <>
                                <div className="space-y-1.5 text-sm mb-4 border-t border-[hsl(var(--brand-cream))]/15 pt-3">
                                    <div className="flex items-center justify-between opacity-70">
                                        <span>المجموع الفرعي</span>
                                        <span>{format(subtotal)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex items-center justify-between text-[#9affa6] font-semibold">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                خصم باقتك ({Math.round(discountPct * 100)}%)
                                            </span>
                                            <span>-{format(discount)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-[hsl(var(--brand-cream))]/15">
                                        <span className="font-bold">المجموع</span>
                                        <span
                                            className="text-2xl font-extrabold text-[#7CFF8A]"
                                            data-testid="builder-total"
                                        >
                                            {format(total)}
                                        </span>
                                    </div>
                                </div>

                                {nextPct && lineItems.length >= 1 && (
                                    <div className="text-[11px] mb-4 rounded-xl bg-[hsl(var(--brand-cream))]/8 px-3 py-2 opacity-90">
                                        أضف عنصر واحد بعد للوصول لخصم {Math.round(nextPct * 100)}% 🎁
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            onClick={handleAddAll}
                            disabled={lineItems.length === 0}
                            data-testid="builder-add-all-button"
                            className="w-full inline-flex items-center justify-center gap-2 rounded-full h-12 bg-[hsl(var(--brand-cream))] text-[hsl(var(--brand-ink))] text-sm font-bold hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {adding ? (
                                <>
                                    <Check className="w-4 h-4" /> أُضيفت!
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" /> أضف باقتك للسلة
                                </>
                            )}
                        </button>

                        {lineItems.length > 0 && (
                            <button
                                onClick={() => {
                                    setSubId(null);
                                    setGameIds([]);
                                }}
                                data-testid="builder-reset"
                                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 text-xs opacity-70 hover:opacity-100"
                            >
                                <X className="w-3 h-3" /> ابدأ من جديد
                            </button>
                        )}
                    </aside>
                </div>
            </div>
        </section>
    );
};
