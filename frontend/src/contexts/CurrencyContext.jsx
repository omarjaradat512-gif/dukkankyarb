import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

// Base prices in the catalogue are in USD.
// Rates below are USD → target. (تقريبية — عدّلها إذا تغيّر سعر الصرف)
export const CURRENCIES = {
    SAR: {
        code: "SAR",
        symbol: "ر.س",
        rate: 3.75,
        name: "ريال سعودي",
        short: "SAR",
    },
    USD: {
        code: "USD",
        symbol: "$",
        rate: 1,
        name: "دولار أمريكي",
        short: "USD",
    },
    AED: {
        code: "AED",
        symbol: "د.إ",
        rate: 3.67,
        name: "درهم إماراتي",
        short: "AED",
    },
    JOD: {
        code: "JOD",
        symbol: "د.أ",
        rate: 0.71,
        name: "دينار أردني",
        short: "JOD",
    },
    KWD: {
        code: "KWD",
        symbol: "د.ك",
        rate: 0.31,
        name: "دينار كويتي",
        short: "KWD",
    },
    BHD: {
        code: "BHD",
        symbol: "د.ب",
        rate: 0.38,
        name: "دينار بحريني",
        short: "BHD",
    },
    OMR: {
        code: "OMR",
        symbol: "ر.ع",
        rate: 0.385,
        name: "ريال عُماني",
        short: "OMR",
    },
    QAR: {
        code: "QAR",
        symbol: "ر.ق",
        rate: 3.64,
        name: "ريال قطري",
        short: "QAR",
    },
    ILS: {
        code: "ILS",
        symbol: "₪",
        rate: 3.65,
        name: "شيكل فلسطيني",
        short: "ILS",
    },
    IQD: {
        code: "IQD",
        symbol: "د.ع",
        rate: 1310,
        name: "دينار عراقي",
        short: "IQD",
    },
    EGP: {
        code: "EGP",
        symbol: "ج.م",
        rate: 50,
        name: "جنيه مصري",
        short: "EGP",
    },
};

const STORAGE_KEY = "dakanak_currency_v1";
const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
    const [code, setCode] = useState("SAR"); // default per requirement

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && CURRENCIES[saved]) setCode(saved);
        } catch {}
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, code);
        } catch {}
    }, [code]);

    const value = useMemo(() => {
        const cur = CURRENCIES[code];
        const convert = (usd) => usd * cur.rate;
        const format = (usd) => {
            const v = convert(usd);
            // Dinars (KWD/BHD/OMR/JOD) usually use 3 decimal places
            const usesThreeDecimals = ["KWD", "BHD", "OMR", "JOD"].includes(cur.code);
            // Big-number currencies (IQD) show thousands separators, no decimals
            const usesNoDecimals = ["IQD"].includes(cur.code);
            let display;
            if (usesNoDecimals) {
                display = Math.round(v).toLocaleString("en-US");
            } else if (usesThreeDecimals) {
                const rounded = Math.round(v * 1000) / 1000;
                display = Number.isInteger(rounded)
                    ? rounded.toString()
                    : rounded.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
            } else {
                const rounded = Math.round(v * 100) / 100;
                display = Number.isInteger(rounded)
                    ? rounded.toString()
                    : rounded.toFixed(2).replace(/\.?0+$/, "");
            }
            // Symbol position: USD before, others after
            if (cur.code === "USD") return `${display}${cur.symbol}`;
            return `${display} ${cur.symbol}`;
        };
        return {
            code,
            currency: cur,
            setCurrency: setCode,
            convert,
            format,
        };
    }, [code]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const ctx = useContext(CurrencyContext);
    if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
    return ctx;
}
