import { Check, X } from "lucide-react";

const ROWS = [
    { feature: "اللعب أونلاين متعدد اللاعبين", essential: true, extra: true },
    { feature: "ألعاب شهرية مجانية", essential: true, extra: true },
    { feature: "مكتبة بأكثر من 400 لعبة", essential: false, extra: true },
    { feature: "ألعاب PS4 و PS5 ضمن المكتبة", essential: false, extra: true },
    { feature: "تجارب لعب محدودة المدة", essential: false, extra: true },
    { feature: "دعم على واتساب من المتجر", essential: true, extra: true },
];

export const ComparisonTable = () => {
    return (
        <section
            id="comparison"
            data-testid="comparison-section"
            className="bg-[hsl(var(--brand-cream))]"
        >
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
                <div className="mb-10 max-w-3xl">
                    <div className="inline-block text-xs font-bold uppercase tracking-[0.18em] mb-3 text-[hsl(var(--brand-blue-deep))]">
                        مقارنة الباقات
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--brand-ink))] leading-tight">
                        أساسي ولا إضافي؟ شو الفرق؟
                    </h2>
                    <p className="mt-3 text-base sm:text-lg text-[hsl(var(--brand-ink))]/70 leading-relaxed">
                        جدول واضح بيوضحلك كل شي بتحصل عليه مع كل باقة عشان
                        تختار اللي يناسبك.
                    </p>
                </div>

                <div
                    data-testid="comparison-table-wrap"
                    className="card-elevated rounded-3xl bg-white border border-[hsl(var(--brand-ink))]/10 overflow-hidden"
                >
                    {/* Table head */}
                    <div className="grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr]">
                        <div className="bg-[hsl(var(--brand-cream))]/60 px-4 sm:px-6 py-5 border-b border-[hsl(var(--brand-ink))]/10">
                            <div className="text-xs font-semibold text-[hsl(var(--brand-ink))]/55 uppercase tracking-wider">
                                الميزة
                            </div>
                        </div>
                        <div className="bg-[hsl(var(--brand-blue))]/15 px-4 sm:px-6 py-5 border-b border-[hsl(var(--brand-ink))]/10 text-center">
                            <div className="text-base sm:text-lg font-bold text-[hsl(var(--brand-blue-deep))]">
                                أساسي
                            </div>
                        </div>
                        <div className="bg-[hsl(var(--brand-red))]/10 px-4 sm:px-6 py-5 border-b border-[hsl(var(--brand-ink))]/10 text-center relative">
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-block text-[10px] sm:text-[11px] font-bold rounded-full bg-[hsl(var(--brand-red))] text-[hsl(var(--brand-cream))] px-2.5 py-0.5">
                                الأكثر طلباً
                            </span>
                            <div className="text-base sm:text-lg font-bold text-[hsl(var(--brand-red))]">
                                إضافي
                            </div>
                        </div>
                    </div>

                    {/* Rows */}
                    {ROWS.map((row, i) => (
                        <div
                            key={i}
                            data-testid={`comparison-row-${i}`}
                            className={`grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr] ${
                                i % 2 === 0
                                    ? "bg-white"
                                    : "bg-[hsl(var(--brand-cream))]/40"
                            }`}
                        >
                            <div className="px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base font-medium text-[hsl(var(--brand-ink))] border-b border-[hsl(var(--brand-ink))]/5">
                                {row.feature}
                            </div>
                            <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-center border-b border-[hsl(var(--brand-ink))]/5">
                                {row.essential ? (
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--brand-blue-deep))] text-[hsl(var(--brand-cream))]">
                                        <Check className="w-4 h-4" strokeWidth={3} />
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--brand-ink))]/10 text-[hsl(var(--brand-ink))]/40">
                                        <X className="w-4 h-4" strokeWidth={2.5} />
                                    </span>
                                )}
                            </div>
                            <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-center border-b border-[hsl(var(--brand-ink))]/5">
                                {row.extra ? (
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--brand-red))] text-[hsl(var(--brand-cream))]">
                                        <Check className="w-4 h-4" strokeWidth={3} />
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--brand-ink))]/10 text-[hsl(var(--brand-ink))]/40">
                                        <X className="w-4 h-4" strokeWidth={2.5} />
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* CTA row */}
                    <div className="grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr] bg-[hsl(var(--brand-cream))]/70">
                        <div className="px-4 sm:px-6 py-5 text-xs sm:text-sm text-[hsl(var(--brand-ink))]/60">
                            ابدأ رحلتك:
                        </div>
                        <div className="px-3 sm:px-6 py-5 flex items-center justify-center">
                            <a
                                href="#essential"
                                data-testid="comparison-cta-essential"
                                className="inline-flex items-center justify-center rounded-full px-4 sm:px-5 h-10 bg-[hsl(var(--brand-blue-deep))] text-[hsl(var(--brand-cream))] text-xs sm:text-sm font-semibold hover:bg-[hsl(var(--brand-ink))] transition-colors"
                            >
                                اختر الأساسي
                            </a>
                        </div>
                        <div className="px-3 sm:px-6 py-5 flex items-center justify-center">
                            <a
                                href="#extra"
                                data-testid="comparison-cta-extra"
                                className="inline-flex items-center justify-center rounded-full px-4 sm:px-5 h-10 bg-[hsl(var(--brand-red))] text-[hsl(var(--brand-cream))] text-xs sm:text-sm font-semibold hover:bg-[hsl(var(--brand-red-soft))] transition-colors"
                            >
                                اختر الإضافي
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
