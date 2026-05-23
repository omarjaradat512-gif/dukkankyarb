import { useState, useMemo } from "react";
import {
    Wand2,
    ArrowLeft,
    ArrowRight,
    Check,
    X,
    Plus,
    Sparkles,
    RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useStoreData } from "../contexts/DataContext";
import { GAME_DETAILS } from "../data/gameDetails";
import { toast } from "sonner";

const TIER_LABEL = { four: "PS4 (Four)", five: "PS5 (Five)" };

// ──────────────────────────────────────────────────────────────────────────
// Questions
// ──────────────────────────────────────────────────────────────────────────
const QUESTIONS = [
    {
        id: "genre",
        title: "شو نوع الألعاب اللي بتحبها؟",
        subtitle: "اختر اللي يشدّك أكتر — رح نختارلك لعبة عليها.",
        options: [
            { id: "action", label: "أكشن / مغامرات", emoji: "⚔️" },
            { id: "shooter", label: "ضرب نار (FPS)", emoji: "🎯" },
            { id: "sports", label: "رياضة", emoji: "⚽" },
            { id: "racing", label: "سباقات", emoji: "🏎️" },
            { id: "horror", label: "رعب", emoji: "👻" },
            { id: "rpg", label: "RPG ملحمي", emoji: "🐉" },
        ],
    },
    {
        id: "time",
        title: "كم تلعب باليوم؟",
        subtitle: "هذا يخلينا نختارلك خطة اشتراك تناسبك.",
        options: [
            { id: "casual", label: "ساعة أو ساعتين بالأسبوع", emoji: "☕" },
            { id: "regular", label: "ساعة باليوم تقريباً", emoji: "🎮" },
            { id: "heavy", label: "كل ما بفضى", emoji: "🔥" },
        ],
    },
    {
        id: "budget",
        title: "ميزانيتك المريحة؟",
        subtitle: "بنوصّيك على خيارات تناسب ميزانيتك.",
        options: [
            { id: "low", label: "أقل من ٢٠$ بالشهر", emoji: "💸" },
            { id: "mid", label: "٢٠$ - ٥٠$", emoji: "💰" },
            { id: "high", label: "٥٠$+ بدّي الأحسن", emoji: "👑" },
        ],
    },
];

// ──────────────────────────────────────────────────────────────────────────
// Recommendation engine
// ──────────────────────────────────────────────────────────────────────────
// Map genre answers to game IDs (ordered by recommendation strength)
const GENRE_TO_GAMES = {
    action: ["spiderman2", "rdr2", "gta5", "tlou2", "ghost-tsushima"],
    shooter: ["blackops7", "battlefield6", "blackops6", "ready-or-not"],
    sports: ["eafc26", "wwe26", "nba2k26"],
    racing: ["forza5", "crew-motorfest"],
    horror: ["re9", "re8", "re7", "tlou2"],
    rpg: ["elden-ring", "horizon-fw", "ghost-tsushima", "rdr2"],
};

const buildRecommendation = ({ genre, time, budget }, SUBSCRIPTIONS, GAMES) => {
    // Pick game from genre — prefer available + PS5 priced + best seller
    const candidates = (GENRE_TO_GAMES[genre] || GENRE_TO_GAMES.action)
        .map((id) => GAMES.find((g) => g.id === id))
        .filter(Boolean)
        .filter((g) => g.available !== false);

    const ranked = [...candidates].sort((a, b) => {
        const aHasPrice = a.five != null || a.four != null;
        const bHasPrice = b.five != null || b.four != null;
        if (aHasPrice !== bHasPrice) return aHasPrice ? -1 : 1;
        if ((b.bestSeller ? 1 : 0) !== (a.bestSeller ? 1 : 0)) {
            return (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0);
        }
        return 0;
    });
    const game = ranked[0] || candidates[0];
    const tier = game?.five != null ? "five" : "four";

    // Pick subscription based on time + budget
    let subId = "essential";
    let durationId = "ess-3m";
    if (time === "heavy" || genre === "shooter" || budget === "high") {
        subId = "extra";
        durationId = budget === "high" ? "ext-12m" : "ext-3m";
    } else if (time === "regular" && budget !== "low") {
        subId = "extra";
        durationId = "ext-3m";
    } else if (budget === "low") {
        subId = "essential";
        durationId = time === "casual" ? "ess-1m" : "ess-3m";
    } else {
        subId = "essential";
        durationId = "ess-12m";
    }

    const sub = SUBSCRIPTIONS.find((s) => s.id === subId);
    let dur = sub?.durations.find((d) => d.id === durationId);
    // Ensure availability on chosen tier
    if (!dur || dur[tier] == null) {
        dur = sub?.durations.find((d) => d[tier] != null);
    }

    const subPrice = dur?.[tier] ?? null;
    const gamePrice = game?.[tier] ?? null;

    // Reasoning text
    const reasons = [];
    if (genre === "shooter")
        reasons.push("اخترنا Extra لأنه يفتحلك مكتبة كاملة من ألعاب الـFPS الكبيرة");
    if (genre === "sports")
        reasons.push("اخترنا أحدث لعبة رياضة بأسعار مميزة");
    if (time === "heavy")
        reasons.push("لأنك بتلعب كثير، الاشتراك الإضافي بيوفّر عليك أكتر");
    if (time === "casual")
        reasons.push("لأنك بتلعب باعتدال، فترة قصيرة بتكفيك");
    if (budget === "low")
        reasons.push("اقترحنا الأرخص اللي يعطيك أساسيات اللعب");
    if (budget === "high")
        reasons.push("اخترنا الأطول مدّة لأنها الأوفر بالسنة");

    return { game, tier, sub, dur, subPrice, gamePrice, reasons };
};

// ──────────────────────────────────────────────────────────────────────────
// Modal
// ──────────────────────────────────────────────────────────────────────────
const RecommenderModal = ({ open, onClose }) => {
    const { add } = useCart();
    const { format } = useCurrency();
    const { subscriptions: SUBSCRIPTIONS, games: GAMES } = useStoreData();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [done, setDone] = useState(false);

    const reset = () => {
        setStep(0);
        setAnswers({});
        setDone(false);
    };

    const rec = useMemo(
        () => (done ? buildRecommendation(answers, SUBSCRIPTIONS, GAMES) : null),
        [done, answers, SUBSCRIPTIONS, GAMES],
    );

    if (!open) return null;

    const currentQ = QUESTIONS[step];
    const isLast = step === QUESTIONS.length - 1;

    const onChoose = (val) => {
        const next = { ...answers, [currentQ.id]: val };
        setAnswers(next);
        if (isLast) {
            setDone(true);
        } else {
            setStep(step + 1);
        }
    };

    const handleAddRec = () => {
        if (!rec) return;
        const { game, tier, sub, dur, subPrice, gamePrice } = rec;
        if (sub && dur && subPrice != null) {
            add({
                key: `rec-sub-${sub.id}-${dur.id}-${tier}-${Date.now()}`,
                type: "subscription",
                title: `${sub.name} — ${dur.label}`,
                subtitle: TIER_LABEL[tier],
                price: subPrice,
            });
        }
        if (game && gamePrice != null) {
            add({
                key: `rec-game-${game.id}-${tier}-${Date.now()}`,
                type: "game",
                title: game.name,
                subtitle: TIER_LABEL[tier],
                price: gamePrice,
            });
        }
        toast.success("تمت الإضافة للسلة 🎁", {
            description: "افتح السلة لمتابعة الطلب",
        });
        onClose();
    };

    return (
        <div
            data-testid="recommender-modal"
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-2xl max-h-[92vh] rounded-3xl bg-[hsl(var(--brand-cream))] shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-[hsl(var(--brand-ink))]/10 flex items-start justify-between gap-3 bg-white">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[hsl(var(--brand-red))] mb-1">
                            <Wand2 className="w-4 h-4" />
                            موصي شخصي
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-[hsl(var(--brand-ink))]">
                            شو تلعب؟
                        </h3>
                        <p className="text-xs sm:text-sm text-[hsl(var(--brand-ink))]/60 mt-1">
                            ٣ أسئلة سريعة، وبنوصّيك على الباقة المثالية.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        data-testid="recommender-close"
                        aria-label="إغلاق"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-[hsl(var(--brand-cream))] transition-colors text-[hsl(var(--brand-ink))]/70"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress */}
                {!done && (
                    <div className="px-5 sm:px-7 pt-4 bg-white border-b border-[hsl(var(--brand-ink))]/10">
                        <div className="flex items-center gap-1.5 mb-2">
                            {QUESTIONS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-1.5 rounded-full transition-colors ${
                                        i <= step
                                            ? "bg-[hsl(var(--brand-red))]"
                                            : "bg-[hsl(var(--brand-ink))]/10"
                                    }`}
                                />
                            ))}
                        </div>
                        <div className="text-[11px] text-[hsl(var(--brand-ink))]/55 pb-2">
                            سؤال {step + 1} من {QUESTIONS.length}
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6">
                    {!done ? (
                        <div key={step} className="quiz-fade">
                            <h4 className="text-lg sm:text-xl font-bold text-[hsl(var(--brand-ink))] mb-1">
                                {currentQ.title}
                            </h4>
                            <p className="text-sm text-[hsl(var(--brand-ink))]/60 mb-5">
                                {currentQ.subtitle}
                            </p>

                            <div className="grid sm:grid-cols-2 gap-2.5">
                                {currentQ.options.map((opt) => {
                                    const selected = answers[currentQ.id] === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => onChoose(opt.id)}
                                            data-testid={`recommender-${currentQ.id}-${opt.id}`}
                                            className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-right text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                                                selected
                                                    ? "bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] border-[hsl(var(--brand-ink))]"
                                                    : "bg-white border-[hsl(var(--brand-ink))]/12 text-[hsl(var(--brand-ink))] hover:border-[hsl(var(--brand-ink))]/40"
                                            }`}
                                        >
                                            <span className="text-2xl">
                                                {opt.emoji}
                                            </span>
                                            <span>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {step > 0 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    data-testid="recommender-back"
                                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--brand-ink))]/65 hover:text-[hsl(var(--brand-ink))]"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                    السؤال السابق
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="quiz-fade" data-testid="recommender-result">
                            <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand-red))] text-[hsl(var(--brand-cream))] px-4 py-1.5 text-[11px] font-extrabold mb-4">
                                <Sparkles className="w-3.5 h-3.5" />
                                توصيتك الشخصية
                            </div>
                            <h4 className="text-xl sm:text-2xl font-extrabold mb-2 text-[hsl(var(--brand-ink))]">
                                هاي الباقة المثالية إلك ⤵
                            </h4>

                            {rec && (
                                <div className="space-y-3 mt-5">
                                    {/* Subscription card */}
                                    {rec.sub && rec.dur && rec.subPrice != null && (
                                        <div className="rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 p-4 sm:p-5 flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-[10px] uppercase tracking-wider font-bold text-[hsl(var(--brand-blue-deep))]">
                                                    اشتراك
                                                </div>
                                                <div className="font-bold mt-0.5">
                                                    {rec.sub.name}
                                                </div>
                                                <div className="text-xs text-[hsl(var(--brand-ink))]/60">
                                                    {rec.dur.label} • {TIER_LABEL[rec.tier]}
                                                </div>
                                            </div>
                                            <div className="text-xl font-extrabold text-[hsl(var(--brand-red))]">
                                                {format(rec.subPrice)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Game card */}
                                    {rec.game && rec.gamePrice != null && (
                                        <Link
                                            to={`/game/${rec.game.id}`}
                                            onClick={onClose}
                                            data-testid="recommender-game-link"
                                            className="rounded-2xl bg-white border border-[hsl(var(--brand-ink))]/10 p-4 sm:p-5 flex items-center justify-between gap-3 hover:border-[hsl(var(--brand-ink))]/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className="w-14 h-14 rounded-xl shrink-0 overflow-hidden"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${rec.game.gradientFrom}, ${rec.game.gradientTo})`,
                                                    }}
                                                >
                                                    {rec.game.image && (
                                                        <img
                                                            src={rec.game.image}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[10px] uppercase tracking-wider font-bold text-[hsl(var(--brand-blue-deep))]">
                                                        لعبة موصى بها
                                                    </div>
                                                    <div
                                                        className="font-bold truncate"
                                                        dir="ltr"
                                                    >
                                                        {rec.game.name}
                                                    </div>
                                                    {GAME_DETAILS[rec.game.id]?.genre && (
                                                        <div className="text-xs text-[hsl(var(--brand-ink))]/60">
                                                            {GAME_DETAILS[rec.game.id].genre}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-xl font-extrabold text-[hsl(var(--brand-red))] shrink-0">
                                                {format(rec.gamePrice)}
                                            </div>
                                        </Link>
                                    )}

                                    {/* Reasoning */}
                                    {rec.reasons.length > 0 && (
                                        <ul className="space-y-1.5 mt-2">
                                            {rec.reasons.map((r, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-start gap-2 text-sm text-[hsl(var(--brand-ink))]/75"
                                                >
                                                    <Check className="w-4 h-4 mt-0.5 text-[#1a6e22] shrink-0" />
                                                    {r}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="grid sm:grid-cols-2 gap-3 mt-5">
                                        <button
                                            onClick={handleAddRec}
                                            data-testid="recommender-add-button"
                                            className="inline-flex items-center justify-center gap-2 rounded-full h-12 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] font-bold text-sm hover:bg-[hsl(var(--brand-blue-deep))] transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            أضف الباقة للسلة
                                        </button>
                                        <button
                                            onClick={reset}
                                            data-testid="recommender-restart"
                                            className="inline-flex items-center justify-center gap-2 rounded-full h-12 bg-white border-2 border-[hsl(var(--brand-ink))]/15 text-[hsl(var(--brand-ink))] font-bold text-sm hover:border-[hsl(var(--brand-ink))]/40 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            جرب مرة ثانية
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────
// Section + button
// ──────────────────────────────────────────────────────────────────────────
export const Recommender = () => {
    const [open, setOpen] = useState(false);
    return (
        <section
            id="recommender"
            data-testid="recommender-section"
            className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16"
        >
            <div className="rounded-3xl bg-gradient-to-br from-[hsl(var(--brand-red))] via-[#9a1a1a] to-[hsl(var(--brand-blue-deep))] text-[hsl(var(--brand-cream))] p-7 sm:p-10 lg:p-12 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-72 h-72 keffiyeh-pattern opacity-15" />
                <div className="absolute -bottom-16 -left-16 w-72 h-72 keffiyeh-pattern opacity-10" />
                <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] mb-3 opacity-85">
                            <Wand2 className="w-4 h-4" />
                            مساعدك الشخصي
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                            ما عرفت شو تلعب؟ خلّينا نوصّيك
                        </h2>
                        <p className="mt-3 text-base sm:text-lg opacity-85 leading-relaxed max-w-xl">
                            ٣ أسئلة سريعة عن ذوقك ووقتك وميزانيتك، ورح
                            نختارلك الباقة + اللعبة المثالية.
                        </p>
                    </div>
                    <button
                        onClick={() => setOpen(true)}
                        data-testid="open-recommender-button"
                        className="inline-flex items-center justify-center gap-2 rounded-full px-7 h-14 bg-[hsl(var(--brand-cream))] text-[hsl(var(--brand-ink))] text-base font-bold hover:bg-white transition-colors w-fit shadow-2xl"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        ابدأ الكويز
                    </button>
                </div>
            </div>

            <RecommenderModal open={open} onClose={() => setOpen(false)} />
        </section>
    );
};
