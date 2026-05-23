import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../components/ui/accordion";
import { HelpCircle, Truck, CreditCard, ShieldCheck } from "lucide-react";

const FAQS = [
    {
        id: "delivery",
        icon: Truck,
        q: "كيف يتم تسليم الطلب؟",
        a: "يتم تسليم طلبك بشكل فوري وسلس عبر مسح رمز الاستجابة السريعة (QR Code)، لتتمكن من تفعيل ألعابك واشتراكاتك مباشرة وبدون أي تعقيدات.",
    },
    {
        id: "payment",
        icon: CreditCard,
        q: "ما هي طرق الدفع المتاحة؟",
        a: "نوفر لك طرق دفع آمنة ومريحة تشمل البطاقات الائتمانية (فيزا وماستركارد)، بالإضافة إلى خدمة (Apple Pay) لتجربة شراء سريعة وموثوقة.",
    },
    {
        id: "warranty",
        icon: ShieldCheck,
        q: "هل الألعاب أصلية ومضمونة؟",
        a: "بكل تأكيد! جميع الألعاب والاشتراكات لدينا أصلية 100%، ومرفقة بـ \"الضمان الذهبي\" الذي يضمن لك حقك وتجربة لعب مستقرة وآمنة تماماً.",
    },
];

export const FAQ = () => {
    return (
        <section
            id="faq"
            data-testid="faq-section"
            className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20"
        >
            <div className="grid md:grid-cols-[1fr_2fr] gap-10 lg:gap-16 items-start">
                <div className="md:sticky md:top-28">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand-blue))]/15 border border-[hsl(var(--brand-blue))]/30 px-3 py-1.5 text-xs font-semibold text-[hsl(var(--brand-blue-deep))] mb-4">
                        <HelpCircle className="w-3.5 h-3.5" />
                        الأسئلة الشائعة
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--brand-ink))] leading-tight">
                        أي استفسار عندك؟
                    </h2>
                    <p className="mt-3 text-base sm:text-lg text-[hsl(var(--brand-ink))]/70 leading-relaxed">
                        إذا لقيت إجابة هنا، رائع! وإذا لا، فريقنا متواجد ٢٤/٧
                        على واتساب لمساعدتك.
                    </p>
                </div>

                <Accordion
                    type="single"
                    collapsible
                    defaultValue="delivery"
                    className="space-y-3"
                    data-testid="faq-accordion"
                >
                    {FAQS.map((f) => (
                        <AccordionItem
                            key={f.id}
                            value={f.id}
                            data-testid={`faq-item-${f.id}`}
                            className="rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 px-5 sm:px-6 overflow-hidden data-[state=open]:border-[hsl(var(--brand-blue-deep))]/40 data-[state=open]:shadow-lg transition-all"
                        >
                            <AccordionTrigger className="hover:no-underline py-5 text-right">
                                <span className="flex items-center gap-3 text-base sm:text-lg font-bold text-[hsl(var(--brand-ink))]">
                                    <span className="w-9 h-9 rounded-xl bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))] flex items-center justify-center flex-shrink-0">
                                        <f.icon className="w-4 h-4" />
                                    </span>
                                    {f.q}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="text-sm sm:text-base text-[hsl(var(--brand-ink))]/75 leading-relaxed pb-5 pr-12">
                                {f.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
};
