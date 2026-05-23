import { ShoppingBag } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useStoreData } from "../contexts/DataContext";
import { CurrencySwitcher } from "./CurrencySwitcher";

export const Header = ({ onOpenCart }) => {
    const { totalQty } = useCart();
    const { store } = useStoreData();
    const storeName = store?.name || "دُكانك";

    return (
        <header
            data-testid="site-header"
            className="sticky top-0 z-40 backdrop-blur-md bg-[hsl(var(--brand-cream))]/85 border-b border-[hsl(var(--brand-ink))]/10"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
                <a
                    href="#top"
                    className="flex items-center gap-3 group"
                    data-testid="header-brand"
                >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden ring-2 ring-[hsl(var(--brand-blue))]/30 bg-[hsl(var(--brand-blue))]/15 transition-transform group-hover:scale-105">
                        <img
                            src="/logo.png"
                            alt={storeName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="leading-tight">
                        <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--brand-ink))]">
                            {storeName}
                        </div>
                        <div className="text-[11px] sm:text-xs text-[hsl(var(--brand-ink))]/60 -mt-0.5">
                            متجر رقمي
                        </div>
                    </div>
                </a>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[hsl(var(--brand-ink))]/75">
                    <a
                        href="#essential"
                        className="hover:text-[hsl(var(--brand-red))] transition-colors"
                        data-testid="nav-essential"
                    >
                        أساسي
                    </a>
                    <a
                        href="#extra"
                        className="hover:text-[hsl(var(--brand-red))] transition-colors"
                        data-testid="nav-extra"
                    >
                        إضافي
                    </a>
                    <a
                        href="#games"
                        className="hover:text-[hsl(var(--brand-red))] transition-colors"
                        data-testid="nav-games"
                    >
                        الألعاب
                    </a>
                    <a
                        href="#reviews"
                        className="hover:text-[hsl(var(--brand-red))] transition-colors"
                        data-testid="nav-reviews"
                    >
                        التقييمات
                    </a>
                    <a
                        href="#faq"
                        className="hover:text-[hsl(var(--brand-red))] transition-colors"
                        data-testid="nav-faq"
                    >
                        الأسئلة
                    </a>
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    <CurrencySwitcher compact />
                    <button
                        onClick={onOpenCart}
                        data-testid="open-cart-button"
                        className="relative inline-flex items-center gap-2 rounded-full px-3 sm:px-5 h-9 sm:h-11 bg-[hsl(var(--brand-blue-deep))] text-[hsl(var(--brand-cream))] text-xs sm:text-sm font-semibold hover:bg-[hsl(var(--brand-ink))] transition-colors"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="hidden sm:inline">السلة</span>
                        {totalQty > 0 && (
                            <span
                                data-testid="cart-badge"
                                className="absolute -top-1 -left-1 min-w-[22px] h-[22px] px-1 inline-flex items-center justify-center rounded-full bg-[hsl(var(--brand-red))] text-[hsl(var(--brand-cream))] text-[11px] font-bold ring-2 ring-[hsl(var(--brand-cream))]"
                            >
                                {totalQty}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};
