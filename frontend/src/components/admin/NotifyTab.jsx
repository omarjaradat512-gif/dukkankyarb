import { useEffect, useState } from "react";
import { apiListNotifyRequests, apiDeleteNotifyRequest, formatApiError } from "../../lib/api";
import { useStoreData } from "../../contexts/DataContext";
import { toast } from "sonner";
import { Bell, Trash2, Loader2, RefreshCw, Copy, Check, ExternalLink } from "lucide-react";

export default function NotifyTab() {
    const { games } = useStoreData();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(null);

    const reload = async () => {
        setLoading(true);
        try {
            const data = await apiListNotifyRequests();
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

    const onDelete = async (id) => {
        if (!window.confirm("حذف هذا الطلب؟")) return;
        try {
            await apiDeleteNotifyRequest(id);
            toast.success("تم الحذف");
            reload();
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    const copyAll = async () => {
        const text = items.map((i) => i.contact).join("\n");
        try {
            await navigator.clipboard.writeText(text);
            setCopied("all");
            setTimeout(() => setCopied(null), 1500);
        } catch {}
    };

    const gameById = (id) => games.find((g) => g.id === id);

    // Group by game
    const grouped = items.reduce((acc, it) => {
        if (!acc[it.gameId]) acc[it.gameId] = [];
        acc[it.gameId].push(it);
        return acc;
    }, {});

    return (
        <div data-testid="notify-tab" className="space-y-5">
            <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 p-5 sm:p-6 card-elevated">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[hsl(var(--brand-red))]/15 text-[hsl(var(--brand-red))] flex-shrink-0">
                            <Bell className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-[hsl(var(--brand-ink))]">
                                طلبات إشعار توفّر ({items.length})
                            </h3>
                            <p className="text-xs text-[hsl(var(--brand-ink))]/55 mt-0.5">
                                العملاء اللي سجّلوا اهتمامهم بألعاب غير متوفرة. تواصل معهم لما اللعبة ترجع للمتجر.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={copyAll}
                            disabled={items.length === 0}
                            data-testid="notify-copy-all"
                            className="inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 h-9 bg-white border-2 border-[hsl(var(--brand-ink))]/15 text-xs font-bold hover:bg-[hsl(var(--brand-cream))] disabled:opacity-40"
                        >
                            {copied === "all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            نسخ كل الأرقام
                        </button>
                        <button
                            onClick={reload}
                            data-testid="notify-reload"
                            className="inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 h-9 bg-[hsl(var(--brand-blue-deep))] text-white text-xs font-bold hover:bg-[hsl(var(--brand-ink))]"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            تحديث
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--brand-blue-deep))]" />
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-center text-sm text-[hsl(var(--brand-ink))]/50 py-10">
                        لا يوجد طلبات بعد.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(grouped).map(([gid, list]) => {
                            const g = gameById(gid);
                            return (
                                <div
                                    key={gid}
                                    data-testid={`notify-group-${gid}`}
                                    className="rounded-xl border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 overflow-hidden"
                                >
                                    <div className="bg-[hsl(var(--brand-cream))]/40 dark:bg-white/[0.04] px-4 py-3 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--brand-red))]/15 text-[hsl(var(--brand-red))] text-xs font-bold flex-shrink-0">
                                                {list.length}
                                            </span>
                                            <span className="font-bold text-sm text-[hsl(var(--brand-ink))] truncate" dir="ltr">
                                                {g?.name || gid}
                                            </span>
                                            {g && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                    g.available === false
                                                        ? "bg-[hsl(var(--brand-red))]/15 text-[hsl(var(--brand-red))]"
                                                        : "bg-green-500/15 text-green-700 dark:text-green-400"
                                                }`}>
                                                    {g.available === false ? "غير متوفرة" : "✓ متوفرة الآن"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-[hsl(var(--brand-cream))]/30 dark:bg-white/[0.02] text-[10px] uppercase tracking-wider text-[hsl(var(--brand-ink))]/55">
                                            <tr>
                                                <th className="px-3 py-2 text-right">الاسم</th>
                                                <th className="px-3 py-2 text-right">جهة الاتصال</th>
                                                <th className="px-3 py-2 text-right">التاريخ</th>
                                                <th className="px-3 py-2 w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[hsl(var(--brand-ink))]/8 dark:divide-white/5">
                                            {list.map((it) => {
                                                const isPhone = /^\d{8,}$/.test((it.contact || "").replace(/\D/g, "")) && !it.contact.includes("@");
                                                const waLink = isPhone ? `https://wa.me/${it.contact.replace(/\D/g, "")}` : null;
                                                return (
                                                    <tr key={it.id} data-testid={`notify-row-${it.id}`} className="hover:bg-[hsl(var(--brand-cream))]/30">
                                                        <td className="px-3 py-2 font-medium">{it.name || "—"}</td>
                                                        <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                                                            {waLink ? (
                                                                <a
                                                                    href={waLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-[#25D366] hover:underline"
                                                                >
                                                                    {it.contact}
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            ) : (
                                                                <span>{it.contact}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-xs text-[hsl(var(--brand-ink))]/55" dir="ltr">
                                                            {it.created_at ? new Date(it.created_at).toLocaleDateString("ar-EG") : "—"}
                                                        </td>
                                                        <td className="px-3 py-2 text-left">
                                                            <button
                                                                onClick={() => onDelete(it.id)}
                                                                data-testid={`notify-${it.id}-delete`}
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
