import { useState, useMemo } from "react";
import { TrendingDown, Calculator } from "lucide-react";
import { useStoreData } from "../contexts/DataContext";
import { useCurrency } from "../contexts/CurrencyContext";

const TIER_LABEL = { four: "PS4", five: "PS5" };

export const SavingsCalculator = () => {
    const { format } = useCurrency();
    const { subscriptions: SUBSCRIPTIONS } = useStoreData();
    const [subId, setSubId] = useState("extra");
    const [tier, setTier] = useState("five");

    const sub = SUBSCRIPTIONS.find((s) => s.id === subId);

    const calc = useMemo(() => {
        if (!sub) return null;
        const monthly = sub.durations.find((d) => d.id.endsWith("-1m"))?.[tier];
        const quarterly = sub.durations.find((d) => d.id.endsWith("-3m"))?.[
            tier
        ];
        const yearly = sub.durations.find((d) => d.id.endsWith("-12m"))?.[tier];

        const results = [];
        if (monthly != null && yearly != null) {
            const monthlyTotal = monthly * 12;
            const saved = monthlyTotal - yearly;
            const percent = Math.round((saved / monthlyTotal) * 100);
            results.push({
                label: "١٢ شهر × اشتراك شهري",
                vs: "vs السنة كاملة",
                total: monthlyTotal,
                target: yearly,
                saved,
                percent,
                hint: `بدل ما تدفع ${monthly}$ كل شهر، ادفع مرة وحدة ووفّر`,
            });
        }
        if (quarterly != null && yearly != null) {
            const quarterlyTotal = quarterly * 4;
            const saved = quarterlyTotal - yearly;
            const percent = Math.round((saved / quarterlyTotal) * 100);
            results.push({
                label: "٤ × اشتراك ٣ شهور",
                vs: "vs السنة كاملة",
                total: quarterlyTotal,
                target: yearly,
                saved,
                percent,
                hint: `لو جدّدت كل ٣ شهور بدل ما تدفع سنوي`,
            });
        }
        return { monthly, quarterly, yearly, results };
    }, [sub, tier]);

    if (!calc || !calc.results.length) return null;

    return (
        <section
            id="savings"
            data-testid="savings-section"
            className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20"
        >
            <div className="rounded-3xl bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] p-8 sm:p-12 relative overflow-hidden">
                <div className="absolute -top-12 -left-12 w-60 h-60 rounded-full bg-[hsl(var(--brand-blue))]/15 blur-3xl" />
                <div className="absolute -bottom-16 -right-12 w-72 h-72 rounded-full bg-[hsl(var(--brand-red))]/15 blur-3xl" />

                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(var(--brand-cream))]/15 backdrop-blur">
                            <Calculator className="w-5 h-5" />
                        </span>
                        <div className="text-xs font-bold uppercase tracking-[0.18em] opacity-75">
                            حاسبة التوفير
                        </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-3">
                        احسب كم رح توفّر فعلياً
                    </h2>
                    <p className="text-base sm:text-lg opacity-80 max-w-2xl mb-8">
                        اختار نوع الاشتراك والجهاز، وشوف الفرق بين الاشتراك
                        الشهري والسنوي بالعملة اللي تختارها.
                    </p>

                    {/* Controls */}
                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mb-8">
                        <div>
                            <div className="text-xs font-semibold opacity-70 mb-2">
                                نوع الاشتراك
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {SUBSCRIPTIONS.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSubId(s.id)}
                                        data-testid={`savings-sub-${s.id}`}
                                        className={`h-11 rounded-xl text-sm font-semibold border-2 transition-all ${
                                            subId === s.id
                                                ? "bg-[hsl(var(--brand-cream))] text-[hsl(var(--brand-ink))] border-[hsl(var(--brand-cream))]"
                                                : "border-[hsl(var(--brand-cream))]/30 hover:border-[hsl(var(--brand-cream))]/60"
                                        }`}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold opacity-70 mb-2">
                                الجهاز
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {["five", "four"].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTier(t)}
                                        data-testid={`savings-tier-${t}`}
                                        className={`h-11 rounded-xl text-sm font-semibold border-2 transition-all ${
                                            tier === t
                                                ? "bg-[hsl(var(--brand-cream))] text-[hsl(var(--brand-ink))] border-[hsl(var(--brand-cream))]"
                                                : "border-[hsl(var(--brand-cream))]/30 hover:border-[hsl(var(--brand-cream))]/60"
                                        }`}
                                    >
                                        {TIER_LABEL[t]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
                        {calc.results.map((r, i) => (
                            <div
                                key={i}
                                data-testid={`savings-result-${i}`}
                                className="rounded-2xl bg-[hsl(var(--brand-cream))]/8 backdrop-blur border border-[hsl(var(--brand-cream))]/15 p-5 sm:p-6"
                            >
                                <div className="text-xs opacity-70 mb-1">
                                    {r.label} <span className="opacity-50">{r.vs}</span>
                                </div>
                                <div className="flex items-baseline gap-3 mb-4">
                                    <span className="text-2xl font-bold line-through opacity-60">
                                        {format(r.total)}
                                    </span>
                                    <span className="text-sm opacity-60">←</span>
                                    <span className="text-3xl font-extrabold text-[#7CFF8A]">
                                        {format(r.target)}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-[#7CFF8A]/15 text-[#9affa6] px-4 py-2 text-sm font-bold border border-[#7CFF8A]/30">
                                    <TrendingDown className="w-4 h-4" />
                                    <span>
                                        وفّر {format(r.saved)} ({r.percent}%)
                                    </span>
                                </div>
                                <p className="text-xs opacity-65 mt-3">{r.hint}</p>
                            </div>
                        ))}
                    </div>

                    {calc.results.length === 0 && (
                        <p className="text-sm opacity-80">
                            هاي الخطة غير متوفرة على {TIER_LABEL[tier]} حالياً.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};
