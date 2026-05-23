import { MessageCircle, Instagram, ShieldCheck } from "lucide-react";
import { useStoreData } from "../contexts/DataContext";
import { useLang, pickLocalized } from "../contexts/LanguageContext";
import { quickInquiry } from "../lib/whatsapp";

export const Footer = () => {
    const { store, waTemplates } = useStoreData();
    const { t, lang } = useLang();
    const name = pickLocalized(store, "name", lang);
    const tagline = pickLocalized(store, "tagline", lang);

    return (
        <footer
            id="contact"
            data-testid="site-footer"
            className="relative bg-[hsl(var(--brand-blue-deep))] text-[hsl(var(--brand-cream))] mt-16"
        >
            <div className="h-2 keffiyeh-pattern" />
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 grid md:grid-cols-3 gap-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src="/logo.png"
                            alt={name}
                            className="w-12 h-12 rounded-xl"
                        />
                        <div>
                            <div className="text-xl font-bold">{name}</div>
                            <div className="text-xs opacity-75">{tagline}</div>
                        </div>
                    </div>
                    <p className="text-sm opacity-80 leading-relaxed">
                        {t("footer.about")}
                    </p>
                </div>

                <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider opacity-75 mb-4">
                        {t("footer.contact")}
                    </h4>
                    <div className="space-y-3">
                        <button
                            onClick={() => quickInquiry(null, store, waTemplates)}
                            data-testid="footer-whatsapp"
                            className="flex items-center gap-3 group"
                        >
                            <span className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-4 h-4 text-white" />
                            </span>
                            <span className="text-sm">
                                {t("footer.whatsapp")}: {store.whatsappDisplay}
                            </span>
                        </button>
                        {store.instagram && (
                            <a
                                href={store.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="footer-instagram"
                                className="flex items-center gap-3 group"
                            >
                                <span className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Instagram className="w-4 h-4 text-white" />
                                </span>
                                <span className="text-sm">{t("footer.instagram")}</span>
                            </a>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider opacity-75 mb-4">
                        {t("footer.guarantees")}
                    </h4>
                    <ul className="space-y-3 text-sm">
                        {[t("footer.g1"), t("footer.g2"), t("footer.g3")].map((g, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{g}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="border-t border-[hsl(var(--brand-cream))]/15">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-70">
                    <span>
                        © {new Date().getFullYear()} {name} — {t("footer.copyright")}
                    </span>
                    <span>{t("footer.madeWith")}</span>
                </div>
            </div>
        </footer>
    );
};
