import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * ThemeToggle — animated sun/moon switch.
 *
 * Props:
 *  - variant: "light" (default, for dark backgrounds like admin header) | "dark" (for light/cream backgrounds)
 *  - className: extra tailwind classes
 */
export function ThemeToggle({ variant = "dark", className = "" }) {
    const { isDark, toggle } = useTheme();

    const palette =
        variant === "light"
            ? "bg-white/10 hover:bg-white/20 text-white"
            : "bg-white dark:bg-white/[0.06] hover:bg-[hsl(var(--brand-cream-warm))] dark:hover:bg-white/[0.10] text-[hsl(var(--brand-ink))] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10";

    return (
        <button
            type="button"
            onClick={toggle}
            data-testid="theme-toggle"
            aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
            title={isDark ? "وضع فاتح" : "وضع داكن"}
            className={`relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all overflow-hidden ${palette} ${className}`}
        >
            {/* Sun */}
            <Sun
                className={`absolute w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-500 ${
                    isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                }`}
            />
            {/* Moon */}
            <Moon
                className={`absolute w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-500 ${
                    isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                }`}
            />
        </button>
    );
}
