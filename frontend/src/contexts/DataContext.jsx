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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [s, subs, gms, bnds, secs, prom, sp, wat, rvs, fqs] = await Promise.all([
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
