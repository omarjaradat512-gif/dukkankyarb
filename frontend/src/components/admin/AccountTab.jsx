import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { apiChangePassword, formatApiError } from "../../lib/api";
import { toast } from "sonner";
import { Input, Field } from "./_widgets";
import { KeyRound, Save, Loader2, Eye, EyeOff, Shield } from "lucide-react";

export default function AccountTab() {
    const { user } = useAuth();
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [busy, setBusy] = useState(false);

    const strength = (() => {
        let score = 0;
        if (next.length >= 8) score++;
        if (next.length >= 12) score++;
        if (/[A-Z]/.test(next) && /[a-z]/.test(next)) score++;
        if (/\d/.test(next)) score++;
        if (/[^A-Za-z0-9]/.test(next)) score++;
        return Math.min(score, 4);
    })();
    const strengthLabel = ["ضعيفة جداً", "ضعيفة", "متوسطة", "قوية", "قوية جداً"][strength] || "";
    const strengthColor = [
        "bg-[hsl(var(--brand-red))]",
        "bg-[hsl(var(--brand-red))]",
        "bg-amber-500",
        "bg-green-500",
        "bg-green-600",
    ][strength] || "bg-gray-300";

    const submit = async (e) => {
        e?.preventDefault?.();
        if (next.length < 8) {
            toast.error("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
            return;
        }
        if (next !== confirm) {
            toast.error("كلمة المرور وتأكيدها غير متطابقتين");
            return;
        }
        if (next === current) {
            toast.error("كلمة المرور الجديدة لا يمكن أن تكون نفس الحالية");
            return;
        }
        setBusy(true);
        try {
            await apiChangePassword(current, next);
            toast.success("تم تغيير كلمة المرور بنجاح ✅");
            setCurrent("");
            setNext("");
            setConfirm("");
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div data-testid="account-tab" className="space-y-5 max-w-2xl">
            <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 p-5 sm:p-6 card-elevated">
                <div className="flex items-start gap-3 mb-5">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))] flex-shrink-0">
                        <Shield className="w-5 h-5" />
                    </span>
                    <div>
                        <h3 className="font-bold text-base sm:text-lg text-[hsl(var(--brand-ink))]">
                            حساب الأدمن
                        </h3>
                        <p className="text-xs text-[hsl(var(--brand-ink))]/55 mt-0.5">
                            البيانات الأساسية لحسابك في لوحة التحكم.
                        </p>
                    </div>
                </div>

                <div className="rounded-xl bg-[hsl(var(--brand-cream))]/50 dark:bg-white/[0.04] p-4 mb-5">
                    <div className="text-[11px] font-bold text-[hsl(var(--brand-ink))]/55 mb-1">
                        البريد الإلكتروني
                    </div>
                    <div className="font-mono text-sm text-[hsl(var(--brand-ink))]" dir="ltr">
                        {user?.email || "—"}
                    </div>
                </div>
            </div>

            <form
                onSubmit={submit}
                className="rounded-2xl bg-white dark:bg-white/[0.04] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 p-5 sm:p-6 card-elevated"
            >
                <div className="flex items-start gap-3 mb-5">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[hsl(var(--brand-red))]/15 text-[hsl(var(--brand-red))] flex-shrink-0">
                        <KeyRound className="w-5 h-5" />
                    </span>
                    <div>
                        <h3 className="font-bold text-base sm:text-lg text-[hsl(var(--brand-ink))]">
                            تغيير كلمة المرور
                        </h3>
                        <p className="text-xs text-[hsl(var(--brand-ink))]/55 mt-0.5">
                            اختر كلمة قوية: على الأقل 8 أحرف، تتضمن حروف وأرقام ورموز.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Field label="كلمة المرور الحالية">
                        <div className="relative">
                            <Input
                                data-testid="acct-current-password"
                                type={showCurrent ? "text" : "password"}
                                value={current}
                                onChange={(e) => setCurrent(e.target.value)}
                                autoComplete="current-password"
                                dir="ltr"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent((v) => !v)}
                                className="absolute top-1/2 -translate-y-1/2 left-2 p-1.5 rounded-md hover:bg-black/5"
                                data-testid="acct-current-toggle"
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </Field>

                    <Field label="كلمة المرور الجديدة">
                        <div className="relative">
                            <Input
                                data-testid="acct-new-password"
                                type={showNext ? "text" : "password"}
                                value={next}
                                onChange={(e) => setNext(e.target.value)}
                                autoComplete="new-password"
                                dir="ltr"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNext((v) => !v)}
                                className="absolute top-1/2 -translate-y-1/2 left-2 p-1.5 rounded-md hover:bg-black/5"
                                data-testid="acct-new-toggle"
                            >
                                {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {next && (
                            <div className="mt-2 space-y-1">
                                <div className="h-1.5 bg-[hsl(var(--brand-ink))]/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${strengthColor}`}
                                        style={{ width: `${((strength + 1) / 5) * 100}%` }}
                                    />
                                </div>
                                <div className="text-[10px] text-[hsl(var(--brand-ink))]/60">
                                    قوة كلمة المرور: <span className="font-bold">{strengthLabel}</span>
                                </div>
                            </div>
                        )}
                    </Field>

                    <Field label="تأكيد كلمة المرور الجديدة">
                        <Input
                            data-testid="acct-confirm-password"
                            type={showNext ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="new-password"
                            dir="ltr"
                        />
                        {confirm && next !== confirm && (
                            <div className="text-[11px] text-[hsl(var(--brand-red))] mt-1 font-bold">
                                كلمتا المرور غير متطابقتين
                            </div>
                        )}
                    </Field>
                </div>

                <div className="mt-5 flex justify-end">
                    <button
                        type="submit"
                        disabled={busy || !current || !next || !confirm}
                        data-testid="acct-save-button"
                        className="inline-flex items-center gap-2 rounded-full px-6 h-11 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-bold hover:bg-[hsl(var(--brand-blue-deep))] disabled:opacity-50"
                    >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        تحديث كلمة المرور
                    </button>
                </div>
            </form>
        </div>
    );
}
