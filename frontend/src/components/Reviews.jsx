import { Star, Quote } from "lucide-react";
import { useStoreData } from "../contexts/DataContext";

const StarRow = ({ count }) => (
    <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${
                    i < count
                        ? "fill-[hsl(var(--brand-red))] text-[hsl(var(--brand-red))]"
                        : "text-[hsl(var(--brand-ink))]/15"
                }`}
            />
        ))}
    </div>
);

export const Reviews = () => {
    const { reviews, content } = useStoreData();
    const c = content?.reviews || {};
    const list = reviews || [];
    if (list.length === 0) return null;
    const avg =
        list.reduce((s, r) => s + (r.rating || 0), 0) / Math.max(1, list.length);

    return (
        <section
            id="reviews"
            data-testid="reviews-section"
            className="bg-white/60 dark:bg-white/[0.03] border-y border-[hsl(var(--brand-ink))]/10 dark:border-white/10"
        >
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
                <div className="mb-10 sm:mb-14 grid md:grid-cols-[1fr_auto] items-end gap-6">
                    <div className="max-w-3xl">
                        <div className="inline-block text-xs font-bold uppercase tracking-[0.18em] mb-3 text-[hsl(var(--brand-red))]">
                            {c.eyebrow}
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--brand-ink))] dark:text-[hsl(var(--brand-cream))] leading-tight">
                            {c.title}
                        </h2>
                        <p className="mt-3 text-base sm:text-lg text-[hsl(var(--brand-ink))]/70 dark:text-[hsl(var(--brand-cream))]/70 leading-relaxed">
                            {c.description}
                        </p>
                    </div>
                    <div
                        data-testid="reviews-rating-card"
                        className="rounded-2xl bg-[hsl(var(--brand-blue-deep))] text-[hsl(var(--brand-cream))] px-5 py-4 inline-flex items-center gap-4 self-start"
                    >
                        <div>
                            <div className="text-3xl font-bold leading-none">
                                {avg.toFixed(1)}
                            </div>
                            <div className="text-xs opacity-75 mt-1">
                                {c.ratingOutOf5}
                            </div>
                        </div>
                        <div className="h-10 w-px bg-[hsl(var(--brand-cream))]/20" />
                        <div>
                            <StarRow count={5} />
                            <div className="text-xs opacity-75 mt-1">
                                {`${c.basedOn} ${list.length}+`}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5 sm:gap-6 stagger">
                    {list.map((r, i) => (
                        <article
                            key={r.id || i}
                            data-testid={`review-card-${i}`}
                            className="card-elevated relative rounded-2xl bg-white dark:bg-white/[0.04] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 p-6 sm:p-7 flex flex-col"
                        >
                            <Quote
                                className="absolute top-5 left-5 w-8 h-8 text-[hsl(var(--brand-red))]/15 rotate-180"
                                aria-hidden
                            />
                            <StarRow count={r.rating || 0} />
                            <p className="mt-4 text-sm sm:text-base text-[hsl(var(--brand-ink))]/85 dark:text-[hsl(var(--brand-cream))]/80 leading-relaxed flex-1">
                                "{r.text}"
                            </p>
                            <div className="mt-5 pt-4 border-t border-[hsl(var(--brand-ink))]/10 dark:border-white/10 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-blue-deep))] flex items-center justify-center text-[hsl(var(--brand-cream))] font-bold text-sm">
                                    {(r.name || "؟").charAt(0)}
                                </div>
                                <div className="text-sm font-bold text-[hsl(var(--brand-ink))] dark:text-[hsl(var(--brand-cream))]">
                                    {r.name}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};
