import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LanguageContext";
import { formatApiError } from "../lib/api";
import { LogIn, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
    const { user, loading, login } = useAuth();
    const { t } = useLang();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!loading && user) {
            navigate("/admin", { replace: true });
        }
    }, [user, loading, navigate]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await login(email.trim(), password);
            navigate("/admin", { replace: true });
        } catch (err) {
            setError(formatApiError(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-5 py-12 bg-[hsl(var(--brand-cream))] grain-bg"
            data-testid="admin-login-page"
        >
            <div className="w-full max-w-md">
                <div className="card-elevated rounded-3xl bg-white border border-[hsl(var(--brand-ink))]/10 overflow-hidden">
                    <div className="bg-[hsl(var(--brand-blue-deep))] text-[hsl(var(--brand-cream))] px-7 py-6 text-center relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-32 h-32 keffiyeh-pattern opacity-20 rotate-12" />
                        <ShieldCheck className="w-10 h-10 mx-auto mb-2 relative" />
                        <h1 className="text-2xl font-bold relative">{t("admin.login")}</h1>
                        <p className="text-sm opacity-80 mt-1 relative">دُكانك • Admin</p>
                    </div>

                    <form onSubmit={onSubmit} className="p-7 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[hsl(var(--brand-ink))]/70 mb-1.5">
                                {t("admin.email")}
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                data-testid="admin-email-input"
                                autoComplete="username"
                                className="w-full h-11 rounded-xl border-2 border-[hsl(var(--brand-ink))]/15 bg-white px-4 text-sm font-medium focus:border-[hsl(var(--brand-blue-deep))] focus:outline-none"
                                placeholder="admin@dukkank.com"
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[hsl(var(--brand-ink))]/70 mb-1.5">
                                {t("admin.password")}
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                data-testid="admin-password-input"
                                autoComplete="current-password"
                                className="w-full h-11 rounded-xl border-2 border-[hsl(var(--brand-ink))]/15 bg-white px-4 text-sm font-medium focus:border-[hsl(var(--brand-blue-deep))] focus:outline-none"
                                dir="ltr"
                            />
                        </div>

                        {error && (
                            <div
                                data-testid="admin-login-error"
                                className="rounded-xl bg-[hsl(var(--brand-red))]/10 border border-[hsl(var(--brand-red))]/30 px-4 py-3 text-sm text-[hsl(var(--brand-red))] font-semibold"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            data-testid="admin-login-submit"
                            className="w-full inline-flex items-center justify-center gap-2 rounded-full h-12 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-bold hover:bg-[hsl(var(--brand-blue-deep))] transition-colors disabled:opacity-50"
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogIn className="w-4 h-4" />
                            )}
                            {t("admin.signIn")}
                        </button>

                        <a
                            href="/"
                            className="block text-center text-xs text-[hsl(var(--brand-ink))]/60 hover:text-[hsl(var(--brand-ink))] transition-colors"
                        >
                            ← {t("admin.viewSite")}
                        </a>
                    </form>
                </div>
            </div>
        </div>
    );
}
