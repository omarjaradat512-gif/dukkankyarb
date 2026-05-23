import { useState } from "react";
import { Plus, Check, Share2, Gamepad2, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useLang } from "../contexts/LanguageContext";
import { useStoreData } from "../contexts/DataContext";
import { toast } from "sonner";

const TIER_LABEL = {
    four: "PS4 (Four)",
    five: "PS5 (Five)",
};

export const GameCard = ({ game }) => {
    const { add } = useCart();
    const { format } = useCurrency();
    const { t, lang } = useLang();
    const { store } = useStoreData();
    const isAvailable = game.available !== false; // default true if missing
    const availableTiers = ["five", "four"].filter((t) => game[t] != null);
    const hasPrice = availableTiers.length > 0;
    const canBuy = isAvailable && hasPrice;
    const possibleTiers = availableTiers.length
        ? availableTiers
        : ["five", "four"];
    const [tier, setTier] = useState(possibleTiers[0]);
    const [adding, setAdding] = useState(false);
    const [copied, setCopied] = useState(false);
    const [imgError, setImgError] = useState(false);

    const price = game[tier];

    const handleAdd = () => {
        if (!canBuy || price == null) return;
        const item = {
            key: `game-${game.id}-${tier}`,
            type: "game",
            title: game.name,
            subtitle: TIER_LABEL[tier],
            price,
        };
        add(item);
        setAdding(true);
        toast.success(t("toast.gameAddedToCart"), {
            description: `${game.name} (${TIER_LABEL[tier]})`,
        });
        setTimeout(() => setAdding(false), 1200);
    };

    const handleCopyLink = async () => {
        const base = `${window.location.origin}${window.location.pathname}`;
        const url = `${base}?p=game-${game.id}#games`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${game.name} — ${store?.name || ""}`,
                    text: lang === "ar" ? `شوف هاي اللعبة على متجر ${store?.name || ""}` : `Check out this game on ${store?.name || ""}`,
                    url,
                });
                return;
            }
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success(t("toast.linkCopied"), {
                description: t("toast.linkCopiedDesc"),
            });
            setTimeout(() => setCopied(false), 1800);
        } catch {
            toast.error(t("toast.copyFailed"));
        }
    };

    const showImage = game.image && !imgError;
    const platformLabel = !hasPrice
        ? t("card.comingSoon")
        : availableTiers.length === 2
          ? "PS4 / PS5"
          : availableTiers[0] === "five"
            ? t("card.ps5Only")
            : t("card.ps4Only");

    return (
        <article
            id={`game-${game.id}`}
            data-testid={`game-card-${game.id}`}
            className={`card-elevated rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 overflow-hidden flex flex-col transition-transform hover:-translate-y-1 scroll-mt-28 ${!isAvailable ? "opacity-90" : ""}`}
        >
            {/* Cover */}
            <div
                className="relative aspect-[3/4] flex items-center justify-center overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${game.gradientFrom} 0%, ${game.gradientTo} 100%)`,
                }}
            >
                {showImage ? (
                    <img
                        src={game.image}
                        alt={game.name}
                        loading="lazy"
                        onError={() => setImgError(true)}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <>
                        <div className="absolute inset-0 opacity-20 keffiyeh-pattern mix-blend-overlay" />
                        <Gamepad2 className="text-white/95 w-20 h-20 drop-shadow-xl" />
                    </>
                )}

                {/* Invisible clickable overlay → game detail */}
                <Link
                    to={`/game/${game.id}`}
                    aria-label={`عرض تفاصيل ${game.name}`}
                    data-testid={`game-${game.id}-cover-link`}
                    className="absolute inset-0 z-[1] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                />

                {/* Bottom gradient for legibility of badges */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none z-[2]" />

                {/* Out-of-stock overlay */}
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-[2]">
                        <span
                            className="rounded-full bg-[hsl(var(--brand-red))] text-white text-sm font-extrabold px-5 py-2 shadow-2xl rotate-[-6deg] border-2 border-white/20"
                            data-testid={`game-${game.id}-out-of-stock`}
                        >
                            {t("card.outOfStock")}
                        </span>
                    </div>
                )}

                <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white pointer-events-none z-[3]">
                    {platformLabel}
                </div>

                {isAvailable && !hasPrice && (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--brand-red))] px-3 py-1 text-[11px] font-bold text-[hsl(var(--brand-cream))] uppercase tracking-wider pointer-events-none z-[3]">
                        {t("card.priceSoon")}
                    </div>
                )}

                {isAvailable && hasPrice && game.bestSeller && (
                    <div
                        data-testid={`game-${game.id}-best-seller`}
                        className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold text-[#3a2400] tracking-wide shadow-lg pointer-events-none z-[3]"
                        style={{
                            background:
                                "linear-gradient(135deg, #ffd86b 0%, #f0a500 100%)",
                        }}
                    >
                        <i className="fa-solid fa-fire text-[10px]" />
                        {t("card.bestSeller")}
                    </div>
                )}

                {/* Share button */}
                <button
                    onClick={handleCopyLink}
                    aria-label={t("card.share")}
                    data-testid={`game-${game.id}-share-button`}
                    className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 hover:bg-white text-[hsl(var(--brand-ink))] px-3 py-1.5 text-[11px] font-semibold transition-colors backdrop-blur shadow-md z-[4]"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-[hsl(var(--brand-red))]" />
                            {t("card.copied")}
                        </>
                    ) : (
                        <>
                            <Share2 className="w-3.5 h-3.5" />
                            {t("card.share")}
                        </>
                    )}
                </button>
            </div>

            <div className="p-5 sm:p-6 flex flex-col flex-1">
                <Link
                    to={`/game/${game.id}`}
                    data-testid={`game-${game.id}-title-link`}
                    className="group"
                >
                    <h3
                        className="latin-tight text-lg sm:text-xl font-bold text-[hsl(var(--brand-ink))] leading-tight group-hover:text-[hsl(var(--brand-red))] transition-colors"
                        dir="ltr"
                    >
                        {game.name}
                    </h3>
                </Link>
                <p className="text-xs sm:text-sm text-[hsl(var(--brand-ink))]/60 mt-1">
                    {game.sub}
                </p>

                {/* Tier selector */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {possibleTiers.map((t) => {
                        const tierAvailable = game[t] != null;
                        return (
                            <button
                                key={t}
                                onClick={() =>
                                    tierAvailable ? setTier(t) : null
                                }
                                disabled={!tierAvailable}
                                data-testid={`game-${game.id}-tier-${t}`}
                                data-selected={tier === t && tierAvailable}
                                className="tier-pill text-xs sm:text-sm font-semibold rounded-lg border-2 border-[hsl(var(--brand-ink))]/15 h-10 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                            >
                                {TIER_LABEL[t]}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-5 pt-4 border-t border-[hsl(var(--brand-ink))]/10 flex items-end justify-between gap-3">
                    <div>
                        <div className="text-xs text-[hsl(var(--brand-ink))]/55">
                            {t("card.price")}
                        </div>
                        {!isAvailable ? (
                            <div
                                className="text-base font-bold text-[hsl(var(--brand-red))]/80"
                                data-testid={`game-${game.id}-price`}
                            >
                                {t("card.unavailable")}
                            </div>
                        ) : hasPrice && price != null ? (
                            <div
                                className="text-2xl font-bold text-[hsl(var(--brand-red))]"
                                data-testid={`game-${game.id}-price`}
                            >
                                {format(price)}
                            </div>
                        ) : (
                            <div
                                className="text-base font-bold text-[hsl(var(--brand-ink))]/40"
                                data-testid={`game-${game.id}-price`}
                            >
                                {t("card.comingSoon")}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            to={`/game/${game.id}`}
                            aria-label="details"
                            data-testid={`game-${game.id}-details-link`}
                            className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full border border-[hsl(var(--brand-ink))]/15 text-[hsl(var(--brand-ink))]/70 hover:bg-[hsl(var(--brand-cream))] hover:text-[hsl(var(--brand-ink))] transition-colors"
                        >
                            <Info className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={handleAdd}
                            disabled={!canBuy || price == null}
                            data-testid={`game-${game.id}-add-button`}
                            className="inline-flex items-center gap-2 rounded-full px-4 h-10 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-semibold hover:bg-[hsl(var(--brand-blue-deep))] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {adding ? (
                                <>
                                    <Check className="w-4 h-4" /> {t("card.added")}
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" /> {t("card.add")}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};
