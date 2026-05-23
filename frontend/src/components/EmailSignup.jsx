import { useState } from "react";
import { Gift, Check, Copy, Loader2, Mail } from "lucide-react";
import { apiSubscribe, formatApiError } from "../lib/api";
import { toast } from "sonner";

export const EmailSignup = () => {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [code, setCode] = useState("");
    const [already, setAlready] = useState(false);
    const [copied, setCopied] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) return;
        setSubmitting(true);
        try {
            const res = await apiSubscribe(trimmed);
            setCode(res.code);
            setAlready(!!res.alreadyRegistered);
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setSubmitting(false);
        }
    };

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {}
    };

    return (
        <section
            id="email-signup"
            data-testid="email-signup-section"
            className="bg-[hsl(var(--brand-cream))]"
        >
            <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(var(--brand-blue-deep))] via-[#1d4f6e] to-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] p-8 sm:p-12 card-elevated">
                    <div className="absolute -top-12 -right-12 w-56 h-56 keffiyeh-pattern opacity-25 rotate-12" />
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 keffiyeh-pattern opacity-20 -rotate-12" />

                    <div className="relative grid md:grid-cols-[1fr_360px] gap-8 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#7CFF8A]/15 border border-[#7CFF8A]/30 px-3 py-1 text-xs font-bold text-[#7CFF8A] mb-4">
                                <Gift className="w-3.5 h-3.5" />
                                عرض ترحيبي
                            </div>

                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                                خصم <span className="text-[#7CFF8A]">10%</span> على
                                أول طلب
                            </h2>
                            <p className="mt-4 text-base sm:text-lg opacity-85 leading-relaxed max-w-xl">
                                سجّل إيميلك واحصل على كود خصم 10% فوراً —
                                نستخدمه فقط لإرسال عروضنا الحصرية، ولن نشاركه
                                مع أي طرف ثالث.
                            </p>

                            <ul className="mt-5 space-y-2 text-sm">
                                {[
                                    "كود خصم فوري لأول طلب",
                                    "نبّهك عند العروض والخصومات الكبيرة",
                                    "نخبرك أولاً عند توفر الألعاب الجديدة",
                                ].map((b, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#7CFF8A] flex-shrink-0" />
                                        <span className="opacity-90">{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white/95 text-[hsl(var(--brand-ink))] rounded-2xl p-6 shadow-2xl">
                            {!code ? (
                                <form
                                    onSubmit={onSubmit}
                                    data-testid="email-signup-form"
                                    className="space-y-4"
                                >
                                    <label className="block">
                                        <span className="block text-xs font-bold text-[hsl(var(--brand-ink))]/70 mb-1.5">
                                            بريدك الإلكتروني
                                        </span>
                                        <div className="relative">
                                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--brand-ink))]/40 pointer-events-none" />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                dir="ltr"
                                                data-testid="email-signup-input"
                                                className="w-full h-12 rounded-xl border-2 border-[hsl(var(--brand-ink))]/15 bg-white pr-9 pl-3 text-sm font-medium focus:border-[hsl(var(--brand-blue-deep))] focus:outline-none"
                                            />
                                        </div>
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        data-testid="email-signup-submit"
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-full h-12 bg-[hsl(var(--brand-red))] text-white font-bold text-sm hover:bg-[hsl(var(--brand-red))]/85 transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Gift className="w-4 h-4" />
                                        )}
                                        أرسل لي الكود
                                    </button>

                                    <p className="text-[10px] text-[hsl(var(--brand-ink))]/50 text-center leading-relaxed">
                                        بالاشتراك أنت توافق على استلام رسائل ترويجية. يمكنك إلغاء الاشتراك في أي وقت.
                                    </p>
                                </form>
                            ) : (
                                <div data-testid="email-signup-success" className="text-center">
                                    <div className="w-14 h-14 mx-auto rounded-full bg-[#7CFF8A]/20 flex items-center justify-center mb-3">
                                        <Check className="w-7 h-7 text-[#1a7a26]" />
                                    </div>
                                    <h3 className="font-bold text-lg text-[hsl(var(--brand-ink))]">
                                        {already ? "مسجّل مسبقاً!" : "تم التسجيل!"}
                                    </h3>
                                    <p className="text-xs text-[hsl(var(--brand-ink))]/65 mt-1">
                                        كود الخصم خاصتك:
                                    </p>
                                    <div className="mt-3 rounded-xl border-2 border-dashed border-[hsl(var(--brand-blue-deep))] bg-[hsl(var(--brand-blue))]/10 p-4 flex items-center justify-between gap-2">
                                        <code
                                            dir="ltr"
                                            data-testid="email-signup-code"
                                            className="text-lg sm:text-xl font-extrabold tracking-wider text-[hsl(var(--brand-blue-deep))]"
                                        >
                                            {code}
                                        </code>
                                        <button
                                            onClick={copyCode}
                                            data-testid="email-signup-copy"
                                            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--brand-blue-deep))] text-white hover:bg-[hsl(var(--brand-ink))] transition-colors"
                                            aria-label="نسخ الكود"
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-[hsl(var(--brand-ink))]/60 mt-3 leading-relaxed">
                                        احفظ الكود واذكره عند الطلب على واتساب.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
