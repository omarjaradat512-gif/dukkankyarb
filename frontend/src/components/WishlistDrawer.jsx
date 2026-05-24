import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Heart, Trash2, ShoppingBag, X } from "lucide-react";
import { useStoreData } from "../contexts/DataContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useCart } from "../contexts/CartContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export const WishlistDrawer = ({ open, onOpenChange }) => {
    const { games } = useStoreData();
    const { ids, remove, clear } = useWishlist();
    const { format } = useCurrency();
    const { add } = useCart();

    const items = ids
        .map((id) => games.find((g) => g.id === id))
        .filter(Boolean);

    const handleAddToCart = (g) => {
        const tier = g.five != null ? "five" : g.four != null ? "four" : null;
        if (!tier || g.available === false) {
            toast.error("اللعبة غير متوفرة حالياً");
            return;
        }
        add({
            key: `game-${g.id}-${tier}`,
            type: "game",
            title: g.name,
            subtitle: tier === "five" ? "PS5 (Five)" : "PS4 (Four)",
            price: g[tier],
        });
        toast.success(`أُضيفت ${g.name} للسلة`);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                data-testid="wishlist-drawer"
                className="w-full sm:max-w-md bg-[hsl(var(--brand-cream))] border-l border-[hsl(var(--brand-ink))]/10 flex flex-col p-0"
            >
                <SheetHeader className="px-5 py-4 border-b border-[hsl(var(--brand-ink))]/10 flex-row items-center justify-between">
                    <SheetTitle className="flex items-center gap-2 text-[hsl(var(--brand-ink))]">
                        <Heart className="w-5 h-5 text-[hsl(var(--brand-red))] fill-[hsl(var(--brand-red))]" />
                        قائمة المفضلة ({items.length})
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-5">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                            <div className="w-20 h-20 rounded-full bg-[hsl(var(--brand-red))]/10 flex items-center justify-center mb-4">
                                <Heart className="w-8 h-8 text-[hsl(var(--brand-red))]/50" />
                            </div>
                            <h3 className="text-lg font-bold text-[hsl(var(--brand-ink))]">
                                المفضلة فاضية
                            </h3>
                            <p className="text-sm text-[hsl(var(--brand-ink))]/60 mt-2 max-w-xs">
                                اضغط على قلب أي لعبة في الموقع لحفظها هنا.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3" data-testid="wishlist-items">
                            {items.map((g) => {
                                const tier = g.five != null ? "five" : "four";
                                const price = g[tier];
                                const tierLabel = tier === "five" ? "PS5" : "PS4";
                                return (
                                    <div
                                        key={g.id}
                                        data-testid={`wishlist-item-${g.id}`}
                                        className="rounded-2xl bg-white dark:bg-white/[0.04] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 p-3 flex items-center gap-3"
                                    >
                                        <div
                                            className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0"
                                            style={{
                                                background: `linear-gradient(135deg, ${g.gradientFrom} 0%, ${g.gradientTo} 100%)`,
                                            }}
                                        >
                                            {g.image && (
                                                <img
                                                    src={g.image}
                                                    alt={g.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                to={`/game/${g.id}`}
                                                onClick={() => onOpenChange(false)}
                                                className="font-bold text-sm text-[hsl(var(--brand-ink))] hover:text-[hsl(var(--brand-red))] line-clamp-1"
                                                dir="ltr"
                                            >
                                                {g.name}
                                            </Link>
                                            <div className="text-xs text-[hsl(var(--brand-ink))]/55 mt-0.5">
                                                {tierLabel}
                                            </div>
                                            {price != null && (
                                                <div className="text-sm font-bold text-[hsl(var(--brand-red))] mt-1">
                                                    {format(price)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => handleAddToCart(g)}
                                                aria-label="أضف للسلة"
                                                data-testid={`wishlist-${g.id}-add-cart`}
                                                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] hover:bg-[hsl(var(--brand-blue-deep))]"
                                            >
                                                <ShoppingBag className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => remove(g.id)}
                                                aria-label="إزالة"
                                                data-testid={`wishlist-${g.id}-remove`}
                                                className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="px-5 py-3 border-t border-[hsl(var(--brand-ink))]/10">
                        <button
                            onClick={() => {
                                if (window.confirm("مسح كل المفضلة؟")) clear();
                            }}
                            data-testid="wishlist-clear"
                            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-[hsl(var(--brand-ink))]/55 hover:text-[hsl(var(--brand-red))]"
                        >
                            <X className="w-3.5 h-3.5" /> مسح الكل
                        </button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
