// GamesGrid — search + filter + sort + pagination for the games section.
// Pure client-side over the loaded `games` list. Scales for ~thousands;
// for tens of thousands switch to server-side pagination.
import { useMemo, useState, useEffect } from "react";
import { Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import { GameCard } from "./GameCard";
import { useCurrency } from "../contexts/CurrencyContext";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
    { value: "default", label: "افتراضي" },
    { value: "price-asc", label: "السعر: من الأقل" },
    { value: "price-desc", label: "السعر: من الأعلى" },
    { value: "name-asc", label: "الاسم: أ→ي" },
    { value: "available-first", label: "المتوفر أولاً" },
];

const PLATFORM_OPTIONS = [
    { value: "all", label: "كل الأجهزة" },
    { value: "five", label: "PS5 فقط" },
    { value: "four", label: "PS4 فقط" },
];

const AVAIL_OPTIONS = [
    { value: "all", label: "الكل" },
    { value: "available", label: "متوفرة فقط" },
];

const lowestPrice = (g) => {
    const prices = ["five", "four"].map((t) => g[t]).filter((v) => v != null);
    return prices.length ? Math.min(...prices) : Infinity;
};

export const GamesGrid = ({ games }) => {
    const { format } = useCurrency();
    const [query, setQuery] = useState("");
    const [platform, setPlatform] = useState("all");
    const [avail, setAvail] = useState("all");
    const [sort, setSort] = useState("default");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [shown, setShown] = useState(PAGE_SIZE);

    // Filter
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = (games || []).filter((g) => {
            if (q) {
                const hay = `${g.name || ""} ${g.tagline || ""} ${(g.tags || []).join(" ")}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (platform === "five" && g.five == null) return false;
            if (platform === "four" && g.four == null) return false;
            if (avail === "available" && g.available === false) return false;
            return true;
        });

        // Sort
        if (sort === "price-asc") {
            list = [...list].sort((a, b) => lowestPrice(a) - lowestPrice(b));
        } else if (sort === "price-desc") {
            list = [...list].sort((a, b) => lowestPrice(b) - lowestPrice(a));
        } else if (sort === "name-asc") {
            list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        } else if (sort === "available-first") {
            list = [...list].sort((a, b) => {
                const av = a.available === false ? 1 : 0;
                const bv = b.available === false ? 1 : 0;
                return av - bv;
            });
        }
        return list;
    }, [games, query, platform, avail, sort]);

    // Reset pagination when filters change
    useEffect(() => {
        setShown(PAGE_SIZE);
    }, [query, platform, avail, sort]);

    const visible = filtered.slice(0, shown);
    const hasMore = shown < filtered.length;
    const activeFiltersCount =
        (query ? 1 : 0) +
        (platform !== "all" ? 1 : 0) +
        (avail !== "all" ? 1 : 0) +
        (sort !== "default" ? 1 : 0);

    const clearAll = () => {
        setQuery("");
        setPlatform("all");
        setAvail("all");
        setSort("default");
    };

    return (
        <div data-testid="games-grid-wrapper" className="space-y-5">
            {/* Search bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-[hsl(var(--brand-ink))]/40 pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="ابحث عن لعبة بالاسم أو الوسم…"
                        data-testid="games-search-input"
                        className="w-full h-11 pr-10 pl-10 rounded-full bg-white dark:bg-white/[0.04] border-2 border-[hsl(var(--brand-ink))]/10 dark:border-white/10 text-sm text-[hsl(var(--brand-ink))] placeholder:text-[hsl(var(--brand-ink))]/45 focus:border-[hsl(var(--brand-blue-deep))] focus:outline-none transition-colors"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            data-testid="games-search-clear"
                            aria-label="مسح البحث"
                            className="absolute top-1/2 -translate-y-1/2 left-2 inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-[hsl(var(--brand-ink))]/10 text-[hsl(var(--brand-ink))]/55"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setFiltersOpen((v) => !v)}
                    data-testid="games-filters-toggle"
                    className={`inline-flex items-center gap-2 rounded-full px-4 h-11 text-sm font-bold border-2 transition-colors ${
                        filtersOpen || activeFiltersCount > 0
                            ? "bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] border-[hsl(var(--brand-ink))]"
                            : "bg-white dark:bg-white/[0.04] text-[hsl(var(--brand-ink))] border-[hsl(var(--brand-ink))]/10 dark:border-white/10 hover:border-[hsl(var(--brand-ink))]/30"
                    }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    فلترة وترتيب
                    {activeFiltersCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[hsl(var(--brand-red))] text-white text-[10px] font-bold">
                            {activeFiltersCount}
                        </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
                </button>
            </div>

            {/* Filters panel */}
            {filtersOpen && (
                <div
                    data-testid="games-filters-panel"
                    className="rounded-2xl bg-white dark:bg-white/[0.04] border-2 border-[hsl(var(--brand-ink))]/10 dark:border-white/10 p-4 sm:p-5 grid sm:grid-cols-3 gap-4"
                >
                    <FilterGroup label="الجهاز">
                        {PLATFORM_OPTIONS.map((o) => (
                            <FilterChip
                                key={o.value}
                                active={platform === o.value}
                                onClick={() => setPlatform(o.value)}
                                testId={`filter-platform-${o.value}`}
                            >
                                {o.label}
                            </FilterChip>
                        ))}
                    </FilterGroup>
                    <FilterGroup label="التوفر">
                        {AVAIL_OPTIONS.map((o) => (
                            <FilterChip
                                key={o.value}
                                active={avail === o.value}
                                onClick={() => setAvail(o.value)}
                                testId={`filter-avail-${o.value}`}
                            >
                                {o.label}
                            </FilterChip>
                        ))}
                    </FilterGroup>
                    <FilterGroup label="الترتيب">
                        {SORT_OPTIONS.map((o) => (
                            <FilterChip
                                key={o.value}
                                active={sort === o.value}
                                onClick={() => setSort(o.value)}
                                testId={`filter-sort-${o.value}`}
                            >
                                {o.label}
                            </FilterChip>
                        ))}
                    </FilterGroup>
                </div>
            )}

            {/* Active filters summary */}
            {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="text-[hsl(var(--brand-ink))]/65">
                        <span data-testid="games-result-count" className="font-bold">{filtered.length}</span>
                        {" "}نتيجة
                    </div>
                    <button
                        onClick={clearAll}
                        data-testid="games-filters-clear"
                        className="inline-flex items-center gap-1 rounded-full px-3 h-7 bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))] font-bold hover:bg-[hsl(var(--brand-red))]/20"
                    >
                        <X className="w-3 h-3" />
                        مسح كل الفلاتر
                    </button>
                </div>
            )}

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[hsl(var(--brand-ink))]/15 p-12 text-center" data-testid="games-empty-state">
                    <Search className="w-10 h-10 text-[hsl(var(--brand-ink))]/25 mx-auto mb-3" />
                    <p className="text-base font-bold text-[hsl(var(--brand-ink))]">لا توجد ألعاب مطابقة</p>
                    <p className="text-sm text-[hsl(var(--brand-ink))]/55 mt-1">جرّب كلمات أخرى أو امسح الفلاتر.</p>
                </div>
            ) : (
                <>
                    <div
                        data-testid="games-grid"
                        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
                    >
                        {visible.map((g) => (
                            <GameCard key={g.id} game={g} />
                        ))}
                    </div>
                    {hasMore && (
                        <div className="flex justify-center pt-2">
                            <button
                                onClick={() => setShown((s) => s + PAGE_SIZE)}
                                data-testid="games-show-more"
                                className="inline-flex items-center gap-2 rounded-full px-6 h-12 bg-[hsl(var(--brand-blue-deep))] text-[hsl(var(--brand-cream))] text-sm font-bold hover:bg-[hsl(var(--brand-ink))] transition-colors"
                            >
                                عرض المزيد ({filtered.length - shown})
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const FilterGroup = ({ label, children }) => (
    <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-ink))]/55 mb-2">
            {label}
        </div>
        <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
);

const FilterChip = ({ active, onClick, testId, children }) => (
    <button
        onClick={onClick}
        data-testid={testId}
        className={`inline-flex items-center rounded-full px-3 h-8 text-[11px] sm:text-xs font-bold transition-colors ${
            active
                ? "bg-[hsl(var(--brand-blue-deep))] text-white"
                : "bg-[hsl(var(--brand-ink))]/5 text-[hsl(var(--brand-ink))]/65 hover:bg-[hsl(var(--brand-ink))]/10"
        }`}
    >
        {children}
    </button>
);
