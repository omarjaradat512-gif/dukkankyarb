import { useState } from "react";
import { useStoreData } from "../../contexts/DataContext";
import {
    apiUpdateSubscription,
    apiCreateSubscription,
    apiDeleteSubscription,
    formatApiError,
} from "../../lib/api";
import { toast } from "sonner";
import { Pencil, Save, X, Loader2, Plus, Trash2 } from "lucide-react";
import { Input, Field, numOrNull } from "./_widgets";

const blankDuration = (id = "") => ({
    id,
    label: "",
    label_en: "",
    four: "",
    five: "",
});

const toForm = (sub) => ({
    ...sub,
    durations: sub.durations.map((d) => ({
        ...d,
        four: d.four == null ? "" : String(d.four),
        five: d.five == null ? "" : String(d.five),
    })),
});

const toPayload = (f) => ({
    id: f.id,
    name: f.name || "",
    name_en: f.name_en || "",
    tagline: f.tagline || "",
    tagline_en: f.tagline_en || "",
    accent: f.accent || "blue",
    durations: f.durations.map((d) => ({
        id: d.id.trim(),
        label: d.label || "",
        label_en: d.label_en || "",
        four: numOrNull(d.four),
        five: numOrNull(d.five),
    })),
});

export default function SubscriptionsTab({ onChanged }) {
    const { subscriptions } = useStoreData();
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(null);
    const [busy, setBusy] = useState(false);

    const startEdit = (sub) => {
        setEditingId(sub.id);
        setForm(toForm(sub));
    };
    const cancel = () => {
        setEditingId(null);
        setForm(null);
    };

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const setDur = (idx, k, v) =>
        setForm((f) => ({
            ...f,
            durations: f.durations.map((d, i) => (i === idx ? { ...d, [k]: v } : d)),
        }));

    const onSave = async () => {
        setBusy(true);
        try {
            await apiUpdateSubscription(form.id, toPayload(form));
            toast.success("تم حفظ الاشتراك");
            cancel();
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div data-testid="subscriptions-tab" className="space-y-5">
            <p className="text-sm text-[hsl(var(--brand-ink))]/65 px-2">
                يمكن تعديل أسعار الاشتراكات (PS4 / PS5) لكل مدّة. اتركها فاضية لإلغاء التوفّر على ذلك الجهاز.
            </p>

            {subscriptions.map((sub) => (
                <div
                    key={sub.id}
                    data-testid={`sub-row-${sub.id}`}
                    className={`rounded-2xl border-2 overflow-hidden card-elevated ${
                        sub.accent === "red"
                            ? "border-[hsl(var(--brand-red))]/30 bg-[hsl(var(--brand-red))]/5"
                            : "border-[hsl(var(--brand-blue))]/40 bg-[hsl(var(--brand-blue))]/5"
                    }`}
                >
                    <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-[hsl(var(--brand-ink))]/10">
                        <div>
                            <h3 className="font-bold text-[hsl(var(--brand-ink))]">
                                {sub.name}
                                <span className="text-xs font-medium text-[hsl(var(--brand-ink))]/55 mr-2">
                                    ({sub.id})
                                </span>
                            </h3>
                            <p className="text-xs text-[hsl(var(--brand-ink))]/55">
                                {sub.tagline}
                            </p>
                        </div>
                        {editingId !== sub.id && (
                            <button
                                onClick={() => startEdit(sub)}
                                data-testid={`sub-${sub.id}-edit`}
                                className="inline-flex items-center gap-1.5 rounded-full px-4 h-9 bg-[hsl(var(--brand-blue-deep))] text-white text-xs font-bold hover:bg-[hsl(var(--brand-ink))]"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                تعديل
                            </button>
                        )}
                    </div>

                    {editingId === sub.id ? (
                        <div className="p-5 bg-white space-y-4">
                            <div className="grid sm:grid-cols-2 gap-3">
                                <Field label="اسم الاشتراك">
                                    <Input
                                        data-testid={`sub-${sub.id}-name-input`}
                                        value={form.name}
                                        onChange={(e) => set("name", e.target.value)}
                                    />
                                </Field>
                                <Field label="الشعار / الوصف">
                                    <Input
                                        data-testid={`sub-${sub.id}-tagline-input`}
                                        value={form.tagline}
                                        onChange={(e) => set("tagline", e.target.value)}
                                    />
                                </Field>
                            </div>

                            <div>
                                <h4 className="font-bold text-sm mb-2 text-[hsl(var(--brand-ink))]">
                                    المدد والأسعار
                                </h4>
                                <div className="space-y-2">
                                    {form.durations.map((d, idx) => (
                                        <div
                                            key={d.id}
                                            data-testid={`dur-${d.id}-row`}
                                            className="grid grid-cols-1 sm:grid-cols-[1fr_140px_140px] gap-2 rounded-xl border-2 border-[hsl(var(--brand-ink))]/10 bg-[hsl(var(--brand-cream))]/40 p-3"
                                        >
                                            <Field label="المدة">
                                                <Input
                                                    data-testid={`dur-${d.id}-label`}
                                                    value={d.label}
                                                    onChange={(e) => setDur(idx, "label", e.target.value)}
                                                />
                                            </Field>
                                            <Field label="PS4 ($)">
                                                <Input
                                                    data-testid={`dur-${d.id}-four`}
                                                    value={d.four}
                                                    onChange={(e) => setDur(idx, "four", e.target.value)}
                                                    inputMode="decimal"
                                                    dir="ltr"
                                                />
                                            </Field>
                                            <Field label="PS5 ($)">
                                                <Input
                                                    data-testid={`dur-${d.id}-five`}
                                                    value={d.five}
                                                    onChange={(e) => setDur(idx, "five", e.target.value)}
                                                    inputMode="decimal"
                                                    dir="ltr"
                                                />
                                            </Field>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={cancel}
                                    className="inline-flex items-center gap-2 rounded-full px-5 h-10 bg-[hsl(var(--brand-ink))]/10 text-[hsl(var(--brand-ink))] text-sm font-bold hover:bg-[hsl(var(--brand-ink))]/15"
                                >
                                    <X className="w-4 h-4" /> إلغاء
                                </button>
                                <button
                                    onClick={onSave}
                                    disabled={busy}
                                    data-testid={`sub-${sub.id}-save`}
                                    className="inline-flex items-center gap-2 rounded-full px-6 h-10 bg-[hsl(var(--brand-blue-deep))] text-white text-sm font-bold hover:bg-[hsl(var(--brand-ink))] disabled:opacity-50"
                                >
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    حفظ
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-5 grid sm:grid-cols-3 gap-2 bg-white">
                            {sub.durations.map((d) => (
                                <div
                                    key={d.id}
                                    className="rounded-xl border border-[hsl(var(--brand-ink))]/10 p-3 bg-[hsl(var(--brand-cream))]/40"
                                >
                                    <div className="font-bold text-sm">{d.label}</div>
                                    <div className="text-xs text-[hsl(var(--brand-ink))]/65 mt-1 flex justify-between">
                                        <span>PS4: {d.four == null ? "—" : `$${d.four}`}</span>
                                        <span>PS5: {d.five == null ? "—" : `$${d.five}`}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
