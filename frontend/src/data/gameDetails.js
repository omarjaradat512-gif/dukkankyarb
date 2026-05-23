// ════════════════════════════════════════════════════════════════════════════
//  تفاصيل ألعاب موسّعة — تظهر في صفحة تفاصيل اللعبة
// ════════════════════════════════════════════════════════════════════════════
//  هذا الملف اختياري ⇐ أي لعبة بدون بيانات هنا، صفحتها بتظهر بشكل بسيط.
//  لإضافة لعبة جديدة: انسخ بلوك تحت بنفس مفتاح id من products.js وعدّل الحقول.
//
//  الحقول:
//   • description:  وصف عربي للعبة (نص طويل، 2-4 سطور)
//   • descEn:       وصف إنجليزي مختصر (اختياري)
//   • genre:        النوع — مثل "FPS"، "Sports"، "RPG"، "Action"
//   • players:      عدد اللاعبين — مثل "1 لاعب" أو "1-4 لاعبين أونلاين"
//   • online:       true/false ⇐ يدعم اللعب أونلاين
//   • offline:      true/false ⇐ يدعم اللعب أوفلاين
//   • size:         مساحة اللعبة — مثل "120 GB"
//   • rating:       تقييم من 10 — مثل 9.2
//   • trailer:      معرّف يوتيوب للتريلر (مثلاً "abc123XYZ")
//   • screenshots:  مصفوفة روابط لصور — تترك فاضية إذا ما عندك
//   • similar:      مصفوفة معرّفات ألعاب مشابهة من قائمة GAMES
// ════════════════════════════════════════════════════════════════════════════

export const GAME_DETAILS = {
    eafc26: {
        description:
            "أحدث إصدار من سلسلة كرة القدم الأشهر من EA Sports. ضمن EA Sports FC 26 رح تجد محرّك FC IQ المطور مع تكتيكات أذكى من المدربين، نظام Ultimate Team الكامل، Career Mode للاعب والمدرب، وآلاف اللاعبين الحقيقيين بحقوق رسمية من أهم الدوريات والأندية حول العالم.",
        descEn:
            "The latest EA Sports football experience with FC IQ engine, Ultimate Team, Career Mode, and authentic clubs.",
        genre: "Sports • Football",
        players: "1-22 لاعب (أونلاين)",
        online: true,
        offline: true,
        size: "55 GB",
        rating: 8.4,
        trailer: "fbWqRJZbXVw",
        similar: ["blackops7", "gta5", "blackops6"],
    },
    blackops7: {
        description:
            "النسخة الأحدث من سلسلة Call of Duty: Black Ops، تأتي مع حملة قصصية مكثفة، طور Multiplayer متطور وسريع، طور Zombies مرعب مع خرائط جديدة، وأسلحة وتشغيلات مستوحاة من الجيل الجديد. تجربة FPS لا تفوّت لمحبي الإثارة.",
        descEn:
            "The latest Black Ops with intense campaign, fast multiplayer, and chilling Zombies mode.",
        genre: "FPS • Action",
        players: "1-18 لاعب (أونلاين)",
        online: true,
        offline: true,
        size: "120 GB",
        rating: 8.7,
        trailer: "h8U9PqDe9CY",
        similar: ["blackops6", "battlefield6", "ready-or-not"],
    },
    blackops6: {
        description:
            "Black Ops 6 يجمع بين حملة قصصية مذهلة وتجربة Multiplayer كاملة مع طور Zombies الكلاسيكي. حركة جديدة Omnimovement تخليك تتحرك بكل الاتجاهات بسلاسة. الإصدار صنع جديد بالكامل من Treyarch.",
        descEn:
            "Black Ops 6 brings new Omnimovement system, intense campaign, classic MP and Zombies.",
        genre: "FPS • Action",
        players: "1-18 لاعب (أونلاين)",
        online: true,
        offline: true,
        size: "102 GB",
        rating: 8.5,
        trailer: "Q-ngVNa-Lr0",
        similar: ["blackops7", "battlefield6", "ready-or-not"],
    },
    battlefield6: {
        description:
            "تجربة حرب واسعة النطاق مع خرائط ضخمة، مركبات متنوعة، ودمار قابل للتفاعل بشكل واقعي. اشتباكات حتى 64 لاعب على PS5 مع إيقاع ملحمي ومخفّز.",
        descEn:
            "Large-scale war shooter with massive maps, vehicles, and destructible environments.",
        genre: "FPS • War",
        players: "حتى 64 لاعب (أونلاين)",
        online: true,
        offline: false,
        size: "90 GB",
        rating: 8.3,
        trailer: "p-DK9LkBKxQ",
        similar: ["blackops7", "blackops6", "ready-or-not"],
    },
    re9: {
        description:
            "Resident Evil Requiem — الفصل الجديد في سلسلة الرعب النفسي من كابكوم. شخصيات جديدة، أعداء أكثر رعباً، وتجربة أوحد وأظلم من سابقاتها. تشغيل بالكامل على محرك RE Engine بأعلى الجرافيكس.",
        descEn:
            "Capcom's latest psychological survival horror with darker tones and new monsters.",
        genre: "Survival Horror",
        players: "1 لاعب",
        online: false,
        offline: true,
        size: "50 GB",
        rating: 9.0,
        trailer: "AdPRoijoYZw",
        similar: ["re8", "re7", "tlou2"],
    },
    wwe26: {
        description:
            "WWE 2K26 — تجربة المصارعة الأشمل والأعمق على الإطلاق. روستر ضخم من النجوم الحاليين والأساطير، MyRise مع قصص متشعّبة، MyGM لإدارة العروض، وحلبات ومتاحف جديدة كلياً.",
        descEn:
            "Most complete WWE experience with huge roster, MyRise, MyGM, and new arenas.",
        genre: "Wrestling • Sports",
        players: "1-4 محلي / أونلاين",
        online: true,
        offline: true,
        size: "70 GB",
        rating: 8.2,
        trailer: "GHt28WjDVuI",
        similar: ["eafc26", "nba2k26", "gta5"],
    },
    gta5: {
        description:
            "Grand Theft Auto V — أحد أكثر ألعاب العالم المفتوح مبيعاً بالتاريخ. ٣ شخصيات قابلة للتبديل، قصة مليئة بالأكشن، خريطة Los Santos الضخمة، وGTA Online مع كل التوسعات الأخيرة.",
        descEn:
            "Open-world classic with 3 playable characters and the massive GTA Online experience.",
        genre: "Action • Open World",
        players: "1 لاعب / 32 أونلاين",
        online: true,
        offline: true,
        size: "95 GB",
        rating: 9.7,
        trailer: "QkkoHAzjnUs",
        similar: ["rdr2", "spiderman2", "tlou2"],
    },
    rdr2: {
        description:
            "Red Dead Redemption 2 — ملحمة الغرب الأمريكي من Rockstar. عالم مفتوح مذهل بالتفاصيل، قصة درامية عميقة عن آرثر مورغان وعصابة فان دير ليند، وأكواد مشاهد سينمائية تخليك تعيش الحقبة.",
        descEn:
            "Rockstar's western masterpiece with a deeply emotional story and breathtaking open world.",
        genre: "Action • Western",
        players: "1 لاعب / Online متاح",
        online: true,
        offline: true,
        size: "110 GB",
        rating: 9.7,
        trailer: "eaW0tYpxyp0",
        similar: ["gta5", "tlou2", "ghost-tsushima"],
    },
    spiderman2: {
        description:
            "Marvel's Spider-Man 2 (نسخة عربية مدبلجة) — لعب بـ Peter Parker و Miles Morales في قصة تجمع بطلَي مارفل ضد أخطر الأشرار في نيويورك. أكشن سلس وتنقل بالحبال أسرع، ومدينة مفتوحة بأكملها لاستكشافها.",
        descEn:
            "Play as Peter Parker & Miles Morales in this Arabic-dubbed Marvel adventure.",
        genre: "Action • Super Hero",
        players: "1 لاعب",
        online: false,
        offline: true,
        size: "98 GB",
        rating: 9.3,
        trailer: "1U2D3JemTHk",
        similar: ["gta5", "rdr2", "tlou2"],
    },
    forza5: {
        description:
            "Forza Horizon 5 — احتفال السباقات في المكسيك. أكثر من 800 سيارة، طقس ديناميكي، وفعاليات مستمرة كل أسبوع. القيادة تحس بها لذيذة سواء بأركيد أو شبه واقعي.",
        descEn:
            "Massive open-world racing in Mexico with 800+ cars and constant events.",
        genre: "Racing • Open World",
        players: "1 / 72 أونلاين",
        online: true,
        offline: true,
        size: "110 GB",
        rating: 9.0,
        trailer: "FYH9n37B7Yw",
        similar: ["crew-motorfest", "gta5", "rdr2"],
    },
    tlou2: {
        description:
            "The Last of Us Part II — تكملة الملحمة المؤثرة من Naughty Dog. قصة عميقة عن الانتقام والمسامحة في عالم ما بعد الكارثة، مع جرافيكس وأداء سينمائي يحبس الأنفاس.",
        descEn:
            "Naughty Dog's haunting sequel about revenge and forgiveness in a post-apocalyptic world.",
        genre: "Action • Survival",
        players: "1 لاعب",
        online: false,
        offline: true,
        size: "100 GB",
        rating: 9.5,
        trailer: "vhII1qlcZ4E",
        similar: ["tlou1", "rdr2", "spiderman2"],
    },
    "ready-or-not": {
        description:
            "Ready or Not — محاكاة شرطية تكتيكية حقيقية. كقائد فرقة SWAT، خطط لكل عملية بتدخل بدقّة. واقعية عالية بدون مبالغة سينمائية.",
        descEn: "A realistic tactical SWAT shooter with deep planning mechanics.",
        genre: "Tactical FPS",
        players: "1 / 5 تعاوني",
        online: true,
        offline: true,
        size: "45 GB",
        rating: 8.6,
        trailer: "5DC-eMtP_lY",
        similar: ["blackops7", "blackops6", "battlefield6"],
    },
    "ghost-tsushima": {
        description:
            "Ghost of Tsushima (نسخة عربية) — تجربة الساموراي الأشهر. قصة جين ساكاي في الدفاع عن جزيرة تسوشيما ضد الغزو المنغولي، بقتال سيوف رشيق وعالم ياباني خلاب.",
        descEn:
            "Acclaimed samurai adventure (Arabic) with stunning visuals and elegant combat.",
        genre: "Action • Samurai",
        players: "1 / Legends Online",
        online: true,
        offline: true,
        size: "75 GB",
        rating: 9.2,
        trailer: "iLkRzwHHaP8",
        similar: ["ghost-yotei", "rdr2", "spiderman2"],
    },
};
