import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
    STORE as FALLBACK_STORE,
    SUBSCRIPTIONS as FALLBACK_SUBS,
    GAMES as FALLBACK_GAMES,
    BUNDLES as FALLBACK_BUNDLES,
} from "../data/products";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DataContext = createContext(null);

const FALLBACK_SECTIONS = [
    { id: "recommender",   label: "مساعدك الشخصي (Recommender)", visible: true },
    { id: "essential",     label: "الاشتراك الأساسي",            visible: true },
    { id: "extra",         label: "الاشتراك الإضافي",            visible: true },
    { id: "comparison",    label: "مقارنة الاشتراكات",           visible: true },
    { id: "bundles",       label: "الباقات المدمجة",             visible: true },
    { id: "bundleBuilder", label: "ابني باقتك",                  visible: true },
    { id: "games",         label: "الألعاب",                     visible: true },
    { id: "emailSignup",   label: "اشتراك للحصول على خصم",       visible: true },
    { id: "reviews",       label: "آراء العملاء",                visible: true },
    { id: "faq",           label: "الأسئلة الشائعة",             visible: true },
];

const FALLBACK_PROMO = {
    enabled: false,
    title: "",
    subtitle: "",
    endsAt: null,
    ctaLabel: "",
    ctaHref: "",
};

const FALLBACK_SOCIAL_PROOF = {
    enabled: true,
    intervalSeconds: 12,
    messages: [],
};

const FALLBACK_WA = {
    general: "السلام عليكم 👋\nأود الاستفسار عن منتجات متجر {storeName}.",
    productInquiry: "السلام عليكم 👋\nشفت {productName} في متجركم وأبغى أطلبه.\n\nهل لا يزال متوفر؟",
    orderHeader: "السلام عليكم 👋\nأرغب بطلب من متجر *{storeName}*:",
    orderFooter: "شكراً لكم 🌟",
};

const FALLBACK_REVIEWS = [
    { id: "rev-1", name: "جعفر", rating: 5, text: "تعامل ممتاز ومتجر موثوق 🙏", order: 0 },
    { id: "rev-2", name: "زيد", rating: 5, text: "ما شاء الله تعامل ممتاز 🔥", order: 1 },
];

const FALLBACK_FAQS = [
    { id: "delivery", icon: "truck", q: "كيف يتم تسليم الطلب؟", a: "يتم التسليم فوراً عبر الواتساب.", order: 0 },
];

const FALLBACK_CONTENT = {
    hero: {
        badge: "متجر موثوق • تسليم فوري",
        titleLine1: "كل ألعابك واشتراكاتك",
        titleLine2: "بضغطة زر.",
        subtitle: "اشتراكات PlayStation Plus وألعاب رقمية أصلية بأفضل الأسعار، مع تسليم فوري ودعم مباشر على واتساب.",
        ctaBrowse: "تصفّح المنتجات",
        ctaWhatsApp: "راسلنا على واتساب",
        benefitInstant: "تسليم فوري",
        benefitOriginal: "حسابات أصلية",
        benefitSupport: "دعم مباشر",
    },
    essential: {
        eyebrow: "الاشتراكات",
        title: "بلايستيشن بلس أساسي",
        description: "للاعب اللي بدو الأساسيات: ألعاب شهرية، أونلاين متعدد اللاعبين.",
        featureTitle: "ليش الاشتراك الأساسي؟",
        featureBullets: ["اللعب أونلاين مع أصدقائك", "ألعاب شهرية مجانية"],
    },
    extra: {
        eyebrow: "الاشتراكات",
        title: "بلايستيشن بلس إضافي",
        description: "مكتبة أوسع تتجاوز ٤٠٠ لعبة من Sony وشركاء آخرين، بسعر يستاهل.",
        featureTitle: "ليش الاشتراك الإضافي؟",
        featureBullets: ["مكتبة ضخمة (+400 لعبة)", "تجارب لعب مجانية", "كل ميزات الأساسي"],
    },
    comparison: {
        eyebrow: "مقارنة الباقات",
        title: "أساسي ولا إضافي؟ شو الفرق؟",
        description: "كل خطة لها نقاط قوتها — هاي مقارنة سريعة عشان تختار صح من أول مرة.",
        popularBadge: "الأكثر طلباً",
        essentialColLabel: "أساسي",
        extraColLabel: "إضافي",
        ctaStart: "جاهز تبدأ؟",
        ctaEssential: "اختر الأساسي",
        ctaExtra: "اختر الإضافي",
        rows: [
            { feature: "اللعب أونلاين", essential: true, extra: true },
            { feature: "مكتبة +400 لعبة", essential: false, extra: true },
        ],
    },
    bundles: {
        eyebrow: "باقات مدمجة",
        title: "خذ اشتراك + لعبة بسعر أقل",
        description: "وفّر أكثر مع باقاتنا الجاهزة.",
    },
    bundleBuilder: {
        eyebrow: "ابني باقتك",
        title: "اختار أنت، واحنا نخصملك",
        description: "ضمّ اشتراك + ألعاب، وكل ما زدت عنصر زاد الخصم تلقائياً.",
        discountsLabel: "نسب الخصم حسب الاشتراك والمدة",
        step1: "١) اختر جهازك",
        step1Hint: "السعر يتغير حسب الجهاز",
        step2: "٢) أضف اشتراك (اختياري)",
        step3: "٣) أضف ألعاب",
        summaryTitle: "ملخص باقتك",
        summaryEmpty: "لسه ما اخترت شي.",
        subtotal: "المجموع الفرعي",
        discountLabel: "خصم باقتك",
        totalLabel: "المجموع",
        hintNoSub: "💡 أضف اشتراك للحصول على خصم!",
        addAll: "أضف باقتك للسلة",
        addedAll: "أُضيفت!",
        reset: "ابدأ من جديد",
    },
    games: {
        eyebrow: "ألعاب رقمية",
        title: "أبرز الألعاب المتاحة",
        description: "اضغط على أي لعبة لرؤية تفاصيلها الكاملة.",
        customGameTitle: "لعبة محددة بدّك إياها؟",
        customGameSubtitle: "احكينا على واتساب.",
        customGameCta: "اطلب لعبة مخصصة",
    },
    reviews: {
        eyebrow: "آراء العملاء",
        title: "ثقة عملائنا أهم شي عنا.",
        description: "عملاء جربوا دُكانك.",
        ratingOutOf5: "من 5 نجوم",
        basedOn: "مبني على",
    },
    faq: {
        badge: "الأسئلة الشائعة",
        title: "أي استفسار عندك؟",
        description: "فريقنا متواجد ٢٤/٧ على واتساب لمساعدتك.",
    },
    emailSignup: {
        eyebrow: "اشترك بنشرتنا",
        title: "احصل على خصم 10% فوراً 🎁",
        description: "سجّل إيميلك واستلم كوبون خصم شخصي.",
        placeholder: "your-email@example.com",
        cta: "احصل على الكوبون",
        success: "تم! نسخت الكوبون لك.",
    },
    footer: {
        tagline: "متجرك الموثوق للاشتراكات والألعاب الرقمية.",
        linksTitle: "روابط سريعة",
        contactTitle: "تواصل معنا",
        copyright: "© دُكانك — كل الحقوق محفوظة.",
    },
};

export function DataProvider({ children }) {
    const [store, setStore] = useState(FALLBACK_STORE);
    const [subscriptions, setSubscriptions] = useState(FALLBACK_SUBS);
    const [games, setGames] = useState(FALLBACK_GAMES);
    const [bundles, setBundles] = useState(FALLBACK_BUNDLES);
    const [sections, setSections] = useState(FALLBACK_SECTIONS);
    const [promo, setPromo] = useState(FALLBACK_PROMO);
    const [socialProof, setSocialProof] = useState(FALLBACK_SOCIAL_PROOF);
    const [waTemplates, setWATemplates] = useState(FALLBACK_WA);
    const [reviews, setReviews] = useState(FALLBACK_REVIEWS);
    const [faqs, setFaqs] = useState(FALLBACK_FAQS);
    const [content, setContent] = useState(FALLBACK_CONTENT);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Deep-merge fetched content with fallback so any missing keys
    // still have a default value (prevents `content.x.y` being undefined).
    const mergeContent = (fetched) => {
        if (!fetched || typeof fetched !== "object") return FALLBACK_CONTENT;
        const out = {};
        for (const key of Object.keys(FALLBACK_CONTENT)) {
            const fb = FALLBACK_CONTENT[key];
            const fc = fetched[key];
            if (fc && typeof fc === "object" && !Array.isArray(fc)) {
                out[key] = { ...fb, ...fc };
            } else {
                out[key] = fc != null ? fc : fb;
            }
        }
        return out;
    };

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [s, subs, gms, bnds, secs, prom, sp, wat, rvs, fqs, cnt] = await Promise.all([
                axios.get(`${API}/store`),
                axios.get(`${API}/subscriptions`),
                axios.get(`${API}/games`),
                axios.get(`${API}/bundles`),
                axios.get(`${API}/sections`),
                axios.get(`${API}/promo`),
                axios.get(`${API}/social-proof`),
                axios.get(`${API}/wa-templates`),
                axios.get(`${API}/reviews`),
                axios.get(`${API}/faqs`),
                axios.get(`${API}/content`),
            ]);
            setStore(s.data);
            setSubscriptions(subs.data);
            setGames(gms.data);
            setBundles(bnds.data);
            setSections(secs.data || FALLBACK_SECTIONS);
            setPromo(prom.data || FALLBACK_PROMO);
            setSocialProof(sp.data || FALLBACK_SOCIAL_PROOF);
            setWATemplates(wat.data || FALLBACK_WA);
            setReviews(rvs.data && rvs.data.length ? rvs.data : FALLBACK_REVIEWS);
            setFaqs(fqs.data && fqs.data.length ? fqs.data : FALLBACK_FAQS);
            setContent(mergeContent(cnt.data));
            setError(null);
        } catch (e) {
            console.warn("DataProvider: API fetch failed, using fallback", e?.message);
            setError(e?.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return (
        <DataContext.Provider
            value={{
                store,
                subscriptions,
                games,
                bundles,
                sections,
                promo,
                socialProof,
                waTemplates,
                reviews,
                faqs,
                content,
                loading,
                error,
                reload: fetchAll,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useStoreData() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error("useStoreData must be used within DataProvider");
    return ctx;
}
