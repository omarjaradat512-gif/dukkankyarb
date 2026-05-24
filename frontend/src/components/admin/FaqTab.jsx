import { useState } from "react";
import { useStoreData } from "../../contexts/DataContext";
import {
    apiCreateFaq,
    apiUpdateFaq,
    apiDeleteFaq,
    formatApiError,
} from "../../lib/api";
import { toast } from "sonner";
import { Input, Field, Textarea } from "./_widgets";
import { FAQ_ICON_OPTIONS } from "../FAQ";
import {
    HelpCircle,
    Truck,
    CreditCard,
    ShieldCheck,
    Gift,
    Clock,
    Headphones,
    Star,
    Zap,
    Tag,
    Plus,
    Trash2,
    Save,
    Loader2,
    Pencil,
    X,
} from "lucide-react";

const ICONS = {
    "truck": Truck,
    "credit-card": CreditCard,
    "shield-check": ShieldCheck,
    "gift": Gift,
    "clock": Clock,
    "headphones": Headphones,
    "star": Star,
    "zap": Zap,
    "tag": Tag,
    "help-circle": HelpCircle,
};

const emptyFaq = () => ({
    id: "",
    icon: "help-circle",
    q: "",
    a: "",
    order: 0,
});

const slugId = () => "faq-" + Math.random().toString(36).slice(2, 8);

export default function FaqTab({ onChanged }) {
    const { faqs } = useStoreData();
    const [editing, setEditing] = useState(null);
    const [busy, setBusy] = useState(false);

    const startNew = () =>
        setEditing({ ...emptyFaq(), id: slugId(), order: (faqs?.length || 0) });
    const startEdit = (f) => setEditing({ ...f });
    const cancel = () => setEditing(null);

    const save = async () => {
        if (!editing?.q?.trim() || !editing?.a?.trim()) {
            toast.error("السؤال والإجابة مطلوبان");
            return;
        }
        setBusy(true);
        try {
            const exists = (faqs || []).some((f) => f.id === editing.id);
            if (exists) {
                await apiUpdateFaq(editing.id, editing);
                toast.success("تم تحديث السؤال");
            } else {
                await apiCreateFaq(editing);
                toast.success("تم إضافة السؤال");
            }
            setEditing(null);
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id) => {
        if (!window.confirm("هل تريد حذف هذا السؤال؟")) return;
        try {
            await apiDeleteFaq(id);
            toast.success("تم الحذف");
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    return (
        <div data-testid="faq-tab" className="space-y-5">
            <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 p-5 sm:p-6 card-elevated">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))] flex-shrink-0">
                            <HelpCircle className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-[hsl(var(--brand-ink))]">
                                الأسئلة الشائعة
                            </h3>
                            <p className="text-xs text-[hsl(var(--brand-ink))]/55 mt-0.5">
                                الأسئلة اللي تظهر في قسم "الأسئلة الشائعة" بالصفحة الرئيسية.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={startNew}
                        data-testid="faq-add-button"
                        className="inline-flex items-center gap-2 rounded-full px-4 h-10 bg-[hsl(var(--brand-blue-deep))] text-white text-xs sm:text-sm font-bold hover:bg-[hsl(var(--brand-ink))] whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة سؤال
                    </button>
                </div>

                {editing && (
                    <div
                        data-testid="faq-editor"
                        className="rounded-2xl border-2 border-[hsl(var(--brand-blue-deep))]/30 bg-[hsl(var(--brand-cream))]/40 dark:bg-white/[0.06] p-4 sm:p-5 mb-5 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm">
                                {(faqs || []).some((f) => f.id === editing.id) ? "تعديل سؤال" : "سؤال جديد"}
                            </h4>
                            <button
                                onClick={cancel}
                                data-testid="faq-cancel"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <Field label="الأيقونة">
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2" data-testid="faq-icon-grid">
                                {FAQ_ICON_OPTIONS.map((key) => {
                                    const Ico = ICONS[key] || HelpCircle;
                                    const selected = editing.icon === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setEditing({ ...editing, icon: key })}
                                            data-testid={`faq-icon-${key}`}
                                            className={`h-11 rounded-lg border-2 flex items-center justify-center transition-colors ${
                                                selected
                                                    ? "bg-[hsl(var(--brand-blue-deep))] text-white border-[hsl(var(--brand-blue-deep))]"
                                                    : "bg-white dark:bg-white/[0.06] border-[hsl(var(--brand-ink))]/15 dark:border-white/10 text-[hsl(var(--brand-ink))]/70 hover:border-[hsl(var(--brand-blue-deep))]/40"
                                            }`}
                                            title={key}
                                        >
                                            <Ico className="w-4 h-4" />
                                        </button>
                                    );
                                })}
                            </div>
                        </Field>

                        <Field label="السؤال">
                            <Input
                                data-testid="faq-q-input"
                                value={editing.q}
                                onChange={(e) => setEditing({ ...editing, q: e.target.value })}
                            />
                        </Field>
                        <Field label="الإجابة" hint="يدعم أسطر متعددة (Enter لسطر جديد).">
                            <Textarea
                                data-testid="faq-a-input"
                                rows={4}
                                value={editing.a}
                                onChange={(e) => setEditing({ ...editing, a: e.target.value })}
                            />
                        </Field>

                        <div className="flex justify-end">
                            <button
                                onClick={save}
                                disabled={busy}
                                data-testid="faq-save-button"
                                className="inline-flex items-center gap-2 rounded-full px-6 h-10 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-bold hover:bg-[hsl(var(--brand-blue-deep))] disabled:opacity-50"
                            >
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                حفظ
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {(faqs || []).length === 0 && (
                        <p className="text-center text-sm text-[hsl(var(--brand-ink))]/50 py-8">
                            لا توجد أسئلة بعد.
                        </p>
                    )}
                    {(faqs || []).map((f) => {
                        const Ico = ICONS[f.icon] || HelpCircle;
                        return (
                            <div
                                key={f.id}
                                data-testid={`faq-row-${f.id}`}
                                className="rounded-xl border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 bg-white dark:bg-white/[0.03] p-3 sm:p-4 flex items-start gap-3"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))] flex items-center justify-center flex-shrink-0">
                                    <Ico className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-[hsl(var(--brand-ink))]">{f.q}</p>
                                    <p className="text-xs text-[hsl(var(--brand-ink))]/65 mt-1 line-clamp-2 whitespace-pre-line">
                                        {f.a}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => startEdit(f)}
                                        data-testid={`faq-${f.id}-edit`}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))]"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => remove(f.id)}
                                        data-testid={`faq-${f.id}-delete`}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
