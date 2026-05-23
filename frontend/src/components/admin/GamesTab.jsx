import { useState, useRef } from "react";
import { useStoreData } from "../../contexts/DataContext";
import {
    apiCreateGame,
    apiUpdateGame,
    apiDeleteGame,
    apiUploadImage,
    formatApiError,
} from "../../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Save, X, Loader2, Search, Star, Eye, EyeOff, Upload } from "lucide-react";
import { Input, Field, Toggle, numOrNull } from "./_widgets";

const blank = () => ({
    id: "",
    name: "",
    sub: "",
    image: "",
    gradientFrom: "#222222",
    gradientTo: "#000000",
    four: "",
    five: "",
    available: true,
    bestSeller: false,
});

const toForm = (g) => ({
    ...g,
    four: g.four == null ? "" : String(g.four),
    five: g.five == null ? "" : String(g.five),
});

const toPayload = (f) => ({
    id: f.id.trim(),
    name: f.name.trim(),
    sub: f.sub || "",
    image: f.image || "",
    gradientFrom: f.gradientFrom || "#222222",
    gradientTo: f.gradientTo || "#000000",
    four: numOrNull(f.four),
    five: numOrNull(f.five),
    available: !!f.available,
    bestSeller: !!f.bestSeller,
});

export default function GamesTab({ onChanged }) {
    const { games } = useStoreData();
    const [editing, setEditing] = useState(null); // null | form data
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState("");
    const [busy, setBusy] = useState(false);

    const filtered = games.filter(
        (g) =>
            !search.trim() ||
            g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.id.toLowerCase().includes(search.toLowerCase()),
    );

    const startNew = () => {
        setEditing(blank());
        setCreating(true);
    };

    const startEdit = (g) => {
        setEditing(toForm(g));
        setCreating(false);
    };

    const cancel = () => {
        setEditing(null);
        setCreating(false);
    };

    const onSave = async () => {
        if (!editing) return;
        const payload = toPayload(editing);
        if (!payload.id || !payload.name) {
            toast.error("الاسم والمعرّف مطلوبان");
            return;
        }
        setBusy(true);
        try {
            if (creating) {
                await apiCreateGame(payload);
                toast.success(`تمت إضافة "${payload.name}"`);
            } else {
                await apiUpdateGame(payload.id, payload);
                toast.success(`تم تحديث "${payload.name}"`);
            }
            cancel();
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    const onDelete = async (g) => {
        if (!window.confirm(`حذف "${g.name}"؟ لا يمكن التراجع.`)) return;
        setBusy(true);
        try {
            await apiDeleteGame(g.id);
            toast.success(`تم حذف "${g.name}"`);
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    const onQuickToggleAvailable = async (g) => {
        setBusy(true);
        try {
            await apiUpdateGame(g.id, { ...g, available: !g.available });
            toast.success(g.available ? "تم تعطيل اللعبة" : "تم تفعيل اللعبة");
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div data-testid="games-tab" className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-[hsl(var(--brand-ink))]/10 px-4 py-3 card-elevated">
                <div className="flex-1 relative max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--brand-ink))]/40" />
                    <Input
                        data-testid="games-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث عن لعبة بالاسم أو ID..."
                        className="pr-9"
                    />
                </div>
                <button
                    onClick={startNew}
                    data-testid="add-game-button"
                    className="inline-flex items-center gap-2 rounded-full px-5 h-10 bg-[hsl(var(--brand-blue-deep))] text-white text-sm font-bold hover:bg-[hsl(var(--brand-ink))] transition-colors whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    لعبة جديدة
                </button>
            </div>

            {/* Editor */}
            {editing && (
                <GameEditor
                    creating={creating}
                    busy={busy}
                    form={editing}
                    setForm={setEditing}
                    onSave={onSave}
                    onCancel={cancel}
                />
            )}

            {/* List */}
            <div className="grid gap-3">
                {filtered.length === 0 && (
                    <p className="text-center text-sm text-[hsl(var(--brand-ink))]/50 py-10">
                        لا توجد ألعاب
                    </p>
                )}
                {filtered.map((g) => (
                    <div
                        key={g.id}
                        data-testid={`game-row-${g.id}`}
                        className="rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 p-3 sm:p-4 flex items-center gap-4 card-elevated"
                    >
                        <div
                            className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden relative"
                            style={{
                                background: `linear-gradient(135deg, ${g.gradientFrom} 0%, ${g.gradientTo} 100%)`,
                            }}
                        >
                            {g.image && (
                                <img
                                    src={g.image}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                    dir="ltr"
                                    className="font-bold text-sm sm:text-base text-[hsl(var(--brand-ink))] latin-tight"
                                >
                                    {g.name}
                                </span>
                                {g.bestSeller && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ffd86b] text-[#3a2400] text-[10px] font-extrabold px-2 py-0.5">
                                        <Star className="w-3 h-3" />
                                        الأكثر مبيعاً
                                    </span>
                                )}
                                {!g.available && (
                                    <span className="rounded-full bg-[hsl(var(--brand-red))]/15 text-[hsl(var(--brand-red))] text-[10px] font-extrabold px-2 py-0.5">
                                        معطّلة
                                    </span>
                                )}
                            </div>
                            <div className="text-[11px] text-[hsl(var(--brand-ink))]/55 mt-0.5 flex flex-wrap gap-x-3">
                                <span dir="ltr">ID: {g.id}</span>
                                <span>PS4: {g.four == null ? "—" : `$${g.four}`}</span>
                                <span>PS5: {g.five == null ? "—" : `$${g.five}`}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                                onClick={() => onQuickToggleAvailable(g)}
                                title={g.available ? "تعطيل" : "تفعيل"}
                                data-testid={`game-${g.id}-toggle-available`}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[hsl(var(--brand-cream))] text-[hsl(var(--brand-ink))]/65 hover:text-[hsl(var(--brand-ink))] transition-colors"
                            >
                                {g.available ? (
                                    <Eye className="w-4 h-4" />
                                ) : (
                                    <EyeOff className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                onClick={() => startEdit(g)}
                                data-testid={`game-${g.id}-edit`}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[hsl(var(--brand-blue))]/20 text-[hsl(var(--brand-blue-deep))] transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(g)}
                                data-testid={`game-${g.id}-delete`}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[hsl(var(--brand-red))]/15 text-[hsl(var(--brand-red))] transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GameEditor({ creating, busy, form, setForm, onSave, onCancel }) {
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const previewName = form.name || "اسم اللعبة";
    const previewPriceTxt = form.five ? `$${form.five}` : form.four ? `$${form.four}` : "—";

    return (
        <div
            data-testid="game-editor"
            className="rounded-3xl bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] p-5 sm:p-7 shadow-2xl"
        >
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg sm:text-xl">
                    {creating ? "إضافة لعبة جديدة" : `تعديل: ${form.name || form.id}`}
                </h3>
                <button
                    onClick={onCancel}
                    data-testid="game-editor-cancel"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="grid lg:grid-cols-[1fr_280px] gap-6">
                {/* Left: form (3 sections) */}
                <div className="space-y-6">
                    {/* Section 1: Basic info */}
                    <EditorSection
                        number="1"
                        title="معلومات اللعبة الأساسية"
                        hint="الاسم والوصف اللي يظهرو للعميل في بطاقة اللعبة."
                    >
                        <div className="grid sm:grid-cols-2 gap-3">
                            <Field
                                label="المعرّف (ID) ⚠️ مهم — حروف إنجليزية فقط، بدون مسافات"
                                hint="مثال: eafc26  أو  forza5  (يُستخدم في الرابط، لا يمكن تغييره بعد الإنشاء)"
                            >
                                <Input
                                    data-testid="game-id-input"
                                    value={form.id}
                                    onChange={(e) => set("id", e.target.value.toLowerCase().replace(/\s/g, "-"))}
                                    disabled={!creating}
                                    dir="ltr"
                                    placeholder="eafc26"
                                />
                            </Field>
                            <Field
                                label="اسم اللعبة (كامل)"
                                hint="الاسم الرسمي للعبة كما يعرفه اللاعبون"
                            >
                                <Input
                                    data-testid="game-name-input"
                                    value={form.name}
                                    onChange={(e) => set("name", e.target.value)}
                                    dir="ltr"
                                    placeholder="EA Sports FC 26"
                                />
                            </Field>
                            <div className="sm:col-span-2">
                                <Field
                                    label="وصف قصير (التصنيف/النوع)"
                                    hint="سطر واحد يصف نوع اللعبة (يظهر تحت الاسم في البطاقة)"
                                >
                                    <Input
                                        data-testid="game-sub-input"
                                        value={form.sub}
                                        onChange={(e) => set("sub", e.target.value)}
                                        dir="ltr"
                                        placeholder="مثال: Football • Career & Ultimate Team"
                                    />
                                </Field>
                            </div>
                        </div>
                    </EditorSection>

                    {/* Section 2: Pricing & availability */}
                    <EditorSection
                        number="2"
                        title="الأسعار والتوفّر"
                        hint="حدّد سعر كل جهاز. اترك الحقل فارغاً إذا اللعبة غير متوفرة على ذلك الجهاز."
                    >
                        <div className="grid sm:grid-cols-2 gap-3">
                            <Field
                                label="سعر PS4 بالدولار ($)"
                                hint="مثال: 16  •  اتركه فارغاً = اللعبة غير متوفرة على PS4"
                            >
                                <Input
                                    data-testid="game-four-input"
                                    value={form.four}
                                    onChange={(e) => set("four", e.target.value)}
                                    inputMode="decimal"
                                    dir="ltr"
                                    placeholder="—"
                                />
                            </Field>
                            <Field
                                label="سعر PS5 بالدولار ($)"
                                hint="مثال: 26  •  اتركه فارغاً = اللعبة غير متوفرة على PS5"
                            >
                                <Input
                                    data-testid="game-five-input"
                                    value={form.five}
                                    onChange={(e) => set("five", e.target.value)}
                                    inputMode="decimal"
                                    dir="ltr"
                                    placeholder="—"
                                />
                            </Field>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Toggle
                                checked={form.available}
                                onChange={(v) => set("available", v)}
                                testId="game-available-toggle"
                                label={form.available ? "✓ متوفرة بالمخزون" : "✗ غير متوفرة (مخفية)"}
                            />
                            <Toggle
                                checked={form.bestSeller}
                                onChange={(v) => set("bestSeller", v)}
                                testId="game-bestseller-toggle"
                                label={form.bestSeller ? "⭐ شارة الأكثر مبيعاً" : "بدون شارة"}
                            />
                        </div>
                    </EditorSection>

                    {/* Section 3: Visuals */}
                    <EditorSection
                        number="3"
                        title="الصورة والمظهر"
                        hint="رابط صورة الغلاف. إذا ما توفرت صورة، يظهر تدرّج لوني."
                    >
                        <ImageUploadField
                            value={form.image}
                            onChange={(v) => set("image", v)}
                        />

                        <details className="mt-3">
                            <summary className="text-xs font-bold opacity-75 cursor-pointer hover:opacity-100">
                                ⚙️ ألوان متقدمة (للحالة إذا الصورة ما تحمّلت)
                            </summary>
                            <div className="grid sm:grid-cols-2 gap-3 mt-3">
                                <Field label="لون التدرج (من)" hint="لون hex">
                                    <Input
                                        data-testid="game-gradient-from-input"
                                        value={form.gradientFrom}
                                        onChange={(e) => set("gradientFrom", e.target.value)}
                                        dir="ltr"
                                        placeholder="#1c5e3a"
                                    />
                                </Field>
                                <Field label="لون التدرج (إلى)" hint="لون hex">
                                    <Input
                                        data-testid="game-gradient-to-input"
                                        value={form.gradientTo}
                                        onChange={(e) => set("gradientTo", e.target.value)}
                                        dir="ltr"
                                        placeholder="#0f2e1c"
                                    />
                                </Field>
                            </div>
                        </details>
                    </EditorSection>
                </div>

                {/* Right: live preview */}
                <div className="lg:sticky lg:top-24 self-start">
                    <div className="text-[11px] font-bold uppercase tracking-[0.15em] opacity-65 mb-2">
                        معاينة مباشرة
                    </div>
                    <div className="rounded-2xl overflow-hidden bg-white shadow-2xl">
                        <div
                            className="relative aspect-[3/4]"
                            style={{
                                background: `linear-gradient(135deg, ${form.gradientFrom || "#222"} 0%, ${form.gradientTo || "#000"} 100%)`,
                            }}
                        >
                            {form.image && (
                                <img
                                    src={form.image}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                            )}
                            {!form.available && (
                                <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="rounded-full bg-[hsl(var(--brand-red))] text-white text-xs font-extrabold px-4 py-1.5 rotate-[-6deg] shadow">
                                        غير متوفرة حالياً
                                    </span>
                                </div>
                            )}
                            {form.available && form.bestSeller && (
                                <div
                                    className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-[#3a2400] shadow"
                                    style={{ background: "linear-gradient(135deg,#ffd86b,#f0a500)" }}
                                >
                                    ⭐ الأكثر مبيعاً
                                </div>
                            )}
                        </div>
                        <div className="p-3" dir="rtl">
                            <div
                                dir="ltr"
                                className="font-bold text-sm text-[hsl(var(--brand-ink))] latin-tight leading-snug"
                            >
                                {previewName}
                            </div>
                            <div className="text-[11px] text-[hsl(var(--brand-ink))]/55 mt-0.5" dir="ltr">
                                {form.sub || "—"}
                            </div>
                            <div className="mt-2 pt-2 border-t border-[hsl(var(--brand-ink))]/10 flex items-center justify-between">
                                <div className="text-[10px] text-[hsl(var(--brand-ink))]/55">السعر</div>
                                <div className="text-lg font-extrabold text-[hsl(var(--brand-red))]">
                                    {previewPriceTxt}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                    onClick={onCancel}
                    className="inline-flex items-center gap-2 rounded-full px-5 h-11 bg-white/10 hover:bg-white/20 text-sm font-bold"
                >
                    إلغاء
                </button>
                <button
                    onClick={onSave}
                    disabled={busy}
                    data-testid="game-editor-save"
                    className="inline-flex items-center gap-2 rounded-full px-7 h-11 bg-[#7CFF8A] text-[hsl(var(--brand-ink))] text-sm font-bold hover:bg-[#9affa6] disabled:opacity-50 shadow-xl"
                >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {creating ? "إضافة اللعبة" : "حفظ التغييرات"}
                </button>
            </div>
        </div>
    );
}

function EditorSection({ number, title, hint, children }) {
    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-3">
                <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#7CFF8A] text-[hsl(var(--brand-ink))] text-sm font-extrabold">
                    {number}
                </span>
                <div>
                    <h4 className="font-bold text-base">{title}</h4>
                    {hint && (
                        <p className="text-[11px] text-[hsl(var(--brand-cream))]/65 mt-0.5 leading-relaxed">
                            {hint}
                        </p>
                    )}
                </div>
            </div>
            <div>{children}</div>
        </div>
    );
}

function ImageUploadField({ value, onChange }) {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const onPick = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("حجم الصورة أكبر من 5 ميغابايت");
            return;
        }
        setUploading(true);
        try {
            const res = await apiUploadImage(file);
            // res.url is "/api/uploads/<file>"; turn into absolute so we can preview from anywhere
            const apiBase = process.env.REACT_APP_BACKEND_URL || "";
            const absolute = `${apiBase}${res.url}`;
            onChange(absolute);
            toast.success("تم رفع الصورة بنجاح");
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    return (
        <div>
            <div className="block">
                <span className="block text-[11px] font-bold text-[hsl(var(--brand-cream))]/70 mb-1">
                    صورة الغلاف
                </span>
                <span className="block text-[10px] text-[hsl(var(--brand-cream))]/50 mb-2">
                    ارفع صورة من جهازك (PNG/JPG/WEBP، حد أقصى 5 ميغابايت) — أو الصق رابط
                </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Input
                    data-testid="game-image-input"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    dir="ltr"
                    placeholder="https://... أو ارفع من جهازك"
                />
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={onPick}
                    data-testid="game-image-file"
                />
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    data-testid="game-image-upload-button"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 h-10 bg-[#7CFF8A] text-[hsl(var(--brand-ink))] text-sm font-bold hover:bg-[#9affa6] disabled:opacity-50 whitespace-nowrap"
                >
                    {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                    {uploading ? "جاري الرفع..." : "رفع من الجهاز"}
                </button>
            </div>
        </div>
    );
}
