import { useState } from "react";
import { useStoreData } from "../../contexts/DataContext";
import {
    apiCreateBundle,
    apiUpdateBundle,
    apiDeleteBundle,
    formatApiError,
} from "../../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Save, X, Loader2 } from "lucide-react";
import { Input, Field, Toggle, numOrNull } from "./_widgets";

const blank = () => ({
    id: "",
    subId: "essential",
    durationId: "",
    gameId: "",
    tier: "five",
    bundlePrice: "",
    available: true,
});

const toForm = (b) => ({ ...b, bundlePrice: String(b.bundlePrice) });

const toPayload = (f) => ({
    id: f.id.trim(),
    subId: f.subId,
    durationId: f.durationId,
    gameId: f.gameId,
    tier: f.tier,
    bundlePrice: numOrNull(f.bundlePrice) ?? 0,
    available: !!f.available,
});

export default function BundlesTab({ onChanged }) {
    const { bundles, subscriptions, games } = useStoreData();
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);
    const [busy, setBusy] = useState(false);

    const subOptions = subscriptions;
    const gameOptions = games.filter((g) => g.available !== false);

    const startNew = () => {
        setEditing(blank());
        setCreating(true);
    };
    const startEdit = (b) => {
        setEditing(toForm(b));
        setCreating(false);
    };
    const cancel = () => {
        setEditing(null);
        setCreating(false);
    };

    const onSave = async () => {
        if (!editing) return;
        const payload = toPayload(editing);
        if (!payload.id || !payload.subId || !payload.gameId || !payload.durationId) {
            toast.error("جميع الحقول مطلوبة");
            return;
        }
        setBusy(true);
        try {
            if (creating) {
                await apiCreateBundle(payload);
                toast.success("تمت إضافة الباقة");
            } else {
                await apiUpdateBundle(payload.id, payload);
                toast.success("تم تحديث الباقة");
            }
            cancel();
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    const onDelete = async (b) => {
        if (!window.confirm(`حذف الباقة "${b.id}"؟`)) return;
        setBusy(true);
        try {
            await apiDeleteBundle(b.id);
            toast.success("تم حذف الباقة");
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    const subOfForm = subscriptions.find((s) => s.id === editing?.subId);

    return (
        <div data-testid="bundles-tab" className="space-y-5">
            <div className="flex items-center justify-between bg-white rounded-2xl border border-[hsl(var(--brand-ink))]/10 px-4 py-3 card-elevated">
                <p className="text-sm text-[hsl(var(--brand-ink))]/65">
                    باقات اشتراك + لعبة بسعر خاص.
                </p>
                <button
                    onClick={startNew}
                    data-testid="add-bundle-button"
                    className="inline-flex items-center gap-2 rounded-full px-5 h-10 bg-[hsl(var(--brand-blue-deep))] text-white text-sm font-bold hover:bg-[hsl(var(--brand-ink))]"
                >
                    <Plus className="w-4 h-4" />
                    باقة جديدة
                </button>
            </div>

            {editing && (
                <div
                    data-testid="bundle-editor"
                    className="rounded-2xl bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] p-5 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold">
                            {creating ? "باقة جديدة" : `تعديل ${editing.id}`}
                        </h3>
                        <button
                            onClick={cancel}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Field label="معرّف الباقة (ID)">
                            <Input
                                data-testid="bundle-id-input"
                                value={editing.id}
                                onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                                disabled={!creating}
                                dir="ltr"
                            />
                        </Field>
                        <Field label="الاشتراك">
                            <select
                                data-testid="bundle-sub-select"
                                value={editing.subId}
                                onChange={(e) => setEditing({ ...editing, subId: e.target.value, durationId: "" })}
                                className="w-full h-10 rounded-lg border-2 border-white/15 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] px-3 text-sm font-medium focus:border-white/40 focus:outline-none"
                            >
                                {subOptions.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="المدة">
                            <select
                                data-testid="bundle-duration-select"
                                value={editing.durationId}
                                onChange={(e) => setEditing({ ...editing, durationId: e.target.value })}
                                className="w-full h-10 rounded-lg border-2 border-white/15 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] px-3 text-sm font-medium focus:border-white/40 focus:outline-none"
                            >
                                <option value="">— اختر —</option>
                                {(subOfForm?.durations || []).map((d) => (
                                    <option key={d.id} value={d.id}>{d.label} ({d.id})</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="اللعبة">
                            <select
                                data-testid="bundle-game-select"
                                value={editing.gameId}
                                onChange={(e) => setEditing({ ...editing, gameId: e.target.value })}
                                className="w-full h-10 rounded-lg border-2 border-white/15 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] px-3 text-sm font-medium focus:border-white/40 focus:outline-none"
                            >
                                <option value="">— اختر —</option>
                                {gameOptions.map((g) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="الجهاز">
                            <select
                                data-testid="bundle-tier-select"
                                value={editing.tier}
                                onChange={(e) => setEditing({ ...editing, tier: e.target.value })}
                                className="w-full h-10 rounded-lg border-2 border-white/15 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] px-3 text-sm font-medium focus:border-white/40 focus:outline-none"
                            >
                                <option value="five">PS5</option>
                                <option value="four">PS4</option>
                            </select>
                        </Field>
                        <Field label="سعر الباقة ($)">
                            <Input
                                data-testid="bundle-price-input"
                                value={editing.bundlePrice}
                                onChange={(e) => setEditing({ ...editing, bundlePrice: e.target.value })}
                                inputMode="decimal"
                                dir="ltr"
                            />
                        </Field>
                        <div className="flex items-end">
                            <Toggle
                                checked={editing.available}
                                onChange={(v) => setEditing({ ...editing, available: v })}
                                testId="bundle-available-toggle"
                                label={editing.available ? "متوفرة" : "غير متوفرة"}
                            />
                        </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            onClick={cancel}
                            className="inline-flex items-center gap-2 rounded-full px-5 h-10 bg-white/10 hover:bg-white/20 text-sm font-bold"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={onSave}
                            disabled={busy}
                            data-testid="bundle-editor-save"
                            className="inline-flex items-center gap-2 rounded-full px-6 h-10 bg-[#7CFF8A] text-[hsl(var(--brand-ink))] text-sm font-bold hover:bg-[#9affa6] disabled:opacity-50"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            حفظ
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {bundles.length === 0 && (
                    <p className="text-center text-sm text-[hsl(var(--brand-ink))]/50 py-10">
                        لا توجد باقات
                    </p>
                )}
                {bundles.map((b) => {
                    const sub = subscriptions.find((s) => s.id === b.subId);
                    const dur = sub?.durations.find((d) => d.id === b.durationId);
                    const game = games.find((g) => g.id === b.gameId);
                    return (
                        <div
                            key={b.id}
                            data-testid={`bundle-row-${b.id}`}
                            className="rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 p-4 flex items-center gap-4 card-elevated"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-[hsl(var(--brand-ink))]">
                                    {sub?.name} ({dur?.label}) + {game?.name}
                                </div>
                                <div className="text-[11px] text-[hsl(var(--brand-ink))]/55 mt-0.5 flex flex-wrap gap-x-3">
                                    <span dir="ltr">ID: {b.id}</span>
                                    <span>Tier: {b.tier === "five" ? "PS5" : "PS4"}</span>
                                    <span>السعر: ${b.bundlePrice}</span>
                                    {!b.available && (
                                        <span className="text-[hsl(var(--brand-red))] font-bold">معطّلة</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => startEdit(b)}
                                    data-testid={`bundle-${b.id}-edit`}
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[hsl(var(--brand-blue))]/20 text-[hsl(var(--brand-blue-deep))]"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(b)}
                                    data-testid={`bundle-${b.id}-delete`}
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[hsl(var(--brand-red))]/15 text-[hsl(var(--brand-red))]"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
