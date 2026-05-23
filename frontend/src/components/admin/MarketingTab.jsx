import { useEffect, useState } from "react";
import { useStoreData } from "../../contexts/DataContext";
import {
    apiUpdatePromo,
    apiUpdateSocialProof,
    apiUpdateWATemplates,
    apiListSubscribers,
    apiDeleteSubscriber,
    formatApiError,
} from "../../lib/api";
import { toast } from "sonner";
import { Input, Field, Textarea, Toggle } from "./_widgets";
import {
    Clock,
    MessageSquare,
    Users,
    Save,
    Loader2,
    Plus,
    Trash2,
    Copy,
    Check,
    Megaphone,
} from "lucide-react";

const Section = ({ icon: Icon, title, hint, children }) => (
    <div className="rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 p-5 sm:p-6 card-elevated">
        <div className="flex items-start gap-3 mb-4">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))] flex-shrink-0">
                <Icon className="w-5 h-5" />
            </span>
            <div>
                <h3 className="font-bold text-base sm:text-lg text-[hsl(var(--brand-ink))]">
                    {title}
                </h3>
                {hint && (
                    <p className="text-xs text-[hsl(var(--brand-ink))]/55 mt-0.5 leading-relaxed">
                        {hint}
                    </p>
                )}
            </div>
        </div>
        <div>{children}</div>
    </div>
);

// ----------------------------------------------------------------- Promo
function PromoSection({ onChanged }) {
    const { promo } = useStoreData();
    const [form, setForm] = useState(promo);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setForm(promo);
    }, [promo]);

    const localDateTime = (() => {
        if (!form?.endsAt) return "";
        try {
            const d = new Date(form.endsAt);
            if (Number.isNaN(d.getTime())) return "";
            // datetime-local expects YYYY-MM-DDTHH:mm
            const pad = (n) => String(n).padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } catch {
            return "";
        }
    })();

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const onSave = async () => {
        setBusy(true);
        try {
            const endsAtISO =
                form.endsAt && !isNaN(new Date(form.endsAt).getTime())
                    ? new Date(form.endsAt).toISOString()
                    : null;
            await apiUpdatePromo({ ...form, endsAt: endsAtISO });
            toast.success("تم حفظ بانر العرض");
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Section
            icon={Clock}
            title="بانر العرض المحدود (عدّاد تنازلي)"
            hint="يظهر في أعلى الصفحة الرئيسية مع عدّاد تنازلي يضغط العميل ليقرر بسرعة."
        >
            <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                    <Toggle
                        checked={!!form?.enabled}
                        onChange={(v) => set("enabled", v)}
                        testId="promo-enabled-toggle"
                        label={form?.enabled ? "✓ مفعّل ويظهر في الموقع" : "✗ مخفي"}
                    />
                </div>
                <Field label="العنوان الرئيسي" hint="مثال: 🔥 عرض اليوم: خصم 15% على EA FC 26">
                    <Input
                        data-testid="promo-title-input"
                        value={form?.title || ""}
                        onChange={(e) => set("title", e.target.value)}
                    />
                </Field>
                <Field label="نص فرعي (اختياري)" hint="مثال: لمدة محدودة فقط">
                    <Input
                        data-testid="promo-subtitle-input"
                        value={form?.subtitle || ""}
                        onChange={(e) => set("subtitle", e.target.value)}
                    />
                </Field>
                <Field
                    label="تاريخ ووقت انتهاء العرض"
                    hint="بتوقيتك المحلي. لما الوقت ينتهي، البانر يختفي تلقائياً."
                >
                    <Input
                        data-testid="promo-endsAt-input"
                        type="datetime-local"
                        value={localDateTime}
                        onChange={(e) => set("endsAt", e.target.value)}
                        dir="ltr"
                    />
                </Field>
                <Field label="نص الزر (اختياري)" hint="مثال: تصفّح العرض">
                    <Input
                        data-testid="promo-cta-label-input"
                        value={form?.ctaLabel || ""}
                        onChange={(e) => set("ctaLabel", e.target.value)}
                    />
                </Field>
                <Field
                    label="رابط الزر (اختياري)"
                    hint="رابط داخلي مثل #games أو خارجي https://..."
                >
                    <Input
                        data-testid="promo-cta-href-input"
                        value={form?.ctaHref || ""}
                        onChange={(e) => set("ctaHref", e.target.value)}
                        dir="ltr"
                        placeholder="#games"
                    />
                </Field>
            </div>
            <div className="mt-5 flex justify-end">
                <button
                    onClick={onSave}
                    disabled={busy}
                    data-testid="promo-save-button"
                    className="inline-flex items-center gap-2 rounded-full px-6 h-10 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-bold hover:bg-[hsl(var(--brand-blue-deep))] disabled:opacity-50"
                >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ
                </button>
            </div>
        </Section>
    );
}

// ----------------------------------------------------------------- Social proof
function SocialProofSection({ onChanged }) {
    const { socialProof } = useStoreData();
    const [enabled, setEnabled] = useState(socialProof?.enabled ?? true);
    const [interval, setInterval] = useState(socialProof?.intervalSeconds ?? 12);
    const [messages, setMessages] = useState(socialProof?.messages || []);
    const [busy, setBusy] = useState(false);
    const [draft, setDraft] = useState("");

    useEffect(() => {
        setEnabled(socialProof?.enabled ?? true);
        setInterval(socialProof?.intervalSeconds ?? 12);
        setMessages(socialProof?.messages || []);
    }, [socialProof]);

    const addMsg = () => {
        const v = draft.trim();
        if (!v) return;
        setMessages((m) => [...m, v]);
        setDraft("");
    };
    const removeMsg = (i) => setMessages((m) => m.filter((_, idx) => idx !== i));

    const onSave = async () => {
        setBusy(true);
        try {
            await apiUpdateSocialProof({
                enabled,
                intervalSeconds: Number(interval) || 12,
                messages,
            });
            toast.success("تم حفظ الإثبات الاجتماعي");
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Section
            icon={Megaphone}
            title="الإثبات الاجتماعي (شريط الشراء المباشر)"
            hint="رسائل تظهر في زاوية الموقع كل بضع ثوان لزيادة الثقة (مثل: 'محمد من عمّان اشترى للتو...')."
        >
            <div className="grid sm:grid-cols-[1fr_180px] gap-3 mb-4">
                <Toggle
                    checked={enabled}
                    onChange={setEnabled}
                    testId="sp-enabled-toggle"
                    label={enabled ? "✓ مفعّل" : "✗ معطّل"}
                />
                <Field label="فاصل التبديل (ثانية)" hint="افتراضي: 12">
                    <Input
                        data-testid="sp-interval-input"
                        type="number"
                        min="6"
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                        dir="ltr"
                    />
                </Field>
            </div>

            <div className="space-y-2 mb-4">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        data-testid={`sp-message-${i}`}
                        className="rounded-xl border-2 border-[hsl(var(--brand-ink))]/10 bg-[hsl(var(--brand-cream))]/40 px-3 py-2 flex items-center gap-2"
                    >
                        <span className="text-[11px] font-bold text-[hsl(var(--brand-ink))]/45 w-6 text-center">
                            {i + 1}
                        </span>
                        <span className="flex-1 text-sm text-[hsl(var(--brand-ink))]">{m}</span>
                        <button
                            onClick={() => removeMsg(i)}
                            data-testid={`sp-message-${i}-delete`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[hsl(var(--brand-red))] hover:bg-[hsl(var(--brand-red))]/10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {messages.length === 0 && (
                    <p className="text-center text-xs text-[hsl(var(--brand-ink))]/45 py-3">
                        لا توجد رسائل بعد.
                    </p>
                )}
            </div>

            <div className="flex gap-2">
                <Input
                    data-testid="sp-add-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            addMsg();
                        }
                    }}
                    placeholder='مثال: "أحمد من جدّة اشترى للتو PS Plus Extra"'
                />
                <button
                    onClick={addMsg}
                    data-testid="sp-add-button"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 h-10 bg-[hsl(var(--brand-blue-deep))] text-white text-sm font-bold hover:bg-[hsl(var(--brand-ink))] whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    أضف
                </button>
            </div>

            <div className="mt-5 flex justify-end">
                <button
                    onClick={onSave}
                    disabled={busy}
                    data-testid="sp-save-button"
                    className="inline-flex items-center gap-2 rounded-full px-6 h-10 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-bold hover:bg-[hsl(var(--brand-blue-deep))] disabled:opacity-50"
                >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ
                </button>
            </div>
        </Section>
    );
}

// ----------------------------------------------------------------- WhatsApp templates
function WATemplatesSection({ onChanged }) {
    const { waTemplates } = useStoreData();
    const [form, setForm] = useState(waTemplates);
    const [busy, setBusy] = useState(false);

    useEffect(() => setForm(waTemplates), [waTemplates]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const onSave = async () => {
        setBusy(true);
        try {
            await apiUpdateWATemplates(form);
            toast.success("تم حفظ قوالب الواتساب");
            onChanged?.();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Section
            icon={MessageSquare}
            title="قوالب رسائل الواتساب"
            hint="الرسائل اللي تظهر للعميل لما يضغط زر واتساب. تقدر تستخدم {storeName} و {productName} كمتغيرات."
        >
            <div className="space-y-4">
                <Field
                    label="استفسار عام"
                    hint="يظهر عند الضغط على الزر العائم أو الـ Hero (متغيّر: {storeName})"
                >
                    <Textarea
                        data-testid="wa-general-textarea"
                        rows={3}
                        value={form?.general || ""}
                        onChange={(e) => set("general", e.target.value)}
                    />
                </Field>
                <Field
                    label="استفسار عن منتج محدد"
                    hint="يظهر عند الضغط على زر تواصل في تفاصيل لعبة (متغيّرات: {storeName}, {productName})"
                >
                    <Textarea
                        data-testid="wa-product-textarea"
                        rows={3}
                        value={form?.productInquiry || ""}
                        onChange={(e) => set("productInquiry", e.target.value)}
                    />
                </Field>
                <Field
                    label="بداية رسالة الطلب من السلة"
                    hint="يظهر في أول رسالة الـ Checkout (متغيّر: {storeName})"
                >
                    <Textarea
                        data-testid="wa-order-header-textarea"
                        rows={2}
                        value={form?.orderHeader || ""}
                        onChange={(e) => set("orderHeader", e.target.value)}
                    />
                </Field>
                <Field label="نهاية رسالة الطلب">
                    <Textarea
                        data-testid="wa-order-footer-textarea"
                        rows={2}
                        value={form?.orderFooter || ""}
                        onChange={(e) => set("orderFooter", e.target.value)}
                    />
                </Field>
            </div>
            <div className="mt-5 flex justify-end">
                <button
                    onClick={onSave}
                    disabled={busy}
                    data-testid="wa-save-button"
                    className="inline-flex items-center gap-2 rounded-full px-6 h-10 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-bold hover:bg-[hsl(var(--brand-blue-deep))] disabled:opacity-50"
                >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ القوالب
                </button>
            </div>
        </Section>
    );
}

// ----------------------------------------------------------------- Subscribers
function SubscribersSection() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(null);

    const reload = async () => {
        setLoading(true);
        try {
            const data = await apiListSubscribers();
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

    const onDelete = async (email) => {
        if (!window.confirm(`حذف المشترك ${email}؟`)) return;
        try {
            await apiDeleteSubscriber(email);
            toast.success("تم الحذف");
            reload();
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    const copyEmails = async () => {
        const text = items.map((s) => s.email).join("\n");
        try {
            await navigator.clipboard.writeText(text);
            setCopied("all");
            setTimeout(() => setCopied(null), 1500);
        } catch {}
    };

    return (
        <Section
            icon={Users}
            title={`مشتركين النشرة (${items.length})`}
            hint="قائمة الإيميلات اللي سجّلوا للحصول على كود الخصم 10%."
        >
            <div className="flex justify-end mb-3">
                <button
                    onClick={copyEmails}
                    disabled={items.length === 0}
                    data-testid="subscribers-copy-all"
                    className="inline-flex items-center gap-2 rounded-full px-4 h-9 bg-white border-2 border-[hsl(var(--brand-ink))]/15 text-xs font-bold hover:bg-[hsl(var(--brand-cream))] disabled:opacity-40"
                >
                    {copied === "all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    نسخ كل الإيميلات
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--brand-blue-deep))]" />
                </div>
            ) : items.length === 0 ? (
                <p className="text-center text-sm text-[hsl(var(--brand-ink))]/50 py-10">
                    لا يوجد مشتركين بعد.
                </p>
            ) : (
                <div className="overflow-x-auto -mx-5 sm:-mx-6">
                    <table className="min-w-full text-sm">
                        <thead className="bg-[hsl(var(--brand-cream))]/60 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-ink))]/55">
                            <tr>
                                <th className="px-3 py-2 text-right">#</th>
                                <th className="px-3 py-2 text-right">الإيميل</th>
                                <th className="px-3 py-2 text-right">الكود</th>
                                <th className="px-3 py-2 text-right">التاريخ</th>
                                <th className="px-3 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[hsl(var(--brand-ink))]/8">
                            {items.map((s, i) => (
                                <tr
                                    key={s.email}
                                    data-testid={`subscriber-row-${s.email}`}
                                    className="hover:bg-[hsl(var(--brand-cream))]/40"
                                >
                                    <td className="px-3 py-2 text-[hsl(var(--brand-ink))]/50 text-xs">
                                        {i + 1}
                                    </td>
                                    <td className="px-3 py-2 font-medium" dir="ltr">
                                        {s.email}
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs text-[hsl(var(--brand-blue-deep))]" dir="ltr">
                                        {s.code}
                                    </td>
                                    <td className="px-3 py-2 text-[hsl(var(--brand-ink))]/55 text-xs" dir="ltr">
                                        {s.created_at ? new Date(s.created_at).toLocaleDateString("ar-EG") : "—"}
                                    </td>
                                    <td className="px-3 py-2 text-left">
                                        <button
                                            onClick={() => onDelete(s.email)}
                                            data-testid={`subscriber-${s.email}-delete`}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Section>
    );
}

// ----------------------------------------------------------------- Export
export default function MarketingTab({ onChanged }) {
    return (
        <div data-testid="marketing-tab" className="space-y-5">
            <PromoSection onChanged={onChanged} />
            <SocialProofSection onChanged={onChanged} />
            <WATemplatesSection onChanged={onChanged} />
            <SubscribersSection />
        </div>
    );
}
