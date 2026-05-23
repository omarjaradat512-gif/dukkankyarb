import { Star, Quote } from "lucide-react";

const REVIEWS = [
    {
        name: "جعفر",
        rating: 5,
        text: "والله قبل التعامل المحترم والاسلوب المتناسق المتجر مره محترف ومضمون مضمون مضمون دفعت فلوسي وانا مغمض الله يكثر من امثالك وبدل المتجر تفتح الف متجر 🙏",
    },
    {
        name: "زيد",
        rating: 5,
        text: "ما شاء الله والله تعامل ممتاز الله يباركلك ب المتجر واشكرك 🔥",
    },
    {
        name: "محمود",
        rating: 5,
        text: "ما شاء الله عليك قمة في الاحترام و التعامل 💯",
    },
    {
        name: "مسعود",
        rating: 5,
        text: "والله سرعة كبيره في التسليم ومضمون الله يرزقكم و اشكركم 🎮",
    },
];

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
    const avg =
        REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length;
    return (
        <section
            id="reviews"
            data-testid="reviews-section"
            className="bg-white/60 border-y border-[hsl(var(--brand-ink))]/10"
        >
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
                <div className="mb-10 sm:mb-14 grid md:grid-cols-[1fr_auto] items-end gap-6">
                    <div className="max-w-3xl">
                        <div className="inline-block text-xs font-bold uppercase tracking-[0.18em] mb-3 text-[hsl(var(--brand-red))]">
                            آراء العملاء
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--brand-ink))] leading-tight">
                            ثقة عملائنا أهم شي عنا.
                        </h2>
                        <p className="mt-3 text-base sm:text-lg text-[hsl(var(--brand-ink))]/70 leading-relaxed">
                            عملاء جربوا دُكانك. هاي شهاداتهم.
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
                                من 5 نجوم
                            </div>
                        </div>
                        <div className="h-10 w-px bg-[hsl(var(--brand-cream))]/20" />
                        <div>
                            <StarRow count={5} />
                            <div className="text-xs opacity-75 mt-1">
                                مبني على {REVIEWS.length}+ تقييم
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5 sm:gap-6 stagger">
                    {REVIEWS.map((r, i) => (
                        <article
                            key={i}
                            data-testid={`review-card-${i}`}
                            className="card-elevated relative rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 p-6 sm:p-7 flex flex-col"
                        >
                            <Quote
                                className="absolute top-5 left-5 w-8 h-8 text-[hsl(var(--brand-red))]/15 rotate-180"
                                aria-hidden
                            />
                            <StarRow count={r.rating} />
                            <p className="mt-4 text-sm sm:text-base text-[hsl(var(--brand-ink))]/85 leading-relaxed flex-1">
                                "{r.text}"
                            </p>
                            <div className="mt-5 pt-4 border-t border-[hsl(var(--brand-ink))]/10 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-blue-deep))] flex items-center justify-center text-[hsl(var(--brand-cream))] font-bold text-sm">
                                    {r.name.charAt(0)}
                                </div>
                                <div className="text-sm font-bold text-[hsl(var(--brand-ink))]">
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
