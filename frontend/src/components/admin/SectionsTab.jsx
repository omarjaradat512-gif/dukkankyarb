import { useState, useEffect } from "react";
import { useStoreData } from "../../contexts/DataContext";
import { apiUpdateSections, formatApiError } from "../../lib/api";
import { toast } from "sonner";
import { GripVertical, Eye, EyeOff, Save, ArrowUp, ArrowDown, Loader2 } from "lucide-react";

export default function SectionsTab({ onChanged }) {
    const { sections } = useStoreData();
    const [items, setItems] = useState(sections);
    const [saving, setSaving] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);
    const [hoverIdx, setHoverIdx] = useState(null);

    useEffect(() => {
        setItems(sections);
    }, [sections]);

    const dirty = JSON.stringify(items) !== JSON.stringify(sections);

    const moveTo = (from, to) => {
        if (from === to || to < 0 || to >= items.length) return;
        const next = [...items];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setItems(next);
    };

    const moveUp = (i) => moveTo(i, i - 1);
    const moveDown = (i) => moveTo(i, i + 1);

    const toggleVisible = (i) => {
        setItems((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, visible: !s.visible } : s)),
        );
    };

    const onDragStart = (e, idx) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(idx));
    };
    const onDragOver = (e, idx) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setHoverIdx(idx);
    };
    const onDragLeave = () => setHoverIdx(null);
    const onDrop = (e, idx) => {
        e.preventDefault();
        if (dragIdx === null) return;
        moveTo(dragIdx, idx);
        setDragIdx(null);
        setHoverIdx(null);
    };
    const onDragEnd = () => {
        setDragIdx(null);
        setHoverIdx(null);
    };

    const onSave = async () => {
        setSaving(true);
        try {
            await apiUpdateSections(
                items.map((s) => ({
                    id: s.id,
                    label: s.label || s.id,
                    visible: !!s.visible,
                })),
            );
            toast.success("تم حفظ ترتيب الأقسام");
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setSaving(false);
        }
    };

    const onReset = () => setItems(sections);

    return (
        <div data-testid="sections-tab" className="space-y-4">
            <div className="rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 px-5 py-4 card-elevated">
                <h2 className="text-lg font-bold text-[hsl(var(--brand-ink))]">
                    ترتيب الأقسام في الصفحة الرئيسية
                </h2>
                <p className="text-sm text-[hsl(var(--brand-ink))]/65 mt-1">
                    اسحب القسم لأعلى أو لأسفل (أو استخدم الأسهم) للتحكم بترتيبه.
                    اضغط أيقونة العين لإخفاء أو إظهار القسم في الموقع.
                </p>
            </div>

            <ol className="space-y-2">
                {items.map((s, i) => (
                    <li
                        key={s.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, i)}
                        onDragOver={(e) => onDragOver(e, i)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, i)}
                        onDragEnd={onDragEnd}
                        data-testid={`section-row-${s.id}`}
                        className={`group rounded-2xl border-2 bg-white px-3 py-3 sm:px-4 flex items-center gap-3 transition-all card-elevated cursor-grab active:cursor-grabbing ${
                            !s.visible ? "opacity-60" : ""
                        } ${
                            hoverIdx === i && dragIdx !== i
                                ? "border-[hsl(var(--brand-blue-deep))] bg-[hsl(var(--brand-blue))]/5"
                                : "border-[hsl(var(--brand-ink))]/10"
                        } ${dragIdx === i ? "opacity-40" : ""}`}
                    >
                        <GripVertical className="w-5 h-5 text-[hsl(var(--brand-ink))]/35 flex-shrink-0" />

                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-[hsl(var(--brand-ink))]/8 text-xs font-extrabold text-[hsl(var(--brand-ink))]/65">
                            {i + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-[hsl(var(--brand-ink))]">
                                {s.label || s.id}
                            </div>
                            <div className="text-[11px] text-[hsl(var(--brand-ink))]/50" dir="ltr">
                                {s.id}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={() => moveUp(i)}
                                disabled={i === 0}
                                aria-label="رفع"
                                title="رفع لأعلى"
                                data-testid={`section-${s.id}-up`}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[hsl(var(--brand-cream))] text-[hsl(var(--brand-ink))]/65 hover:text-[hsl(var(--brand-ink))] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => moveDown(i)}
                                disabled={i === items.length - 1}
                                aria-label="إنزال"
                                title="إنزال لأسفل"
                                data-testid={`section-${s.id}-down`}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[hsl(var(--brand-cream))] text-[hsl(var(--brand-ink))]/65 hover:text-[hsl(var(--brand-ink))] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => toggleVisible(i)}
                                aria-label={s.visible ? "إخفاء" : "إظهار"}
                                title={s.visible ? "إخفاء القسم" : "إظهار القسم"}
                                data-testid={`section-${s.id}-toggle`}
                                className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                                    s.visible
                                        ? "text-[hsl(var(--brand-blue-deep))] hover:bg-[hsl(var(--brand-blue))]/15"
                                        : "text-[hsl(var(--brand-red))] hover:bg-[hsl(var(--brand-red))]/10"
                                }`}
                            >
                                {s.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="sticky bottom-3 sm:bottom-6 flex items-center justify-end gap-2 pt-3">
                <button
                    onClick={onReset}
                    disabled={!dirty || saving}
                    data-testid="sections-reset"
                    className="inline-flex items-center gap-2 rounded-full px-5 h-11 bg-white border-2 border-[hsl(var(--brand-ink))]/15 text-[hsl(var(--brand-ink))] text-sm font-bold hover:bg-[hsl(var(--brand-cream))] disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                    تراجع عن التغييرات
                </button>
                <button
                    onClick={onSave}
                    disabled={!dirty || saving}
                    data-testid="sections-save"
                    className="inline-flex items-center gap-2 rounded-full px-6 h-11 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-bold hover:bg-[hsl(var(--brand-blue-deep))] disabled:opacity-50 shadow-2xl"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ الترتيب
                </button>
            </div>
        </div>
    );
}
