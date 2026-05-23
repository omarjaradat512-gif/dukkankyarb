import { createContext, useContext, useEffect, useMemo } from "react";
import { translations } from "../i18n/translations";

// Language support is intentionally locked to Arabic only.
// (English option was removed at user's request.)
const LangContext = createContext(null);

export function LanguageProvider({ children }) {
    useEffect(() => {
        const html = document.documentElement;
        html.setAttribute("lang", "ar");
        html.setAttribute("dir", "rtl");
    }, []);

    const value = useMemo(() => {
        const dict = translations.ar;
        const t = (key, fallback) => {
            if (key == null) return "";
            return dict[key] ?? fallback ?? key;
        };
        return {
            lang: "ar",
            dir: "rtl",
            isRTL: true,
            setLang: () => {},
            toggleLang: () => {},
            t,
        };
    }, []);

    return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
    const ctx = useContext(LangContext);
    if (!ctx) throw new Error("useLang must be used within LanguageProvider");
    return ctx;
}

// Kept for backwards compatibility — always picks the Arabic field.
export function pickLocalized(obj, baseKey /* , lang */) {
    if (!obj) return "";
    return obj[baseKey] || "";
}
