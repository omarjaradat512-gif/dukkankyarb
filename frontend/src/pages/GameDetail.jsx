import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Plus,
    Check,
    Star,
    Users,
    Wifi,
    WifiOff,
    HardDrive,
    Tag,
    Gamepad2,
    Share2,
} from "lucide-react";
import { GAME_DETAILS } from "../data/gameDetails";
import { useCart } from "../contexts/CartContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useStoreData } from "../contexts/DataContext";
import { toast } from "sonner";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CartDrawer } from "../components/CartDrawer";

const TIER_LABEL = { four: "PS4 (Four)", five: "PS5 (Five)" };

export default function GameDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { games: GAMES, store: STORE } = useStoreData();
    const game = GAMES.find((g) => g.id === id);
    const details = GAME_DETAILS[id] || {};
    const { add } = useCart();
    const { format } = useCurrency();

    const [cartOpen, setCartOpen] = useState(false);
    const [tier, setTier] = useState(
        game?.five != null ? "five" : game?.four != null ? "four" : "five",
    );
    const [adding, setAdding] = useState(false);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [id]);

    const similarGames = useMemo(() => {
        if (!details.similar?.length) {
            // Fallback: pick 3 other available games
            return GAMES.filter((g) => g.id !== id && g.available !== false).slice(0, 3);
        }
        return details.similar
            .map((sid) => GAMES.find((g) => g.id === sid))
            .filter(Boolean);
    }, [id, details.similar]);

    if (!game) {
        return (
            <div className="min-h-screen bg-[hsl(var(--brand-cream))] flex flex-col">
                <Header onOpenCart={() => setCartOpen(true)} />
                <div className="flex-1 flex items-center justify-center px-6 text-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-3">
                            ما لقينا اللعبة 😕
                        </h1>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-full px-5 h-11 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] font-semibold"
                        >
                            <ArrowRight className="w-4 h-4" />
                            الرجوع للرئيسية
                        </Link>
                    </div>
                </div>
                <Footer />
                <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
            </div>
        );
    }

    const isAvailable = game.available !== false;
    const availableTiers = ["five", "four"].filter((t) => game[t] != null);
    const price = game[tier];
    const canBuy = isAvailable && price != null;

    const handleAdd = () => {
        if (!canBuy) return;
        add({
            key: `game-${game.id}-${tier}`,
            type: "game",
            title: game.name,
            subtitle: TIER_LABEL[tier],
            price,
        });
        setAdding(true);
        toast.success("تمت إضافة اللعبة إلى السلة", {
            description: `${game.name} (${TIER_LABEL[tier]})`,
        });
        setTimeout(() => setAdding(false), 1400);
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${game.name} — ${STORE.name}`,
                    text: `شوف هاي اللعبة على متجر ${STORE.name}`,
                    url,
                });
                return;
            }
            await navigator.clipboard.writeText(url);
            toast.success("تم نسخ رابط اللعبة");
        } catch {
            toast.error("ما قدرنا ننسخ الرابط");
        }
    };

    const showImage = game.image && !imgError;

    return (
        <div
            className="min-h-screen bg-[hsl(var(--brand-cream))] grain-bg game-detail-fade"
            data-testid={`game-detail-${game.id}`}
        >
            <Header onOpenCart={() => setCartOpen(true)} />

            {/* Hero */}
            <div className="relative overflow-hidden border-b border-[hsl(var(--brand-ink))]/10">
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(135deg, ${game.gradientFrom} 0%, ${game.gradientTo} 100%)`,
                    }}
                />
                {showImage && (
                    <img
                        src={game.image}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover opacity-25 blur-2xl scale-110"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--brand-cream))] via-[hsl(var(--brand-cream))]/30 to-transparent" />

                <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-12 sm:pt-8 sm:pb-16">
                    <button
                        onClick={() => navigate(-1)}
                        data-testid="detail-back-button"
                        className="inline-flex items-center gap-2 rounded-full px-3 h-9 bg-white/90 hover:bg-white text-[hsl(var(--brand-ink))] text-xs font-semibold mb-6 backdrop-blur shadow"
                    >
                        <ArrowRight className="w-3.5 h-3.5" />
                        رجوع
                    </button>

                    <div className="grid md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr] gap-6 sm:gap-10 items-start">
                        {/* Cover */}
                        <div
                            className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30"
                            data-testid="detail-cover"
                        >
                            {showImage ? (
                                <img
                                    src={game.image}
                                    alt={game.name}
                                    onError={() => setImgError(true)}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            ) : (
                                <div
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{
                                        background: `linear-gradient(135deg, ${game.gradientFrom} 0%, ${game.gradientTo} 100%)`,
                                    }}
                                >
                                    <Gamepad2 className="w-20 h-20 text-white/80" />
                                </div>
                            )}
                            {game.bestSeller && (
                                <span
                                    className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold text-[#3a2400] shadow-lg"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #ffd86b 0%, #f0a500 100%)",
                                    }}
                                >
                                    <i className="fa-solid fa-fire text-[10px]" />
                                    الأكثر مبيعاً
                                </span>
                            )}
                            {!isAvailable && (
                                <div className="absolute inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center">
                                    <span className="rounded-full bg-[hsl(var(--brand-red))] text-white text-sm font-extrabold px-5 py-2 shadow-2xl">
                                        غير متوفرة حالياً
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Info column */}
                        <div className="text-[hsl(var(--brand-ink))]">
                            {details.genre && (
                                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] mb-3 text-[hsl(var(--brand-blue-deep))] bg-white/80 backdrop-blur rounded-full px-3 py-1 shadow-sm">
                                    <Tag className="w-3.5 h-3.5" />
                                    {details.genre}
                                </div>
                            )}
                            <h1
                                className="latin-tight text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-3"
                                dir="ltr"
                                data-testid="detail-title"
                            >
                                {game.name}
                            </h1>
                            <p className="text-sm sm:text-base text-[hsl(var(--brand-ink))]/65 mb-5">
                                {game.sub}
                            </p>

                            {details.rating != null && (
                                <div className="inline-flex items-center gap-2 mb-6 bg-white/80 backdrop-blur rounded-full px-4 h-10 shadow-sm">
                                    <Star className="w-4 h-4 fill-[#f0a500] text-[#f0a500]" />
                                    <span className="font-bold">
                                        {details.rating.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-[hsl(var(--brand-ink))]/55">
                                        / 10
                                    </span>
                                </div>
                            )}

                            {/* Tier selector + price + add to cart */}
                            <div className="rounded-2xl bg-white/95 backdrop-blur border border-[hsl(var(--brand-ink))]/10 p-5 sm:p-6 shadow-xl">
                                <div className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--brand-ink))]/55 mb-3">
                                    اختر الجهاز
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-5">
                                    {["five", "four"].map((t) => {
                                        const av = game[t] != null;
                                        return (
                                            <button
                                                key={t}
                                                onClick={() => av && setTier(t)}
                                                disabled={!av}
                                                data-testid={`detail-tier-${t}`}
                                                data-selected={tier === t && av}
                                                className="tier-pill text-sm font-semibold rounded-xl border-2 border-[hsl(var(--brand-ink))]/15 h-11 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                                            >
                                                {TIER_LABEL[t]}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-end justify-between gap-3 pt-4 border-t border-[hsl(var(--brand-ink))]/10">
                                    <div>
                                        <div className="text-xs text-[hsl(var(--brand-ink))]/55">
                                            السعر
                                        </div>
                                        {!isAvailable ? (
                                            <div className="text-base font-bold text-[hsl(var(--brand-red))]/80">
                                                غير متوفرة
                                            </div>
                                        ) : availableTiers.length === 0 ? (
                                            <div className="text-base font-bold text-[hsl(var(--brand-ink))]/40">
                                                السعر قريباً
                                            </div>
                                        ) : price == null ? (
                                            <div className="text-base font-bold text-[hsl(var(--brand-ink))]/40">
                                                غير متاح على {TIER_LABEL[tier]}
                                            </div>
                                        ) : (
                                            <div
                                                className="text-3xl font-extrabold text-[hsl(var(--brand-red))]"
                                                data-testid="detail-price"
                                            >
                                                {format(price)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleShare}
                                            aria-label="مشاركة"
                                            className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[hsl(var(--brand-ink))]/15 text-[hsl(var(--brand-ink))]/70 hover:bg-[hsl(var(--brand-cream))] hover:text-[hsl(var(--brand-ink))] transition-colors"
                                            data-testid="detail-share-button"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleAdd}
                                            disabled={!canBuy}
                                            data-testid="detail-add-button"
                                            className="inline-flex items-center gap-2 rounded-full px-5 h-11 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-semibold hover:bg-[hsl(var(--brand-blue-deep))] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {adding ? (
                                                <>
                                                    <Check className="w-4 h-4" />{" "}
                                                    أُضيف
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4" />{" "}
                                                    إضافة للسلة
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description + Specs */}
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 grid lg:grid-cols-[1fr_280px] gap-8 sm:gap-12">
                <div>
                    <div className="text-xs font-bold uppercase tracking-[0.15em] text-[hsl(var(--brand-blue-deep))] mb-3">
                        عن اللعبة
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[hsl(var(--brand-ink))]">
                        {game.name}
                    </h2>
                    {details.description ? (
                        <p
                            className="text-base sm:text-lg leading-relaxed text-[hsl(var(--brand-ink))]/80"
                            data-testid="detail-description"
                        >
                            {details.description}
                        </p>
                    ) : (
                        <p className="text-base sm:text-lg leading-relaxed text-[hsl(var(--brand-ink))]/65 italic">
                            تفاصيل اللعبة بتنزل قريباً. تواصل معنا على واتساب
                            لأي استفسار.
                        </p>
                    )}
                    {details.descEn && (
                        <p
                            className="mt-4 text-sm text-[hsl(var(--brand-ink))]/55 leading-relaxed"
                            dir="ltr"
                        >
                            {details.descEn}
                        </p>
                    )}

                    {/* Trailer */}
                    {details.trailer && (
                        <div className="mt-10">
                            <div className="text-xs font-bold uppercase tracking-[0.15em] text-[hsl(var(--brand-red))] mb-3">
                                التريلر الرسمي
                            </div>
                            <div
                                className="rounded-2xl overflow-hidden aspect-video border border-[hsl(var(--brand-ink))]/10 shadow-xl bg-black"
                                data-testid="detail-trailer"
                            >
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${details.trailer}?rel=0`}
                                    title={`${game.name} trailer`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Specs aside */}
                <aside className="lg:sticky lg:top-24 self-start">
                    <div className="rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 p-5 shadow-md">
                        <div className="text-xs font-bold uppercase tracking-[0.15em] text-[hsl(var(--brand-ink))]/60 mb-4">
                            المواصفات
                        </div>
                        <dl className="space-y-3 text-sm">
                            {details.players && (
                                <div className="flex items-start gap-3">
                                    <Users className="w-4 h-4 mt-0.5 text-[hsl(var(--brand-blue-deep))]" />
                                    <div>
                                        <dt className="text-[hsl(var(--brand-ink))]/55 text-xs">
                                            عدد اللاعبين
                                        </dt>
                                        <dd className="font-semibold">
                                            {details.players}
                                        </dd>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                {details.online ? (
                                    <Wifi className="w-4 h-4 mt-0.5 text-[#1a6e22]" />
                                ) : (
                                    <WifiOff className="w-4 h-4 mt-0.5 text-[hsl(var(--brand-ink))]/40" />
                                )}
                                <div>
                                    <dt className="text-[hsl(var(--brand-ink))]/55 text-xs">
                                        أونلاين
                                    </dt>
                                    <dd className="font-semibold">
                                        {details.online ? "مدعوم" : "غير مدعوم"}
                                    </dd>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Gamepad2
                                    className={`w-4 h-4 mt-0.5 ${details.offline === false ? "text-[hsl(var(--brand-ink))]/40" : "text-[#1a6e22]"}`}
                                />
                                <div>
                                    <dt className="text-[hsl(var(--brand-ink))]/55 text-xs">
                                        أوفلاين
                                    </dt>
                                    <dd className="font-semibold">
                                        {details.offline === false
                                            ? "غير مدعوم"
                                            : "مدعوم"}
                                    </dd>
                                </div>
                            </div>
                            {details.size && (
                                <div className="flex items-start gap-3">
                                    <HardDrive className="w-4 h-4 mt-0.5 text-[hsl(var(--brand-blue-deep))]" />
                                    <div>
                                        <dt className="text-[hsl(var(--brand-ink))]/55 text-xs">
                                            مساحة اللعبة
                                        </dt>
                                        <dd className="font-semibold">
                                            {details.size}
                                        </dd>
                                    </div>
                                </div>
                            )}
                        </dl>
                    </div>
                </aside>
            </div>

            {/* Similar games */}
            {similarGames.length > 0 && (
                <section className="border-t border-[hsl(var(--brand-ink))]/10 bg-white/60">
                    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
                        <div className="text-xs font-bold uppercase tracking-[0.15em] text-[hsl(var(--brand-blue-deep))] mb-3">
                            ألعاب مشابهة
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--brand-ink))] mb-6">
                            قد يعجبك كمان
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
                            {similarGames.map((g) => (
                                <Link
                                    to={`/game/${g.id}`}
                                    key={g.id}
                                    data-testid={`similar-game-${g.id}`}
                                    className="group block rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 overflow-hidden hover:-translate-y-1 transition-transform"
                                >
                                    <div
                                        className="relative aspect-[3/4] overflow-hidden"
                                        style={{
                                            background: `linear-gradient(135deg, ${g.gradientFrom} 0%, ${g.gradientTo} 100%)`,
                                        }}
                                    >
                                        {g.image && (
                                            <img
                                                src={g.image}
                                                alt={g.name}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <div
                                            dir="ltr"
                                            className="latin-tight text-sm font-bold leading-tight text-[hsl(var(--brand-ink))]"
                                        >
                                            {g.name}
                                        </div>
                                        {g.available !== false &&
                                            (g.five != null ||
                                                g.four != null) && (
                                                <div className="text-xs font-bold text-[hsl(var(--brand-red))] mt-1.5">
                                                    من {format(g.five ?? g.four)}
                                                </div>
                                            )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Footer />

            <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
        </div>
    );
}
