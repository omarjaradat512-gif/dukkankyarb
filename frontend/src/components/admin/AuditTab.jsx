import { useEffect, useState } from "react";
import { apiListAudit, formatApiError } from "../../lib/api";
import { toast } from "sonner";
import { Loader2, ScrollText, RefreshCw, Search, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Input } from "./_widgets";

const ACTION_META = {
    create: { icon: PlusCircle, color: "text-[#1a7a26]", bg: "bg-[#7CFF8A]/15", label: "إضافة" },
    update: { icon: Pencil, color: "text-[hsl(var(--brand-blue-deep))]", bg: "bg-[hsl(var(--brand-blue))]/15", label: "تعديل" },
    delete: { icon: Trash2, color: "text-[hsl(var(--brand-red))]", bg: "bg-[hsl(var(--brand-red))]/15", label: "حذف" },
};

const TARGET_LABELS = {
    store: "إعدادات المتجر",
    subscription: "اشتراك",
    game: "لعبة",
    bundle: "باقة",
    sections: "ترتيب الأقسام",
    promo: "بانر العرض",
    social_proof: "الإثبات الاجتماعي",
    wa_templates: "قوالب الواتساب",
    subscriber: "مشترك",
    upload: "رفع صورة",
};

const fmtTime = (iso) => {
    try {
        const d = new Date(iso);
        return d.toLocaleString("ar-EG", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
};

export default function AuditTab() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const reload = async () => {
        setLoading(true);
        try {
            const data = await apiListAudit(200);
            setItems(data);
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reload();
    }, []);

    const filtered = items.filter((it) => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return (
            (it.target_label || "").toLowerCase().includes(s) ||
            (it.target_id || "").toLowerCase().includes(s) ||
            (it.target_type || "").toLowerCase().includes(s) ||
            (it.actor_email || "").toLowerCase().includes(s) ||
            (it.action || "").toLowerCase().includes(s)
        );
    });

    return (
        <div data-testid="audit-tab" className="space-y-4">
            <div className="rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 px-5 py-4 card-elevated">
                <div className="flex items-start gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))]">
                        <ScrollText className="w-5 h-5" />
                    </span>
                    <div>
                        <h3 className="font-bold text-base sm:text-lg text-[hsl(var(--brand-ink))]">
                            سجل التدقيق
                        </h3>
                        <p className="text-xs text-[hsl(var(--brand-ink))]/55 mt-0.5 leading-relaxed">
                            آخر 200 إجراء تم في لوحة الإدارة (إضافة، تعديل، حذف). مفيد عند وجود أكثر من مسؤول.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--brand-ink))]/40" />
                        <Input
                            data-testid="audit-search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ابحث بالنوع، الإيميل، الإجراء..."
                            className="pr-9"
                        />
                    </div>
                    <button
                        onClick={reload}
                        disabled={loading}
                        data-testid="audit-refresh"
                        className="inline-flex items-center gap-2 rounded-lg px-4 h-10 bg-[hsl(var(--brand-blue-deep))] text-white text-sm font-bold hover:bg-[hsl(var(--brand-ink))] disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        تحديث
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-7 h-7 animate-spin text-[hsl(var(--brand-blue-deep))]" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 py-14 text-center">
                    <p className="text-sm text-[hsl(var(--brand-ink))]/50">
                        لا توجد سجلات.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((it) => {
                        const meta = ACTION_META[it.action] || ACTION_META.update;
                        const Icon = meta.icon;
                        return (
                            <div
                                key={it.id}
                                data-testid={`audit-row-${it.id}`}
                                className="rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 px-4 py-3 flex items-center gap-3 card-elevated"
                            >
                                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${meta.bg} ${meta.color} flex-shrink-0`}>
                                    <Icon className="w-4 h-4" />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                                        <span className={`text-xs font-extrabold ${meta.color}`}>
                                            {meta.label}
                                        </span>
                                        <span className="font-bold text-[hsl(var(--brand-ink))]">
                                            {TARGET_LABELS[it.target_type] || it.target_type}
                                        </span>
                                        {it.target_label && (
                                            <span className="text-[hsl(var(--brand-ink))]/65 truncate" dir="auto">
                                                «{it.target_label}»
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-[hsl(var(--brand-ink))]/55 mt-0.5 flex flex-wrap gap-x-3" dir="ltr">
                                        <span>{it.actor_email}</span>
                                        <span>{fmtTime(it.timestamp)}</span>
                                        {it.target_id && <span>ID: {it.target_id}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
