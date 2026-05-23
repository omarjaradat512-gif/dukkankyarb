import { useState, useMemo, useEffect } from "react";
import { X, GitCompareArrows, Plus, Check, Search, Trash2 } from "lucide-react";
import { useStoreData } from "../contexts/DataContext";
import { useCurrency } from "../contexts/CurrencyContext";

const MAX = 3;

const PriceCell = ({ value, available, format }) => {
    if (!available) {
        return (
            <span className="text-xs font-bold text-[hsl(var(--brand-red))]">
                غير متوفرة
            </span>
        );
    }
    if (value == null) {
        return <span className="text-xs text-[hsl(var(--brand-ink))]/40">—</span>;
    }
    return (
        <span className="text-sm sm:text-base font-extrabold text-[hsl(var(--brand-red))]">
            {format(value)}
        </span>
    );
};

const GameCompareModal = ({ open, onClose }) => {
    const { format } = useCurrency();
    const { games: GAMES } = useStoreData();
    const [selectedIds, setSelectedIds] = useState([]);
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    const selectedGames = useMemo(
        () => selectedIds.map((id) => GAMES.find((g) => g.id === id)).filter(Boolean),
        [selectedIds],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return GAMES.filter((g) => !q || g.name.toLowerCase().includes(q));
    }, [query]);

    const toggle = (id) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= MAX) return prev;
            return [...prev, id];
        });
    };

    // Find best/cheapest non-null price for each tier
    const bestPrice = useMemo(() => {
        const out = { four: null, five: null };
        for (const t of ["four", "five"]) {
            const vals = selectedGames
                .filter((g) => g.available !== false && g[t] != null)
                .map((g) => g[t]);
            if (vals.length > 1) {
                out[t] = Math.min(...vals);
            }
        }
        return out;
    }, [selectedGames]);

    if (!open) return null;

    return (
        <div
            data-testid="compare-modal"
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="relative w-full max-w-5xl max-h-[90vh] rounded-3xl bg-[hsl(var(--brand-cream))] shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-[hsl(var(--brand-ink))]/10 flex items-start justify-between gap-3 bg-white">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[hsl(var(--brand-blue-deep))] mb-1">
                            <GitCompareArrows className="w-4 h-4" />
                            مقارنة
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-[hsl(var(--brand-ink))]">
                            قارن قبل ما تشتري
                        </h3>
                        <p className="text-xs sm:text-sm text-[hsl(var(--brand-ink))]/60 mt-1">
                            اختر لعبتين أو ثلاثة من القائمة (الحد الأقصى {MAX}).
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        data-testid="compare-close"
                        aria-label="إغلاق"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-[hsl(var(--brand-cream))] transition-colors text-[hsl(var(--brand-ink))]/70"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body — scrollable */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
                    {/* Picker */}
                    <div>
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--brand-ink))]/60">
                                اختر الألعاب ({selectedIds.length}/{MAX})
                            </div>
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={() => setSelectedIds([])}
                                    data-testid="compare-clear"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--brand-red))] hover:underline"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> مسح الكل
                                </button>
                            )}
                        </div>

                        {/* Search */}
                        <div className="relative mb-3">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--brand-ink))]/40" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="ابحث عن لعبة..."
                                data-testid="compare-search"
                                className="w-full h-10 rounded-xl border-2 border-[hsl(var(--brand-ink))]/10 bg-white px-4 pr-10 text-sm font-medium focus:border-[hsl(var(--brand-blue-deep))] focus:outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {filtered.map((g) => {
                                const selected = selectedIds.includes(g.id);
                                const disabled =
                                    !selected && selectedIds.length >= MAX;
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => toggle(g.id)}
                                        disabled={disabled}
                                        data-testid={`compare-chip-${g.id}`}
                                        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 h-8 text-xs font-semibold transition-all ${
                                            selected
                                                ? "bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] border-[hsl(var(--brand-ink))]"
                                                : "bg-white border-[hsl(var(--brand-ink))]/15 text-[hsl(var(--brand-ink))] hover:border-[hsl(var(--brand-ink))]/40 disabled:opacity-30 disabled:cursor-not-allowed"
                                        }`}
                                    >
                                        {selected ? (
                                            <Check className="w-3.5 h-3.5" />
                                        ) : (
                                            <Plus className="w-3.5 h-3.5" />
                                        )}
                                        <span dir="ltr">{g.name}</span>
                                    </button>
                                );
                            })}
                            {filtered.length === 0 && (
                                <p className="text-sm text-[hsl(var(--brand-ink))]/50">
                                    ما لقينا ألعاب مطابقة.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Comparison grid */}
                    {selectedGames.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-[hsl(var(--brand-ink))]/15 p-8 text-center">
                            <p className="text-sm text-[hsl(var(--brand-ink))]/55">
                                ابدأ بإضافة لعبتين أو ثلاثة للمقارنة. الأرخص رح
                                يبيّن بشارة خضراء.
                            </p>
                        </div>
                    ) : (
                        <div
                            data-testid="compare-result"
                            className={`grid gap-3 sm:gap-4 ${
                                selectedGames.length === 1
                                    ? "grid-cols-1 max-w-sm mx-auto"
                                    : selectedGames.length === 2
                                      ? "grid-cols-2"
                                      : "grid-cols-2 sm:grid-cols-3"
                            }`}
                        >
                            {selectedGames.map((g) => {
                                const av = g.available !== false;
                                return (
                                    <div
                                        key={g.id}
                                        data-testid={`compare-col-${g.id}`}
                                        className={`rounded-2xl bg-white border-2 overflow-hidden flex flex-col ${
                                            av
                                                ? "border-[hsl(var(--brand-ink))]/10"
                                                : "border-[hsl(var(--brand-red))]/30 opacity-90"
                                        }`}
                                    >
                                        <div
                                            className="relative aspect-[3/4]"
                                            style={{
                                                background: `linear-gradient(135deg, ${g.gradientFrom} 0%, ${g.gradientTo} 100%)`,
                                            }}
                                        >
                                            {g.image && (
                                                <img
                                                    src={g.image}
                                                    alt={g.name}
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                            )}
                                            {g.bestSeller && av && (
                                                <span
                                                    className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-[#3a2400] shadow"
                                                    style={{
                                                        background:
                                                            "linear-gradient(135deg, #ffd86b 0%, #f0a500 100%)",
                                                    }}
                                                >
                                                    الأكثر مبيعاً
                                                </span>
                                            )}
                                            <button
                                                onClick={() => toggle(g.id)}
                                                aria-label="إزالة"
                                                className="absolute top-2 left-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/55 backdrop-blur text-white hover:bg-black/75"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="p-3 sm:p-4 flex flex-col flex-1">
                                            <div
                                                dir="ltr"
                                                className="latin-tight font-bold text-sm sm:text-base text-[hsl(var(--brand-ink))] leading-snug mb-3"
                                            >
                                                {g.name}
                                            </div>

                                            <dl className="text-xs space-y-2 mt-auto">
                                                <div className="flex items-center justify-between gap-2">
                                                    <dt className="text-[hsl(var(--brand-ink))]/60 font-semibold">
                                                        PS4
                                                    </dt>
                                                    <dd className="flex items-center gap-1.5">
                                                        <PriceCell
                                                            value={g.four}
                                                            available={av}
                                                            format={format}
                                                        />
                                                        {av &&
                                                            g.four != null &&
                                                            bestPrice.four ===
                                                                g.four && (
                                                                <span className="rounded-full bg-[#7CFF8A]/20 text-[#1a6e22] px-2 py-0.5 text-[9px] font-extrabold border border-[#7CFF8A]/40">
                                                                    الأرخص
                                                                </span>
                                                            )}
                                                    </dd>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <dt className="text-[hsl(var(--brand-ink))]/60 font-semibold">
                                                        PS5
                                                    </dt>
                                                    <dd className="flex items-center gap-1.5">
                                                        <PriceCell
                                                            value={g.five}
                                                            available={av}
                                                            format={format}
                                                        />
                                                        {av &&
                                                            g.five != null &&
                                                            bestPrice.five ===
                                                                g.five && (
                                                                <span className="rounded-full bg-[#7CFF8A]/20 text-[#1a6e22] px-2 py-0.5 text-[9px] font-extrabold border border-[#7CFF8A]/40">
                                                                    الأرخص
                                                                </span>
                                                            )}
                                                    </dd>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[hsl(var(--brand-ink))]/10">
                                                    <dt className="text-[hsl(var(--brand-ink))]/60 font-semibold">
                                                        الحالة
                                                    </dt>
                                                    <dd
                                                        className={`text-[11px] font-extrabold ${av ? "text-[#1a6e22]" : "text-[hsl(var(--brand-red))]"}`}
                                                    >
                                                        {av
                                                            ? "متوفرة"
                                                            : "غير متوفرة"}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const CompareButton = () => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setOpen(true)}
                data-testid="open-compare-button"
                className="inline-flex items-center gap-2 rounded-full px-5 h-11 bg-white border-2 border-[hsl(var(--brand-ink))]/15 text-[hsl(var(--brand-ink))] font-semibold text-sm hover:border-[hsl(var(--brand-ink))]/40 hover:bg-[hsl(var(--brand-cream))] transition-colors shadow-sm"
            >
                <GitCompareArrows className="w-4 h-4 text-[hsl(var(--brand-blue-deep))]" />
                قارن قبل ما تشتري
            </button>
            <GameCompareModal open={open} onClose={() => setOpen(false)} />
        </>
    );
};
