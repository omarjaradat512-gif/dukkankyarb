import { useEffect, useState } from "react";
import { apiGetAnalytics, formatApiError } from "../../lib/api";
import { toast } from "sonner";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    BarChart3,
    Loader2,
    RefreshCw,
    Users,
    ShoppingCart,
    Bell,
    Activity,
    Gamepad2,
    TrendingUp,
} from "lucide-react";

const RANGES = [
    { value: 7, label: "آخر 7 أيام" },
    { value: 14, label: "آخر 14 يوم" },
    { value: 30, label: "آخر 30 يوم" },
    { value: 90, label: "آخر 90 يوم" },
];

const PIE_COLORS = ["#2c4a6e", "#c63a2c", "#5b86b8", "#f0a500", "#1a6e22", "#7d3c98", "#34495e"];

function StatCard({ icon: Icon, label, value, accent = "blue" }) {
    const palette = {
        blue: "from-[hsl(var(--brand-blue))]/15 to-[hsl(var(--brand-blue-deep))]/10 text-[hsl(var(--brand-blue-deep))]",
        red: "from-[hsl(var(--brand-red))]/15 to-[hsl(var(--brand-red-soft))]/10 text-[hsl(var(--brand-red))]",
        green: "from-green-500/15 to-green-600/10 text-green-700 dark:text-green-400",
        amber: "from-amber-500/15 to-amber-600/10 text-amber-700 dark:text-amber-400",
        purple: "from-purple-500/15 to-purple-600/10 text-purple-700 dark:text-purple-400",
    };
    return (
        <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 p-4 sm:p-5 card-elevated">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${palette[accent]} mb-3`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--brand-ink))]" data-testid={`stat-${label}`}>
                {value.toLocaleString("en-US")}
            </div>
            <div className="text-xs text-[hsl(var(--brand-ink))]/60 mt-1">{label}</div>
        </div>
    );
}

function ChartCard({ icon: Icon, title, hint, children, testId }) {
    return (
        <div data-testid={testId} className="rounded-2xl bg-white dark:bg-white/[0.04] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 p-4 sm:p-6 card-elevated">
            <div className="flex items-start gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))] flex-shrink-0">
                    <Icon className="w-4 h-4" />
                </span>
                <div>
                    <h3 className="font-bold text-base text-[hsl(var(--brand-ink))]">{title}</h3>
                    {hint && <p className="text-xs text-[hsl(var(--brand-ink))]/55 mt-0.5">{hint}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

export default function AnalyticsTab() {
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const reload = async (d = days) => {
        setLoading(true);
        try {
            const r = await apiGetAnalytics(d);
            setData(r);
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reload(days);
    }, [days]);

    if (loading || !data) {
        return (
            <div className="flex justify-center py-16" data-testid="analytics-loading">
                <Loader2 className="w-7 h-7 animate-spin text-[hsl(var(--brand-blue-deep))]" />
            </div>
        );
    }

    // Trim labels to short MM-DD for the X axis
    const timeline = (data.timeline || []).map((d) => ({
        ...d,
        short: d.date.slice(5),
    }));

    return (
        <div data-testid="analytics-tab" className="space-y-5">
            {/* Range selector */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[hsl(var(--brand-blue-deep))]" />
                    <h2 className="font-bold text-lg text-[hsl(var(--brand-ink))]">إحصائيات المتجر</h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white dark:bg-white/[0.04] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 rounded-full p-1">
                        {RANGES.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => setDays(r.value)}
                                data-testid={`range-${r.value}`}
                                className={`px-3 sm:px-4 h-8 rounded-full text-[11px] sm:text-xs font-bold transition-colors ${
                                    days === r.value
                                        ? "bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))]"
                                        : "text-[hsl(var(--brand-ink))]/65 hover:text-[hsl(var(--brand-ink))]"
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => reload()}
                        data-testid="analytics-reload"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--brand-blue-deep))] text-white hover:bg-[hsl(var(--brand-ink))]"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <StatCard icon={Users} label="مشتركين النشرة" value={data.totals.subscribers} accent="blue" />
                <StatCard icon={ShoppingCart} label="إضافات للسلة" value={data.totals.cartEvents} accent="green" />
                <StatCard icon={Bell} label="طلبات إشعار" value={data.totals.notifyRequests} accent="red" />
                <StatCard icon={Activity} label="عمليات الأدمن" value={data.totals.auditLog} accent="purple" />
                <StatCard icon={Gamepad2} label="عدد الألعاب" value={data.totals.games} accent="amber" />
            </div>

            {/* Timeline chart */}
            <ChartCard
                icon={TrendingUp}
                title="المشتركين وإضافات السلة (يومياً)"
                hint={`آخر ${days} يوم`}
                testId="chart-timeline"
            >
                <div className="h-72 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timeline} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--brand-ink) / 0.08)" />
                            <XAxis
                                dataKey="short"
                                tick={{ fontSize: 10, fill: "hsl(var(--brand-ink) / 0.6)" }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: "hsl(var(--brand-ink) / 0.6)" }}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "hsl(var(--brand-cream))",
                                    border: "1px solid hsl(var(--brand-ink) / 0.15)",
                                    borderRadius: 8,
                                    fontFamily: "'Tajawal', sans-serif",
                                    direction: "rtl",
                                }}
                            />
                            <Legend wrapperStyle={{ fontFamily: "'Tajawal', sans-serif", fontSize: 11 }} />
                            <Line
                                type="monotone"
                                dataKey="subscribers"
                                name="مشتركين"
                                stroke="#2c4a6e"
                                strokeWidth={2.5}
                                dot={{ r: 3 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="cartAdds"
                                name="إضافات السلة"
                                stroke="#c63a2c"
                                strokeWidth={2.5}
                                dot={{ r: 3 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
                {/* Top items */}
                <ChartCard
                    icon={ShoppingCart}
                    title="الأكثر إضافة للسلة"
                    hint="Top 10 عناصر مضافة لسلة العملاء"
                    testId="chart-top-items"
                >
                    {data.topItems.length === 0 ? (
                        <p className="text-center text-sm text-[hsl(var(--brand-ink))]/45 py-10">
                            لا يوجد بيانات بعد. لما العملاء يبدأوا يضيفون منتجات للسلة، راح تظهر هنا.
                        </p>
                    ) : (
                        <div className="h-72 -mx-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data.topItems.map((it) => ({
                                        name: (it.itemName || it.itemId).slice(0, 18),
                                        count: it.count,
                                    }))}
                                    margin={{ top: 6, right: 16, left: -16, bottom: 40 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--brand-ink) / 0.08)" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fill: "hsl(var(--brand-ink) / 0.7)" }}
                                        angle={-30}
                                        textAnchor="end"
                                        interval={0}
                                        height={50}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: "hsl(var(--brand-ink) / 0.6)" }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "hsl(var(--brand-cream))",
                                            border: "1px solid hsl(var(--brand-ink) / 0.15)",
                                            borderRadius: 8,
                                            fontFamily: "'Tajawal', sans-serif",
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#c63a2c" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                {/* Audit actions breakdown */}
                <ChartCard
                    icon={Activity}
                    title="توزيع عمليات الأدمن"
                    hint="من سجل التدقيق"
                    testId="chart-audit-actions"
                >
                    {data.auditActions.length === 0 ? (
                        <p className="text-center text-sm text-[hsl(var(--brand-ink))]/45 py-10">
                            لا توجد عمليات بعد.
                        </p>
                    ) : (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.auditActions.map((a) => ({
                                            name: a.action === "create" ? "إنشاء" : a.action === "update" ? "تعديل" : a.action === "delete" ? "حذف" : a.action,
                                            value: a.count,
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={(e) => `${e.name} (${e.value})`}
                                        labelLine={false}
                                        fontSize={11}
                                        style={{ fontFamily: "'Tajawal', sans-serif" }}
                                    >
                                        {data.auditActions.map((_, idx) => (
                                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: "hsl(var(--brand-cream))",
                                            border: "1px solid hsl(var(--brand-ink) / 0.15)",
                                            borderRadius: 8,
                                            fontFamily: "'Tajawal', sans-serif",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>
            </div>
        </div>
    );
}
