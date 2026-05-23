import { useEffect, useRef, useState } from "react";
import { useStoreData } from "../contexts/DataContext";
import { ShoppingBag, X, BadgeCheck } from "lucide-react";

// Floating social-proof toast.
// Rotates messages every `intervalSeconds`; shows for ~6s then hides for the
// remainder of the cycle. Closeable per session.
export const SocialProofToast = () => {
    const { socialProof } = useStoreData();
    const [idx, setIdx] = useState(0);
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const timersRef = useRef([]);

    const messages = socialProof?.messages || [];
    const enabled = socialProof?.enabled !== false && messages.length > 0;
    const interval = Math.max(6, Number(socialProof?.intervalSeconds) || 12);

    useEffect(() => {
        try {
            if (sessionStorage.getItem("sp_dismissed_v1") === "1") {
                setDismissed(true);
            }
        } catch {}
    }, []);

    useEffect(() => {
        if (!enabled || dismissed) return;
        const clearAll = () => {
            timersRef.current.forEach((t) => clearTimeout(t));
            timersRef.current = [];
        };
        const cycle = () => {
            setVisible(true);
            const hideTimer = setTimeout(() => setVisible(false), 6000);
            const nextTimer = setTimeout(() => {
                setIdx((i) => (i + 1) % messages.length);
                cycle();
            }, interval * 1000);
            timersRef.current.push(hideTimer, nextTimer);
        };
        const startTimer = setTimeout(cycle, 3500);
        timersRef.current.push(startTimer);
        return clearAll;
    }, [enabled, dismissed, interval, messages.length]);

    if (!enabled || dismissed) return null;

    const text = messages[idx] || messages[0] || "";

    return (
        <div
            data-testid="social-proof-toast"
            className={`fixed bottom-24 left-4 sm:left-6 z-30 transition-all duration-500 pointer-events-none ${
                visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3 pointer-events-none"
            }`}
        >
            <div
                dir="rtl"
                className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white shadow-2xl border border-[hsl(var(--brand-ink))]/10 pl-3 pr-4 py-2.5 max-w-[88vw] sm:max-w-md"
            >
                <span className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#25D366]/15 text-[#1DA851]">
                    <ShoppingBag className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-[hsl(var(--brand-blue-deep))] flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" />
                        طلب جديد
                    </div>
                    <div className="text-sm font-medium text-[hsl(var(--brand-ink))] truncate">
                        {text}
                    </div>
                </div>
                <button
                    onClick={() => {
                        setDismissed(true);
                        try {
                            sessionStorage.setItem("sp_dismissed_v1", "1");
                        } catch {}
                    }}
                    aria-label="إغلاق"
                    data-testid="social-proof-close"
                    className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-[hsl(var(--brand-ink))]/45 hover:text-[hsl(var(--brand-ink))]"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};
