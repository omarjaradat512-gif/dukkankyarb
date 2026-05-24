import { useState } from "react";
import { ShoppingBag, Heart, Menu, X } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useStoreData } from "../contexts/DataContext";
import { useWishlist } from "../contexts/WishlistContext";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";

const NAV_LINKS = [
    { href: "#essential", label: "أساسي" },
    { href: "#extra", label: "إضافي" },
    { href: "#bundles", label: "الباقات" },
    { href: "#build-bundle", label: "ابني باقتك" },
    { href: "#games", label: "الألعاب" },
    { href: "#reviews", label: "التقييمات" },
    { href: "#faq", label: "الأسئلة" },
];

export const Header = ({ onOpenCart, onOpenWishlist }) => {
    const { totalQty } = useCart();
    const { store } = useStoreData();
    const { count: wishCount } = useWishlist();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const storeName = store?.name || "دُكانك";

    return (
        <header
            data-testid="site-header"
            className="sticky top-0 z-40 backdrop-blur-md bg-[hsl(var(--brand-cream))]/85 border-b border-[hsl(var(--brand-ink))]/10 dark:border-white/10"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileNavOpen(true)}
                        aria-label="القائمة"
                        data-testid="mobile-nav-toggle"
                        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full text-[hsl(var(--brand-ink))] hover:bg-[hsl(var(--brand-ink))]/5 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

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
                </div>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[hsl(var(--brand-ink))]/75">
                    {NAV_LINKS.map((l) => (
                        <a
                            key={l.href}
                            href={l.href}
                            className="hover:text-[hsl(var(--brand-red))] transition-colors"
                            data-testid={`nav-${l.href.slice(1)}`}
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    <ThemeToggle />
                    <button
                        onClick={onOpenWishlist}
                        data-testid="open-wishlist-button"
                        aria-label="المفضلة"
                        className="relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-white/[0.06] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 text-[hsl(var(--brand-red))] hover:bg-[hsl(var(--brand-cream-warm))] transition-colors"
                    >
                        <Heart className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${wishCount > 0 ? "fill-[hsl(var(--brand-red))]" : ""}`} />
                        {wishCount > 0 && (
                            <span
                                data-testid="wishlist-badge"
                                className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[hsl(var(--brand-red))] text-white text-[10px] font-bold ring-2 ring-[hsl(var(--brand-cream))]"
                            >
                                {wishCount}
                            </span>
                        )}
                    </button>
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

            {/* Mobile nav drawer */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetContent
                    side="right"
                    data-testid="mobile-nav-drawer"
                    className="w-72 bg-[hsl(var(--brand-cream))] border-l border-[hsl(var(--brand-ink))]/10 dark:border-white/10 flex flex-col p-0"
                >
                    <SheetHeader className="px-5 py-4 border-b border-[hsl(var(--brand-ink))]/10 flex-row items-center justify-between">
                        <SheetTitle className="flex items-center gap-2 text-[hsl(var(--brand-ink))]">
                            <Menu className="w-5 h-5 text-[hsl(var(--brand-blue-deep))]" />
                            {storeName}
                        </SheetTitle>
                    </SheetHeader>
                    <nav className="flex-1 overflow-y-auto py-3" data-testid="mobile-nav-list">
                        {NAV_LINKS.map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                onClick={() => setMobileNavOpen(false)}
                                data-testid={`mobile-nav-${l.href.slice(1)}`}
                                className="block px-5 py-3.5 text-base font-bold text-[hsl(var(--brand-ink))] hover:bg-[hsl(var(--brand-ink))]/5 active:bg-[hsl(var(--brand-blue))]/15 transition-colors border-b border-[hsl(var(--brand-ink))]/5"
                            >
                                {l.label}
                            </a>
                        ))}
                    </nav>
                    <div className="px-5 py-3 border-t border-[hsl(var(--brand-ink))]/10 text-[11px] text-[hsl(var(--brand-ink))]/55 text-center">
                        © {storeName}
                    </div>
                </SheetContent>
            </Sheet>
        </header>
    );
};
