import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useStoreData } from "../contexts/DataContext";
import { useLang } from "../contexts/LanguageContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { LogOut, ExternalLink, Loader2 } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import StoreSettingsTab from "../components/admin/StoreSettingsTab";
import SubscriptionsTab from "../components/admin/SubscriptionsTab";
import GamesTab from "../components/admin/GamesTab";
import BundlesTab from "../components/admin/BundlesTab";
import SectionsTab from "../components/admin/SectionsTab";
import MarketingTab from "../components/admin/MarketingTab";
import AuditTab from "../components/admin/AuditTab";
import ReviewsTab from "../components/admin/ReviewsTab";
import FaqTab from "../components/admin/FaqTab";
import AccountTab from "../components/admin/AccountTab";
import NotifyTab from "../components/admin/NotifyTab";
import AnalyticsTab from "../components/admin/AnalyticsTab";
import ContentTab from "../components/admin/ContentTab";

const TABS = [
    { value: "analytics",     label: "الإحصائيات" },
    { value: "content",       label: "محتوى الموقع" },
    { value: "store",         label: "إعدادات المتجر" },
    { value: "sections",      label: "ترتيب الأقسام" },
    { value: "subscriptions", label: "الاشتراكات" },
    { value: "games",         label: "الألعاب" },
    { value: "bundles",       label: "الباقات" },
    { value: "reviews",       label: "التقييمات" },
    { value: "faqs",          label: "الأسئلة الشائعة" },
    { value: "marketing",     label: "التسويق" },
    { value: "notify",        label: "طلبات الإشعار" },
    { value: "audit",         label: "سجل التدقيق" },
    { value: "account",       label: "الحساب" },
];

export default function AdminDashboard() {
    const { user, loading, logout } = useAuth();
    const { t } = useLang();
    const { reload } = useStoreData();
    const navigate = useNavigate();
    const [tab, setTab] = useState("analytics");

    useEffect(() => {
        if (!loading && !user) {
            navigate("/admin/login", { replace: true });
        }
    }, [user, loading, navigate]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--brand-cream))]">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--brand-blue-deep))]" />
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        navigate("/admin/login", { replace: true });
    };

    return (
        <div
            className="min-h-screen bg-[hsl(var(--brand-cream))] grain-bg"
            data-testid="admin-dashboard"
        >
            {/* Top bar */}
            <header className="sticky top-0 z-30 bg-[hsl(var(--brand-blue-deep))] text-[hsl(var(--brand-cream))] border-b border-black/20 shadow-md">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="logo"
                            className="w-9 h-9 rounded-xl ring-2 ring-white/20"
                        />
                        <div>
                            <div className="text-base sm:text-lg font-bold leading-none">
                                {t("admin.dashboard")}
                            </div>
                            <div className="text-[11px] opacity-70 mt-0.5">
                                {user.email}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle variant="light" />
                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="admin-view-site"
                            className="inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 h-9 bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">{t("admin.viewSite")}</span>
                        </a>
                        <button
                            onClick={handleLogout}
                            data-testid="admin-logout"
                            className="inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 h-9 bg-[hsl(var(--brand-red))] hover:bg-[hsl(var(--brand-red))]/85 text-xs sm:text-sm font-semibold transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">{t("admin.signOut")}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-3 sm:px-8 py-6 sm:py-10">
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <TabsList
                        data-testid="admin-tabs"
                        className="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1 bg-white/70 dark:bg-white/[0.06] border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 rounded-2xl p-1 h-auto"
                    >
                        {TABS.map((tb) => (
                            <TabsTrigger
                                key={tb.value}
                                value={tb.value}
                                data-testid={`tab-${tb.value}`}
                                className="data-[state=active]:bg-[hsl(var(--brand-ink))] data-[state=active]:text-[hsl(var(--brand-cream))] rounded-xl py-2.5 font-bold text-xs sm:text-sm"
                            >
                                {tb.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="store" className="mt-6">
                        <StoreSettingsTab onSaved={reload} />
                    </TabsContent>
                    <TabsContent value="analytics" className="mt-6">
                        <AnalyticsTab />
                    </TabsContent>
                    <TabsContent value="content" className="mt-6">
                        <ContentTab onChanged={reload} />
                    </TabsContent>
                    <TabsContent value="notify" className="mt-6">
                        <NotifyTab />
                    </TabsContent>
                    <TabsContent value="sections" className="mt-6">
                        <SectionsTab onChanged={reload} />
                    </TabsContent>
                    <TabsContent value="subscriptions" className="mt-6">
                        <SubscriptionsTab onChanged={reload} />
                    </TabsContent>
                    <TabsContent value="games" className="mt-6">
                        <GamesTab onChanged={reload} />
                    </TabsContent>
                    <TabsContent value="bundles" className="mt-6">
                        <BundlesTab onChanged={reload} />
                    </TabsContent>
                    <TabsContent value="reviews" className="mt-6">
                        <ReviewsTab onChanged={reload} />
                    </TabsContent>
                    <TabsContent value="faqs" className="mt-6">
                        <FaqTab onChanged={reload} />
                    </TabsContent>
                    <TabsContent value="marketing" className="mt-6">
                        <MarketingTab onChanged={reload} />
                    </TabsContent>
                    <TabsContent value="audit" className="mt-6">
                        <AuditTab />
                    </TabsContent>
                    <TabsContent value="account" className="mt-6">
                        <AccountTab />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
