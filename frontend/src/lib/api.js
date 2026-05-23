import axios from "axios";

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "dukkank_admin_token";

export const getToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
        return null;
    }
};
export const setToken = (t) => {
    try {
        if (t) localStorage.setItem(TOKEN_KEY, t);
        else localStorage.removeItem(TOKEN_KEY);
    } catch {}
};

const client = axios.create({ baseURL: BASE });

client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Public
export const apiGetStore = () => client.get("/store").then((r) => r.data);
export const apiGetSubscriptions = () => client.get("/subscriptions").then((r) => r.data);
export const apiGetGames = () => client.get("/games").then((r) => r.data);
export const apiGetBundles = () => client.get("/bundles").then((r) => r.data);

// Auth
export const apiLogin = (email, password) =>
    client.post("/auth/login", { email, password }).then((r) => r.data);
export const apiMe = () => client.get("/auth/me").then((r) => r.data);

// Admin: Store
export const apiUpdateStore = (data) => client.put("/admin/store", data).then((r) => r.data);

// Admin: Sections
export const apiGetSections = () => client.get("/sections").then((r) => r.data);
export const apiUpdateSections = (sections) =>
    client.put("/admin/sections", { sections }).then((r) => r.data);

// Promo banner
export const apiGetPromo = () => client.get("/promo").then((r) => r.data);
export const apiUpdatePromo = (data) => client.put("/admin/promo", data).then((r) => r.data);

// Social proof
export const apiGetSocialProof = () => client.get("/social-proof").then((r) => r.data);
export const apiUpdateSocialProof = (data) =>
    client.put("/admin/social-proof", data).then((r) => r.data);

// WhatsApp templates
export const apiGetWATemplates = () => client.get("/wa-templates").then((r) => r.data);
export const apiUpdateWATemplates = (data) =>
    client.put("/admin/wa-templates", data).then((r) => r.data);

// Subscribers
export const apiSubscribe = (email) => client.post("/subscribers", { email }).then((r) => r.data);
export const apiListSubscribers = () => client.get("/admin/subscribers").then((r) => r.data);
export const apiDeleteSubscriber = (email) =>
    client.delete(`/admin/subscribers/${encodeURIComponent(email)}`).then((r) => r.data);

// Audit log
export const apiListAudit = (limit = 100) =>
    client.get(`/admin/audit?limit=${limit}`).then((r) => r.data);

// Image upload
export const apiUploadImage = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await client.post("/admin/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

// Admin: Subscriptions
export const apiCreateSubscription = (data) => client.post("/admin/subscriptions", data).then((r) => r.data);
export const apiUpdateSubscription = (id, data) => client.put(`/admin/subscriptions/${id}`, data).then((r) => r.data);
export const apiDeleteSubscription = (id) => client.delete(`/admin/subscriptions/${id}`).then((r) => r.data);

// Admin: Games
export const apiCreateGame = (data) => client.post("/admin/games", data).then((r) => r.data);
export const apiUpdateGame = (id, data) => client.put(`/admin/games/${id}`, data).then((r) => r.data);
export const apiDeleteGame = (id) => client.delete(`/admin/games/${id}`).then((r) => r.data);

// Admin: Bundles
export const apiCreateBundle = (data) => client.post("/admin/bundles", data).then((r) => r.data);
export const apiUpdateBundle = (id, data) => client.put(`/admin/bundles/${id}`, data).then((r) => r.data);
export const apiDeleteBundle = (id) => client.delete(`/admin/bundles/${id}`).then((r) => r.data);

export function formatApiError(err) {
    const d = err?.response?.data?.detail;
    if (d == null) return err?.message || "Something went wrong";
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((e) => e.msg || JSON.stringify(e)).join(" ");
    if (d && typeof d.msg === "string") return d.msg;
    return JSON.stringify(d);
}
