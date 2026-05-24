// Wishlist (Favorites) — pure localStorage, no auth required.
import { createContext, useContext, useEffect, useState, useCallback } from "react";

const WishlistContext = createContext(null);
const STORAGE_KEY = "dukkank_wishlist_v1";

function readLS() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export function WishlistProvider({ children }) {
    const [ids, setIds] = useState(readLS);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        } catch {}
    }, [ids]);

    const has = useCallback((id) => ids.includes(id), [ids]);
    const add = useCallback((id) => setIds((cur) => (cur.includes(id) ? cur : [id, ...cur])), []);
    const remove = useCallback((id) => setIds((cur) => cur.filter((x) => x !== id)), []);
    const toggle = useCallback((id) => {
        let nowAdded = false;
        setIds((cur) => {
            if (cur.includes(id)) {
                return cur.filter((x) => x !== id);
            }
            nowAdded = true;
            return [id, ...cur];
        });
        return nowAdded;
    }, []);
    const clear = useCallback(() => setIds([]), []);

    return (
        <WishlistContext.Provider value={{ ids, count: ids.length, has, add, remove, toggle, clear }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
    return ctx;
}
