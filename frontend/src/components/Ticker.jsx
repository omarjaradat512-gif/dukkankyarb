import { Sparkles, Zap, BadgeCheck, MessageCircle, Tag } from "lucide-react";
import { useLang } from "../contexts/LanguageContext";

export const Ticker = () => {
    const { t } = useLang();
    const items = [
        { icon: Zap, label: t("ticker.instant") },
        { icon: BadgeCheck, label: t("ticker.original") },
        { icon: MessageCircle, label: t("ticker.support") },
        { icon: Tag, label: t("ticker.prices") },
        { icon: Sparkles, label: t("ticker.updates") },
    ];
    const loop = [...items, ...items, ...items];
    return (
        <div className="bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] py-3 overflow-hidden border-y border-[hsl(var(--brand-cream))]/10">
            <div className="flex marquee-track gap-12 whitespace-nowrap">
                {loop.map((it, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2 text-sm font-medium opacity-90"
                    >
                        <it.icon className="w-4 h-4 text-[hsl(var(--brand-red-soft))]" />
                        <span>{it.label}</span>
                        <span className="mx-3 opacity-30">•</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
