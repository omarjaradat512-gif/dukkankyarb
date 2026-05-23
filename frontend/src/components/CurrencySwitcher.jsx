import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Wallet } from "lucide-react";
import { CURRENCIES, useCurrency } from "../contexts/CurrencyContext";

export const CurrencySwitcher = ({ compact = false }) => {
    const { code, setCurrency, currency } = useCurrency();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                data-testid="currency-switcher-button"
                className={`inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--brand-ink))]/15 bg-white/70 backdrop-blur ${
                    compact ? "h-9 px-3" : "h-11 px-4"
                } text-xs sm:text-sm font-semibold text-[hsl(var(--brand-ink))] hover:bg-white transition-colors`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <Wallet className="w-3.5 h-3.5 text-[hsl(var(--brand-blue-deep))]" />
                <span className="hidden sm:inline">{currency.name}</span>
                <span className="sm:hidden">{currency.short}</span>
                <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {open && (
                <div
                    role="listbox"
                    data-testid="currency-switcher-list"
                    className="absolute mt-2 left-0 sm:right-0 sm:left-auto z-50 min-w-[200px] max-h-[60vh] overflow-y-auto rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 shadow-2xl"
                >
                    {Object.values(CURRENCIES).map((cur) => {
                        const selected = cur.code === code;
                        return (
                            <button
                                key={cur.code}
                                onClick={() => {
                                    setCurrency(cur.code);
                                    setOpen(false);
                                }}
                                data-testid={`currency-option-${cur.code}`}
                                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold transition-colors ${
                                    selected
                                        ? "bg-[hsl(var(--brand-blue))]/10 text-[hsl(var(--brand-blue-deep))]"
                                        : "text-[hsl(var(--brand-ink))] hover:bg-[hsl(var(--brand-cream))]/60"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="font-bold">{cur.short}</span>
                                    <span className="text-xs opacity-70">
                                        {cur.name}
                                    </span>
                                </span>
                                {selected && (
                                    <Check className="w-4 h-4 text-[hsl(var(--brand-red))]" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
