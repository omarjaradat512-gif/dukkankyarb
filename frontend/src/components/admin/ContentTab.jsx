// Admin: Site Content (CMS) editor.
//
// All static page copy lives in one Mongo document under settings/{id:"content"}.
// This tab exposes a section-by-section, field-by-field editor with accordions.
// Each section can be saved independently (so a typo fix in one section
// doesn't risk overwriting another section being edited).
import { useEffect, useState } from "react";
import { useStoreData } from "../../contexts/DataContext";
import { apiUpdateContent, formatApiError } from "../../lib/api";
import { toast } from "sonner";
import { Input, Field, Textarea } from "./_widgets";
import {
    FileText,
    Save,
    Loader2,
    Plus,
    Trash2,
    ChevronDown,
    Sparkles,
    Megaphone,
    Crown,
    GitCompare,
    Package,
    Wand2,
    Gamepad2,
    Star,
    HelpCircle,
    Mail,
    Layout,
    Check,
    X,
} from "lucide-react";

// Spec of every section + its fields (used to render the form).
// Field types: text | textarea | array-string | array-row (rows are dicts with editable keys)
const SECTIONS = [
    {
        key: "hero",
        title: "البطل (Hero)",
        icon: Megaphone,
        hint: "أول ما يشوفه الزائر — البادج، العنوان، الأزرار.",
        fields: [
            { key: "badge", label: "البادج", type: "text" },
            { key: "titleLine1", label: "العنوان (السطر الأول)", type: "text" },
            { key: "titleLine2", label: "العنوان (السطر الثاني، أحمر)", type: "text" },
            { key: "subtitle", label: "نص فرعي", type: "textarea" },
            { key: "ctaBrowse", label: "زر التصفّح", type: "text" },
            { key: "ctaWhatsApp", label: "زر واتساب", type: "text" },
            { key: "benefitInstant", label: "ميزة: تسليم فوري", type: "text" },
            { key: "benefitOriginal", label: "ميزة: حسابات أصلية", type: "text" },
            { key: "benefitSupport", label: "ميزة: دعم مباشر", type: "text" },
        ],
    },
    {
        key: "essential",
        title: "الاشتراك الأساسي",
        icon: Crown,
        hint: "نصوص قسم \"بلايستيشن بلس أساسي\".",
        fields: [
            { key: "eyebrow", label: "EyeBrow (نص فوق العنوان)", type: "text" },
            { key: "title", label: "العنوان", type: "text" },
            { key: "description", label: "الوصف", type: "textarea" },
            { key: "featureTitle", label: "عنوان البطاقة الجانبية", type: "text" },
            { key: "featureBullets", label: "نقاط الميزات", type: "array-string", placeholder: "ميزة جديدة" },
        ],
    },
    {
        key: "extra",
        title: "الاشتراك الإضافي",
        icon: Crown,
        hint: "نصوص قسم \"بلايستيشن بلس إضافي\".",
        fields: [
            { key: "eyebrow", label: "EyeBrow", type: "text" },
            { key: "title", label: "العنوان", type: "text" },
            { key: "description", label: "الوصف", type: "textarea" },
            { key: "featureTitle", label: "عنوان البطاقة الجانبية", type: "text" },
            { key: "featureBullets", label: "نقاط الميزات", type: "array-string", placeholder: "ميزة جديدة" },
        ],
    },
    {
        key: "comparison",
        title: "جدول المقارنة",
        icon: GitCompare,
        hint: "نصوص جدول مقارنة الباقات + صفوف الميزات.",
        fields: [
            { key: "eyebrow", label: "EyeBrow", type: "text" },
            { key: "title", label: "العنوان", type: "text" },
            { key: "description", label: "الوصف", type: "textarea" },
            { key: "popularBadge", label: "بادج \"الأكثر طلباً\"", type: "text" },
            { key: "essentialColLabel", label: "عنوان عمود الأساسي", type: "text" },
            { key: "extraColLabel", label: "عنوان عمود الإضافي", type: "text" },
            { key: "ctaStart", label: "النص قبل الأزرار", type: "text" },
            { key: "ctaEssential", label: "زر اختيار الأساسي", type: "text" },
            { key: "ctaExtra", label: "زر اختيار الإضافي", type: "text" },
            {
                key: "rows",
                label: "صفوف الميزات (✓/✗ لكل خطة)",
                type: "array-row",
                rowSchema: [
                    { key: "feature", label: "اسم الميزة", type: "text", flex: 1 },
                    { key: "essential", label: "الأساسي", type: "bool", width: "90px" },
                    { key: "extra", label: "الإضافي", type: "bool", width: "90px" },
                ],
            },
        ],
    },
    {
        key: "bundles",
        title: "قسم الباقات الجاهزة",
        icon: Package,
        fields: [
            { key: "eyebrow", label: "EyeBrow", type: "text" },
            { key: "title", label: "العنوان", type: "text" },
            { key: "description", label: "الوصف", type: "textarea" },
        ],
    },
    {
        key: "bundleBuilder",
        title: "ابني باقتك (BundleBuilder)",
        icon: Wand2,
        hint: "كل النصوص داخل أداة بناء الباقة المخصصة.",
        fields: [
            { key: "eyebrow", label: "EyeBrow", type: "text" },
            { key: "title", label: "العنوان", type: "text" },
            { key: "description", label: "الوصف", type: "textarea" },
            { key: "discountsLabel", label: "عنوان قائمة نسب الخصم", type: "text" },
            { key: "step1", label: "خطوة 1: اختر جهازك", type: "text" },
            { key: "step1Hint", label: "هينت الخطوة 1", type: "text" },
            { key: "step2", label: "خطوة 2: أضف اشتراك", type: "text" },
            { key: "step3", label: "خطوة 3: أضف ألعاب", type: "text" },
            { key: "summaryTitle", label: "عنوان ملخص الباقة", type: "text" },
            { key: "summaryEmpty", label: "نص الملخص الفارغ", type: "text" },
            { key: "subtotal", label: "تسمية المجموع الفرعي", type: "text" },
            { key: "discountLabel", label: "تسمية الخصم", type: "text" },
            { key: "totalLabel", label: "تسمية المجموع النهائي", type: "text" },
            { key: "hintNoSub", label: "نص التلميح (بدون اشتراك)", type: "textarea" },
            { key: "addAll", label: "زر إضافة الباقة للسلة", type: "text" },
            { key: "addedAll", label: "نص نجاح الإضافة", type: "text" },
            { key: "reset", label: "زر البدء من جديد", type: "text" },
        ],
    },
    {
        key: "games",
        title: "قسم الألعاب",
        icon: Gamepad2,
        fields: [
            { key: "eyebrow", label: "EyeBrow", type: "text" },
            { key: "title", label: "العنوان", type: "text" },
            { key: "description", label: "الوصف", type: "textarea" },
            { key: "customGameTitle", label: "عنوان \"لعبة مخصصة\"", type: "text" },
            { key: "customGameSubtitle", label: "وصف \"لعبة مخصصة\"", type: "textarea" },
            { key: "customGameCta", label: "زر طلب لعبة مخصصة", type: "text" },
        ],
    },
    {
        key: "reviews",
        title: "قسم التقييمات",
        icon: Star,
        fields: [
            { key: "eyebrow", label: "EyeBrow", type: "text" },
            { key: "title", label: "العنوان", type: "text" },
            { key: "description", label: "الوصف", type: "textarea" },
            { key: "ratingOutOf5", label: "نص \"من 5 نجوم\"", type: "text" },
            { key: "basedOn", label: "نص \"مبني على\"", type: "text" },
        ],
    },
    {
        key: "faq",
        title: "قسم الأسئلة الشائعة",
        icon: HelpCircle,
        fields: [
            { key: "badge", label: "البادج", type: "text" },
            { key: "title", label: "العنوان", type: "text" },
            { key: "description", label: "الوصف", type: "textarea" },
        ],
    },
    {
        key: "emailSignup",
        title: "نشرة البريد الإلكتروني",
        icon: Mail,
        fields: [
            { key: "eyebrow", label: "EyeBrow", type: "text" },
            { key: "title", label: "العنوان", type: "text" },
            { key: "description", label: "الوصف", type: "textarea" },
            { key: "placeholder", label: "نص داخل الحقل", type: "text" },
            { key: "cta", label: "زر التسجيل", type: "text" },
            { key: "success", label: "رسالة النجاح", type: "textarea" },
        ],
    },
    {
        key: "footer",
        title: "الفوتر",
        icon: Layout,
        fields: [
            { key: "tagline", label: "وصف المتجر", type: "textarea" },
            { key: "linksTitle", label: "عنوان \"روابط سريعة\"", type: "text" },
            { key: "contactTitle", label: "عنوان \"تواصل معنا\"", type: "text" },
            { key: "copyright", label: "حقوق النشر", type: "text" },
        ],
    },
];

// ─── Sub-components ──────────────────────────────────────────────────────

function ArrayStringEditor({ value, onChange, placeholder }) {
    const list = Array.isArray(value) ? value : [];
    const update = (idx, val) => {
        const next = [...list];
        next[idx] = val;
        onChange(next);
    };
    const add = () => onChange([...list, ""]);
    const remove = (idx) => onChange(list.filter((_, i) => i !== idx));
    const move = (idx, dir) => {
        const j = idx + dir;
        if (j < 0 || j >= list.length) return;
        const next = [...list];
        [next[idx], next[j]] = [next[j], next[idx]];
        onChange(next);
    };
    return (
        <div className="space-y-2">
            {list.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[hsl(var(--brand-ink))]/40 w-6 text-center">
                        {i + 1}
                    </span>
                    <Input value={v} onChange={(e) => update(i, e.target.value)} />
                    <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-black/5 disabled:opacity-30 text-xs"
                        title="فوق"
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === list.length - 1}
                        className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-black/5 disabled:opacity-30 text-xs"
                        title="تحت"
                    >
                        ↓
                    </button>
                    <button
                        type="button"
                        onClick={() => remove(i)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={add}
                className="inline-flex items-center gap-1.5 rounded-full px-3 h-8 bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))] text-xs font-bold hover:bg-[hsl(var(--brand-blue))]/25"
            >
                <Plus className="w-3.5 h-3.5" />
                إضافة {placeholder || "عنصر"}
            </button>
        </div>
    );
}

function ArrayRowEditor({ value, onChange, schema }) {
    const list = Array.isArray(value) ? value : [];
    const update = (idx, key, val) => {
        const next = [...list];
        next[idx] = { ...next[idx], [key]: val };
        onChange(next);
    };
    const add = () => {
        const empty = {};
        for (const c of schema) {
            empty[c.key] = c.type === "bool" ? false : "";
        }
        onChange([...list, empty]);
    };
    const remove = (idx) => onChange(list.filter((_, i) => i !== idx));
    const move = (idx, dir) => {
        const j = idx + dir;
        if (j < 0 || j >= list.length) return;
        const next = [...list];
        [next[idx], next[j]] = [next[j], next[idx]];
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <div className="hidden sm:flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-ink))]/45">
                {schema.map((c) => (
                    <div
                        key={c.key}
                        style={{ width: c.width, flex: c.flex }}
                    >
                        {c.label}
                    </div>
                ))}
                <div className="w-[90px]" />
            </div>
            {list.map((row, i) => (
                <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl border border-[hsl(var(--brand-ink))]/10 bg-[hsl(var(--brand-cream))]/40 p-2"
                >
                    {schema.map((c) => (
                        <div
                            key={c.key}
                            style={{ width: c.width, flex: c.flex }}
                        >
                            {c.type === "bool" ? (
                                <button
                                    type="button"
                                    onClick={() => update(i, c.key, !row[c.key])}
                                    data-testid={`content-comparison-row-${i}-${c.key}`}
                                    className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                                        row[c.key]
                                            ? "bg-green-500 text-white"
                                            : "bg-[hsl(var(--brand-ink))]/10 text-[hsl(var(--brand-ink))]/40"
                                    }`}
                                    title={row[c.key] ? "متضمنة" : "غير متضمنة"}
                                >
                                    {row[c.key] ? (
                                        <Check className="w-4 h-4" strokeWidth={3} />
                                    ) : (
                                        <X className="w-4 h-4" strokeWidth={2.5} />
                                    )}
                                </button>
                            ) : (
                                <Input
                                    value={row[c.key] || ""}
                                    onChange={(e) => update(i, c.key, e.target.value)}
                                />
                            )}
                        </div>
                    ))}
                    <div className="flex items-center gap-0.5">
                        <button
                            type="button"
                            onClick={() => move(i, -1)}
                            disabled={i === 0}
                            className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-black/5 disabled:opacity-30 text-xs"
                        >
                            ↑
                        </button>
                        <button
                            type="button"
                            onClick={() => move(i, 1)}
                            disabled={i === list.length - 1}
                            className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-black/5 disabled:opacity-30 text-xs"
                        >
                            ↓
                        </button>
                        <button
                            type="button"
                            onClick={() => remove(i)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={add}
                className="inline-flex items-center gap-1.5 rounded-full px-3 h-8 bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))] text-xs font-bold hover:bg-[hsl(var(--brand-blue))]/25"
            >
                <Plus className="w-3.5 h-3.5" />
                إضافة صف
            </button>
        </div>
    );
}

function SectionEditor({ section, value, onSave, onReload }) {
    const [form, setForm] = useState(value || {});
    const [open, setOpen] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [busy, setBusy] = useState(false);
    const Icon = section.icon || FileText;

    // Re-sync when external value changes (e.g. after reload)
    useEffect(() => {
        setForm(value || {});
        setDirty(false);
    }, [value]);

    const setField = (key, val) => {
        setForm((cur) => ({ ...cur, [key]: val }));
        setDirty(true);
    };

    const save = async () => {
        setBusy(true);
        try {
            await onSave(section.key, form);
            toast.success(`تم حفظ "${section.title}"`);
            setDirty(false);
            onReload?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            data-testid={`content-section-${section.key}`}
            className={`rounded-2xl bg-white dark:bg-white/[0.04] border-2 transition-colors ${
                open
                    ? "border-[hsl(var(--brand-blue-deep))]/30 shadow-lg"
                    : "border-[hsl(var(--brand-ink))]/10 dark:border-white/10"
            }`}
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                data-testid={`content-section-${section.key}-toggle`}
                className="w-full flex items-center gap-3 px-5 py-4 text-right"
            >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))] flex-shrink-0">
                    <Icon className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-[hsl(var(--brand-ink))]">
                        {section.title}
                    </h3>
                    {section.hint && (
                        <p className="text-xs text-[hsl(var(--brand-ink))]/55 mt-0.5">
                            {section.hint}
                        </p>
                    )}
                </div>
                {dirty && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 flex-shrink-0">
                        غير محفوظة
                    </span>
                )}
                <ChevronDown
                    className={`w-5 h-5 text-[hsl(var(--brand-ink))]/45 transition-transform flex-shrink-0 ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {open && (
                <div className="border-t border-[hsl(var(--brand-ink))]/8 px-5 py-5 space-y-4">
                    {section.fields.map((f) => (
                        <Field key={f.key} label={f.label}>
                            {f.type === "text" && (
                                <Input
                                    data-testid={`content-${section.key}-${f.key}`}
                                    value={form[f.key] || ""}
                                    onChange={(e) => setField(f.key, e.target.value)}
                                />
                            )}
                            {f.type === "textarea" && (
                                <Textarea
                                    data-testid={`content-${section.key}-${f.key}`}
                                    rows={3}
                                    value={form[f.key] || ""}
                                    onChange={(e) => setField(f.key, e.target.value)}
                                />
                            )}
                            {f.type === "array-string" && (
                                <ArrayStringEditor
                                    value={form[f.key]}
                                    onChange={(val) => setField(f.key, val)}
                                    placeholder={f.placeholder}
                                />
                            )}
                            {f.type === "array-row" && (
                                <ArrayRowEditor
                                    value={form[f.key]}
                                    onChange={(val) => setField(f.key, val)}
                                    schema={f.rowSchema}
                                />
                            )}
                        </Field>
                    ))}

                    <div className="flex justify-end pt-2 border-t border-[hsl(var(--brand-ink))]/8">
                        <button
                            onClick={save}
                            disabled={busy || !dirty}
                            data-testid={`content-${section.key}-save`}
                            className="inline-flex items-center gap-2 rounded-full px-6 h-11 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-bold hover:bg-[hsl(var(--brand-blue-deep))] disabled:opacity-40"
                        >
                            {busy ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            حفظ هذا القسم
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main tab component ──────────────────────────────────────────────────

export default function ContentTab({ onChanged }) {
    const { content, reload } = useStoreData();

    const handleSave = async (sectionKey, sectionValue) => {
        await apiUpdateContent({ [sectionKey]: sectionValue });
        onChanged?.();
    };

    return (
        <div data-testid="content-tab" className="space-y-3">
            <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-blue-deep))] to-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] p-5 sm:p-6 mb-2">
                <div className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 text-[hsl(var(--brand-cream))] flex-shrink-0">
                        <Sparkles className="w-5 h-5" />
                    </span>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold">محتوى الموقع</h2>
                        <p className="text-xs sm:text-sm opacity-85 mt-1 leading-relaxed">
                            عدّل أي نص يظهر للعميل من هون — مرتّب حسب القسم.
                            كل قسم يحفظ بشكل مستقل، تعديلاتك تظهر فوراً في الصفحة الرئيسية بعد الحفظ.
                        </p>
                    </div>
                </div>
            </div>

            {SECTIONS.map((s) => (
                <SectionEditor
                    key={s.key}
                    section={s}
                    value={content?.[s.key]}
                    onSave={handleSave}
                    onReload={reload}
                />
            ))}
        </div>
    );
}
