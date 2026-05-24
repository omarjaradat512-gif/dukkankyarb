import { useEffect, useState } from "react";
import { useStoreData } from "../../contexts/DataContext";
import {
    apiCreateReview,
    apiUpdateReview,
    apiDeleteReview,
    formatApiError,
} from "../../lib/api";
import { toast } from "sonner";
import { Input, Field, Textarea } from "./_widgets";
import {
    Star,
    Plus,
    Trash2,
    Save,
    Loader2,
    Pencil,
    X,
    MessageCircle,
} from "lucide-react";

const emptyReview = () => ({
    id: "",
    name: "",
    rating: 5,
    text: "",
    order: 0,
});

const slugId = () =>
    "rev-" + Math.random().toString(36).slice(2, 8);

function StarPicker({ value, onChange, testId }) {
    return (
        <div className="flex items-center gap-1" data-testid={testId}>
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    className="p-0.5"
                    data-testid={`${testId}-${n}`}
                    aria-label={`${n} نجوم`}
                >
                    <Star
                        className={`w-6 h-6 ${
                            n <= value
                                ? "fill-[hsl(var(--brand-red))] text-[hsl(var(--brand-red))]"
                                : "text-[hsl(var(--brand-ink))]/25"
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

export default function ReviewsTab({ onChanged }) {
    const { reviews } = useStoreData();
    const [editing, setEditing] = useState(null); // null | {…} (form state)
    const [busy, setBusy] = useState(false);

    const startNew = () => setEditing({ ...emptyReview(), id: slugId(), order: (reviews?.length || 0) });
    const startEdit = (r) => setEditing({ ...r });
    const cancel = () => setEditing(null);

    const save = async () => {
        if (!editing?.name?.trim() || !editing?.text?.trim()) {
            toast.error("الاسم والنص مطلوبان");
            return;
        }
        setBusy(true);
        try {
            const exists = (reviews || []).some((r) => r.id === editing.id);
            if (exists) {
                await apiUpdateReview(editing.id, editing);
                toast.success("تم تحديث التقييم");
            } else {
                await apiCreateReview(editing);
                toast.success("تم إضافة التقييم");
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
        if (!window.confirm("هل تريد حذف هذا التقييم؟")) return;
        try {
            await apiDeleteReview(id);
            toast.success("تم الحذف");
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    return (
        <div data-testid="reviews-tab" className="space-y-5">
            <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 p-5 sm:p-6 card-elevated">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[hsl(var(--brand-red))]/15 text-[hsl(var(--brand-red))] flex-shrink-0">
                            <MessageCircle className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-[hsl(var(--brand-ink))]">
                                آراء العملاء
                            </h3>
                            <p className="text-xs text-[hsl(var(--brand-ink))]/55 mt-0.5">
                                التقييمات اللي تظهر في قسم "آراء العملاء" بالصفحة الرئيسية.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={startNew}
                        data-testid="review-add-button"
                        className="inline-flex items-center gap-2 rounded-full px-4 h-10 bg-[hsl(var(--brand-blue-deep))] text-white text-xs sm:text-sm font-bold hover:bg-[hsl(var(--brand-ink))] whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة تقييم
                    </button>
                </div>

                {/* Inline editor */}
                {editing && (
                    <div
                        data-testid="review-editor"
                        className="rounded-2xl border-2 border-[hsl(var(--brand-blue-deep))]/30 bg-[hsl(var(--brand-cream))]/40 dark:bg-white/[0.06] p-4 sm:p-5 mb-5 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm">
                                {(reviews || []).some((r) => r.id === editing.id)
                                    ? "تعديل تقييم"
                                    : "تقييم جديد"}
                            </h4>
                            <button
                                onClick={cancel}
                                data-testid="review-cancel"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <Field label="اسم العميل">
                                <Input
                                    data-testid="review-name-input"
                                    value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                />
                            </Field>
                            <Field label="عدد النجوم">
                                <StarPicker
                                    value={editing.rating}
                                    onChange={(v) => setEditing({ ...editing, rating: v })}
                                    testId="review-rating-picker"
                                />
                            </Field>
                        </div>
                        <Field label="نص التقييم">
                            <Textarea
                                data-testid="review-text-input"
                                rows={3}
                                value={editing.text}
                                onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                            />
                        </Field>
                        <div className="flex justify-end">
                            <button
                                onClick={save}
                                disabled={busy}
                                data-testid="review-save-button"
                                className="inline-flex items-center gap-2 rounded-full px-6 h-10 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-bold hover:bg-[hsl(var(--brand-blue-deep))] disabled:opacity-50"
                            >
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                حفظ
                            </button>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="space-y-2">
                    {(reviews || []).length === 0 && (
                        <p className="text-center text-sm text-[hsl(var(--brand-ink))]/50 py-8">
                            لا توجد تقييمات بعد.
                        </p>
                    )}
                    {(reviews || []).map((r) => (
                        <div
                            key={r.id}
                            data-testid={`review-row-${r.id}`}
                            className="rounded-xl border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 bg-white dark:bg-white/[0.03] p-3 sm:p-4 flex items-start gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-blue-deep))] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {r.name?.charAt(0) || "؟"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-[hsl(var(--brand-ink))]">
                                        {r.name}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3 h-3 ${
                                                    i < (r.rating || 0)
                                                        ? "fill-[hsl(var(--brand-red))] text-[hsl(var(--brand-red))]"
                                                        : "text-[hsl(var(--brand-ink))]/15"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-[hsl(var(--brand-ink))]/75 mt-1 line-clamp-2">
                                    {r.text}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    onClick={() => startEdit(r)}
                                    data-testid={`review-${r.id}-edit`}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))]"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => remove(r.id)}
                                    data-testid={`review-${r.id}-delete`}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
