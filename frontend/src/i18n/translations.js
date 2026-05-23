// i18n dictionary — Arabic is the default, English is a toggle.
// Each key holds two strings: { ar, en }
//
// Components: import { useLang } from contexts/LanguageContext.
// Usage:      const { t } = useLang();  → t("cart")

const ar = {
    // Header / Nav
    "header.tagline": "متجر رقمي",
    "nav.essential": "أساسي",
    "nav.extra": "إضافي",
    "nav.games": "الألعاب",
    "nav.reviews": "التقييمات",
    "nav.faq": "الأسئلة",
    "cart": "السلة",
    "lang.toggle": "EN",
    "lang.fullToggle": "English",

    // Hero
    "hero.badge": "متجر موثوق • تسليم فوري",
    "hero.title.line1": "اشتراكاتك وألعابك",
    "hero.title.line2": "على بُعد رسالة واتساب.",
    "hero.subtitle": "تصفّح الكتالوج، اختر اللي يناسبك، وابعت طلبك مباشرة على واتساب.",
    "hero.cta.browse": "تصفّح المنتجات",
    "hero.cta.whatsapp": "راسلنا على واتساب",
    "hero.benefit.instant": "تسليم فوري",
    "hero.benefit.original": "حسابات أصلية",
    "hero.benefit.support": "دعم مباشر",

    // Ticker
    "ticker.instant": "تسليم فوري",
    "ticker.original": "حسابات أصلية",
    "ticker.support": "دعم على واتساب",
    "ticker.prices": "أسعار تنافسية",
    "ticker.updates": "تحديث مستمر للكتالوج",

    // Sections
    "section.subscriptions": "الاشتراكات",
    "section.essentialTitle": "بلايستيشن بلس أساسي",
    "section.essentialDesc": "للاعب اللي بدو الأساسيات: ألعاب شهرية، أونلاين متعدد اللاعبين.",
    "section.extraTitle": "بلايستيشن بلس إضافي",
    "section.extraDesc": "مكتبة أوسع تتجاوز ٤٠٠ لعبة من Sony وشركاء آخرين، بسعر يستاهل.",
    "section.gamesEyebrow": "ألعاب رقمية",
    "section.gamesTitle": "أبرز الألعاب المتاحة",
    "section.gamesDesc": "اضغط على أي لعبة لرؤية تفاصيلها الكاملة — تريلر، مواصفات، وألعاب مشابهة.",

    // Essential feature highlight
    "feature.essentialTitle": "ليش الاشتراك الأساسي؟",
    "feature.essential.b1": "اللعب أونلاين مع أصدقائك",
    "feature.essential.b2": "ألعاب شهرية مجانية",
    "feature.extraTitle": "ليش الاشتراك الإضافي؟",
    "feature.extra.b1": "مكتبة ضخمة من الألعاب الكبرى",
    "feature.extra.b2": "ألعاب PS4 و PS5 ضمن المكتبة",
    "feature.extra.b3": "تجارب لعب لاستخدام محدود",
    "feature.extra.b4": "كل مزايا الاشتراك الأساسي",

    // Custom game CTA
    "cta.customGameTitle": "لعبة محددة بدّك إياها وما لقيتها هون؟",
    "cta.customGameDesc": "احكينا على واتساب وراح نأمنّها لك بأفضل سعر.",
    "cta.customGameButton": "اطلب لعبة مخصصة",

    // Subscription / Game card
    "card.device": "نوع الجهاز",
    "card.duration": "المدة",
    "card.notAvailable": "غير متوفر",
    "card.price": "السعر",
    "card.add": "إضافة",
    "card.added": "أُضيف",
    "card.bestSeller": "الأكثر مبيعاً",
    "card.outOfStock": "غير متوفرة حالياً",
    "card.comingSoon": "قريباً",
    "card.priceSoon": "السعر قريباً",
    "card.unavailable": "غير متوفرة",
    "card.share": "مشاركة",
    "card.copied": "نُسخ",
    "card.mostRequested": "الأكثر طلباً",
    "card.basic": "الأساسي",
    "card.ps4Only": "PS4 فقط",
    "card.ps5Only": "PS5 فقط",

    // Toast
    "toast.addedToCart": "تمت الإضافة إلى السلة",
    "toast.gameAddedToCart": "تمت إضافة اللعبة إلى السلة",
    "toast.linkCopied": "تم نسخ رابط المنتج",
    "toast.linkCopiedDesc": "شاركه مع أصحابك على واتساب أو وسائل التواصل.",
    "toast.copyFailed": "ما قدرنا ننسخ الرابط، حاول مرة ثانية",

    // Footer
    "footer.about": "منتجات رقمية أصلية، توصيل فوري، ودعم مباشر على واتساب. الدفع يتم خارج الموقع بالاتفاق المباشر.",
    "footer.contact": "تواصل",
    "footer.whatsapp": "واتساب",
    "footer.instagram": "انستجرام",
    "footer.guarantees": "ضماناتنا",
    "footer.g1": "حسابات أصلية وموثوقة 100%",
    "footer.g2": "تسليم فوري بعد التأكيد",
    "footer.g3": "دعم متابعة بعد الشراء",
    "footer.copyright": "جميع الحقوق محفوظة.",
    "footer.madeWith": "صُنع بحب",

    // Cart drawer
    "cart.title": "سلة المشتريات",
    "cart.empty": "السلة فارغة",
    "cart.emptyDesc": "تصفّح الكتالوج وابدأ بالإضافة.",
    "cart.total": "الإجمالي",
    "cart.checkout": "تابع الطلب على واتساب",
    "cart.clear": "إفراغ السلة",
    "cart.remove": "إزالة",

    // FAQ / Reviews / Comparison labels
    "section.reviews": "آراء العملاء",
    "section.reviewsEyebrow": "تقييمات",
    "section.reviewsDesc": "كل تقييم محقق وموثوق من عملاء فعليين.",
    "section.faq": "الأسئلة الشائعة",
    "section.faqEyebrow": "الأسئلة",
    "section.faqDesc": "أجوبة سريعة لأكثر الأمور اللي يسألو عنها عملاؤنا.",
    "section.comparison": "مقارنة سريعة",
    "section.comparisonEyebrow": "أيهما أنسب لك؟",
    "section.comparisonDesc": "نقارن بين الأساسي والإضافي عشان تختار اللي يناسب طريقة لعبك.",

    // Bundles
    "section.bundles": "باقات مدمجة",
    "section.bundlesEyebrow": "وفّر أكثر",
    "section.bundlesDesc": "اشتراك + لعبة بسعر أوفر — جاهزة بضغطة زر.",
    "section.bundleBuilder": "اصنع باقتك الخاصة",
    "section.bundleBuilderEyebrow": "خصّص باقتك",
    "section.bundleBuilderDesc": "اختر اشتراكك ولعبتك المفضّلة وشوف خصمك مباشرة.",

    // Recommender
    "section.recommender": "خلّينا نوصّيك",
    "section.recommenderEyebrow": "مساعدك الشخصي",
    "section.recommenderDesc": "٣ أسئلة بسيطة عن ذوقك ووقتك وميزانيتك، ورح نختارلك الباقة + اللعبة المثالية.",
    "recommender.start": "ابدأ الكويز",

    // Savings calculator
    "section.savings": "كم رح توفّر؟",
    "section.savingsEyebrow": "حاسبة التوفير",
    "section.savingsDesc": "شوف الفرق بين شراء الألعاب منفصلة مقابل الاشتراك السنوي.",

    // Currency / Language toggle UI
    "currency.label": "العملة",

    // Admin
    "admin.login": "تسجيل دخول الأدمن",
    "admin.email": "الإيميل",
    "admin.password": "كلمة السر",
    "admin.signIn": "دخول",
    "admin.signOut": "تسجيل خروج",
    "admin.dashboard": "لوحة الإدارة",
    "admin.viewSite": "عرض الموقع",
    "admin.tab.store": "إعدادات المتجر",
    "admin.tab.subscriptions": "الاشتراكات",
    "admin.tab.games": "الألعاب",
    "admin.tab.bundles": "الباقات",
};

const en = {
    "header.tagline": "Digital Store",
    "nav.essential": "Essential",
    "nav.extra": "Extra",
    "nav.games": "Games",
    "nav.reviews": "Reviews",
    "nav.faq": "FAQ",
    "cart": "Cart",
    "lang.toggle": "ع",
    "lang.fullToggle": "العربية",

    "hero.badge": "Trusted store • Instant delivery",
    "hero.title.line1": "Your subscriptions & games,",
    "hero.title.line2": "just a WhatsApp message away.",
    "hero.subtitle": "Browse the catalog, pick what fits you, and send your order directly on WhatsApp.",
    "hero.cta.browse": "Browse Products",
    "hero.cta.whatsapp": "Message us on WhatsApp",
    "hero.benefit.instant": "Instant delivery",
    "hero.benefit.original": "Original accounts",
    "hero.benefit.support": "Direct support",

    "ticker.instant": "Instant delivery",
    "ticker.original": "Original accounts",
    "ticker.support": "WhatsApp support",
    "ticker.prices": "Competitive prices",
    "ticker.updates": "Continuously updated catalog",

    "section.subscriptions": "Subscriptions",
    "section.essentialTitle": "PlayStation Plus Essential",
    "section.essentialDesc": "For the player who wants the basics: monthly games and online multiplayer.",
    "section.extraTitle": "PlayStation Plus Extra",
    "section.extraDesc": "A wider library of 400+ games from Sony and partners, at a great price.",
    "section.gamesEyebrow": "Digital Games",
    "section.gamesTitle": "Top games available",
    "section.gamesDesc": "Tap any game to see its full details — trailer, specs, and similar titles.",

    "feature.essentialTitle": "Why Essential?",
    "feature.essential.b1": "Play online with your friends",
    "feature.essential.b2": "Free monthly games",
    "feature.extraTitle": "Why Extra?",
    "feature.extra.b1": "Massive library of top titles",
    "feature.extra.b2": "PS4 and PS5 games in one library",
    "feature.extra.b3": "Game trials for limited use",
    "feature.extra.b4": "Includes all Essential benefits",

    "cta.customGameTitle": "Looking for a specific game and can't find it here?",
    "cta.customGameDesc": "Message us on WhatsApp and we'll get it for you at the best price.",
    "cta.customGameButton": "Request a custom game",

    "card.device": "Console",
    "card.duration": "Duration",
    "card.notAvailable": "Not available",
    "card.price": "Price",
    "card.add": "Add",
    "card.added": "Added",
    "card.bestSeller": "Best Seller",
    "card.outOfStock": "Out of stock",
    "card.comingSoon": "Soon",
    "card.priceSoon": "Price soon",
    "card.unavailable": "Unavailable",
    "card.share": "Share",
    "card.copied": "Copied",
    "card.mostRequested": "Most popular",
    "card.basic": "Basic",
    "card.ps4Only": "PS4 only",
    "card.ps5Only": "PS5 only",

    "toast.addedToCart": "Added to cart",
    "toast.gameAddedToCart": "Game added to cart",
    "toast.linkCopied": "Product link copied",
    "toast.linkCopiedDesc": "Share it with your friends on WhatsApp or socials.",
    "toast.copyFailed": "Couldn't copy the link, please try again",

    "footer.about": "Original digital products, instant delivery, and direct WhatsApp support. Payment happens off-site via direct agreement.",
    "footer.contact": "Contact",
    "footer.whatsapp": "WhatsApp",
    "footer.instagram": "Instagram",
    "footer.guarantees": "Our Guarantees",
    "footer.g1": "100% original and verified accounts",
    "footer.g2": "Instant delivery after confirmation",
    "footer.g3": "Follow-up support after purchase",
    "footer.copyright": "All rights reserved.",
    "footer.madeWith": "Made with love",

    "cart.title": "Your Cart",
    "cart.empty": "Your cart is empty",
    "cart.emptyDesc": "Browse the catalog and start adding.",
    "cart.total": "Total",
    "cart.checkout": "Continue order on WhatsApp",
    "cart.clear": "Empty cart",
    "cart.remove": "Remove",

    "section.reviews": "Customer Reviews",
    "section.reviewsEyebrow": "Reviews",
    "section.reviewsDesc": "Every review is verified from real customers.",
    "section.faq": "Frequently Asked Questions",
    "section.faqEyebrow": "FAQ",
    "section.faqDesc": "Quick answers to the questions customers ask the most.",
    "section.comparison": "Quick comparison",
    "section.comparisonEyebrow": "Which one suits you?",
    "section.comparisonDesc": "We compare Essential vs Extra so you can pick what fits your style.",

    "section.bundles": "Combo Bundles",
    "section.bundlesEyebrow": "Save more",
    "section.bundlesDesc": "Subscription + game at a better price — one-click ready.",
    "section.bundleBuilder": "Build your own bundle",
    "section.bundleBuilderEyebrow": "Customize your bundle",
    "section.bundleBuilderDesc": "Pick your subscription and your favorite game, see your discount instantly.",

    "section.recommender": "Let us recommend",
    "section.recommenderEyebrow": "Your personal assistant",
    "section.recommenderDesc": "3 simple questions about your taste, time and budget — we'll pick the perfect plan + game for you.",
    "recommender.start": "Start the quiz",

    "section.savings": "How much will you save?",
    "section.savingsEyebrow": "Savings Calculator",
    "section.savingsDesc": "See the difference between buying games individually vs the yearly subscription.",

    "currency.label": "Currency",

    "admin.login": "Admin Login",
    "admin.email": "Email",
    "admin.password": "Password",
    "admin.signIn": "Sign in",
    "admin.signOut": "Sign out",
    "admin.dashboard": "Admin Dashboard",
    "admin.viewSite": "View Site",
    "admin.tab.store": "Store Settings",
    "admin.tab.subscriptions": "Subscriptions",
    "admin.tab.games": "Games",
    "admin.tab.bundles": "Bundles",
};

export const translations = { ar, en };
