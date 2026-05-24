import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../components/ui/accordion";
import {
    HelpCircle,
    Truck,
    CreditCard,
    ShieldCheck,
    Gift,
    Clock,
    Headphones,
    Star,
    Zap,
    Tag,
} from "lucide-react";
import { useStoreData } from "../contexts/DataContext";

// Map icon key → lucide component
const ICON_MAP = {
    "truck": Truck,
    "credit-card": CreditCard,
    "shield-check": ShieldCheck,
    "gift": Gift,
    "clock": Clock,
    "headphones": Headphones,
    "star": Star,
    "zap": Zap,
    "tag": Tag,
    "help-circle": HelpCircle,
};

export const FAQ_ICON_OPTIONS = Object.keys(ICON_MAP);

export const FAQ = () => {
    const { faqs } = useStoreData();
    const list = faqs || [];
    if (list.length === 0) return null;
    const defaultOpen = list[0]?.id;

    return (
        <section
            id="faq"
            data-testid="faq-section"
            className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20"
        >
            <div className="grid md:grid-cols-[1fr_2fr] gap-10 lg:gap-16 items-start">
                <div className="md:sticky md:top-28">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand-blue))]/15 border border-[hsl(var(--brand-blue))]/30 px-3 py-1.5 text-xs font-semibold text-[hsl(var(--brand-blue-deep))] dark:text-[hsl(var(--brand-blue))] mb-4">
                        <HelpCircle className="w-3.5 h-3.5" />
                        الأسئلة الشائعة
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--brand-ink))] dark:text-[hsl(var(--brand-cream))] leading-tight">
                        أي استفسار عندك؟
                    </h2>
                    <p className="mt-3 text-base sm:text-lg text-[hsl(var(--brand-ink))]/70 dark:text-[hsl(var(--brand-cream))]/70 leading-relaxed">
                        إذا لقيت إجابة هنا، رائع! وإذا لا، فريقنا متواجد ٢٤/٧
                        على واتساب لمساعدتك.
                    </p>
                </div>

                <Accordion
                    type="single"
                    collapsible
                    defaultValue={defaultOpen}
                    className="space-y-3"
                    data-testid="faq-accordion"
                >
                    {list.map((f) => {
                        const Icon = ICON_MAP[f.icon] || HelpCircle;
                        return (
                            <AccordionItem
                                key={f.id}
                                value={f.id}
                                data-testid={`faq-item-${f.id}`}
                                className="rounded-2xl bg-white dark:bg-white/[0.04] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 px-5 sm:px-6 overflow-hidden data-[state=open]:border-[hsl(var(--brand-blue-deep))]/40 data-[state=open]:shadow-lg transition-all"
                            >
                                <AccordionTrigger className="hover:no-underline py-5 text-right">
                                    <span className="flex items-center gap-3 text-base sm:text-lg font-bold text-[hsl(var(--brand-ink))] dark:text-[hsl(var(--brand-cream))]">
                                        <span className="w-9 h-9 rounded-xl bg-[hsl(var(--brand-blue))]/15 text-[hsl(var(--brand-blue-deep))] dark:text-[hsl(var(--brand-blue))] flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-4 h-4" />
                                        </span>
                                        {f.q}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="text-sm sm:text-base text-[hsl(var(--brand-ink))]/75 dark:text-[hsl(var(--brand-cream))]/75 leading-relaxed pb-5 pr-12 whitespace-pre-line">
                                    {f.a}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
        </section>
    );
};
