/**
 * generate-banners.js
 * Generates stunning 1280x640 promotional hero banners for all 10 supported languages,
 * embedding the authentic NexusAG.png logo and rendering pixel-perfect PNGs via headless Edge.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'NexusAG_1.1.png');
const BANNERS_DIR = path.join(__dirname, '..', 'assets', 'banners');

if (!fs.existsSync(BANNERS_DIR)) {
    fs.mkdirSync(BANNERS_DIR, { recursive: true });
}

// Convert logo to Base64
const logoBase64 = fs.readFileSync(LOGO_PATH).toString('base64');
const logoDataUri = `data:image/png;base64,${logoBase64}`;

const LOCALES = [
    {
        code: 'en',
        name: 'English',
        flag: '🇺🇸',
        tagline: 'The Next-Generation Control Panel for Antigravity IDE',
        subtitle: 'Instant Account Switching · Live Quota Gauges · Context Intelligence · Deep Token Analytics',
        badge1: '⚡ Multi-Account Switchboard',
        badge2: '📊 Live AI Quotas',
        badge3: '🧠 Context Window Tree',
        badge4: '🛡️ Conversation Guard',
        accountTitle: 'Active Account',
        quotaLabel: 'Quota Capacity',
        tokenLabel: 'Total Tokens',
        analyticsLabel: 'Analytics Heatmap',
        langPill: '10 Languages · Instant Reactive Switching · 100% Coverage',
    },
    {
        code: 'tr',
        name: 'Türkçe',
        flag: '🇹🇷',
        tagline: 'Antigravity IDE İçin Yeni Nesil Kontrol Paneli',
        subtitle: 'Anında Hesap Değiştirme · Canlı Kota Göstergeleri · Bağlam Zekası · Derin Token Analitiği',
        badge1: '⚡ Çoklu Hesap Panosu',
        badge2: '📊 Canlı AI Kotaları',
        badge3: '🧠 Bağlam Penceresi Ağacı',
        badge4: '🛡️ Konuşma Kurtarma',
        accountTitle: 'Aktif Hesap',
        quotaLabel: 'Kota Kapasitesi',
        tokenLabel: 'Toplam Token',
        analyticsLabel: 'Etkinlik Haritası',
        langPill: '10 Dil Desteği · Anlık Reaktif Geçiş · %100 Kapsam',
    },
    {
        code: 'pt-BR',
        name: 'Português',
        flag: '🇧🇷',
        tagline: 'Painel de Controle de Próxima Geração para o Antigravity IDE',
        subtitle: 'Troca Instantânea de Contas · Cotas em Tempo Real · Inteligência de Contexto · Métricas de Tokens',
        badge1: '⚡ Alternador de Contas',
        badge2: '📊 Cotas em Tempo Real',
        badge3: '🧠 Árvore de Contexto',
        badge4: '🛡️ Guardião de Conversas',
        accountTitle: 'Conta Ativa',
        quotaLabel: 'Capacidade de Cotas',
        tokenLabel: 'Total de Tokens',
        analyticsLabel: 'Mapa de Atividades',
        langPill: '10 Idiomas · Troca Reativa Instantânea · 100% de Cobertura',
    },
    {
        code: 'es',
        name: 'Español',
        flag: '🇪🇸',
        tagline: 'Panel de Control de Próxima Generación para Antigravity IDE',
        subtitle: 'Cambio Instantáneo de Cuentas · Cuotas en Tiempo Real · Inteligencia de Contexto · Análisis Profundo',
        badge1: '⚡ Selector Multicuenta',
        badge2: '📊 Cuotas en Tiempo Real',
        badge3: '🧠 Árbol de Contexto',
        badge4: '🛡️ Guardián de Conversaciones',
        accountTitle: 'Cuenta Activa',
        quotaLabel: 'Capacidad de Cuotas',
        tokenLabel: 'Total de Tokens',
        analyticsLabel: 'Mapa de Actividad',
        langPill: '10 Idiomas · Cambio Reactivo Instantáneo · 100% de Cobertura',
    },
    {
        code: 'de',
        name: 'Deutsch',
        flag: '🇩🇪',
        tagline: 'Das Kontrollzentrum der nächsten Generation für die Antigravity IDE',
        subtitle: 'Sofortiger Kontowechsel · Echtzeit-Quoten · Kontext-Intelligenz · Detaillierte Token-Analysen',
        badge1: '⚡ Multi-Account Switch',
        badge2: '📊 Echtzeit-Quoten',
        badge3: '🧠 Kontext-Fenster-Baum',
        badge4: '🛡️ Konversations-Schutz',
        accountTitle: 'Aktives Konto',
        quotaLabel: 'Quoten-Kapazität',
        tokenLabel: 'Gesamte Tokens',
        analyticsLabel: 'Aktivitäts-Heatmap',
        langPill: '10 Sprachen · Sofortige Reaktive Umschaltung · 100% Abdeckung',
    },
    {
        code: 'fr',
        name: 'Français',
        flag: '🇫🇷',
        tagline: 'Tableau de bord nouvelle génération pour l\'IDE Antigravity',
        subtitle: 'Changement de compte instantané · Quotas en temps réel · Analyse du contexte · Statistiques détaillées',
        badge1: '⚡ Sélecteur Multi-comptes',
        badge2: '📊 Quotas en direct',
        badge3: '🧠 Arborescence de contexte',
        badge4: '🛡️ Garde de conversation',
        accountTitle: 'Compte actif',
        quotaLabel: 'Capacité de quota',
        tokenLabel: 'Total des tokens',
        analyticsLabel: 'Carte d\'activité',
        langPill: '10 Langues · Basculement Réactif Instantané · Couverture 100%',
    },
    {
        code: 'ja',
        name: '日本語',
        flag: '🇯🇵',
        tagline: 'Antigravity IDE のための次世代コントロールパネル',
        subtitle: '瞬時アカウント切り替え · リアルタイム利用枠監視 · コンテキスト詳細分析 · トークン使用統計',
        badge1: '⚡ アカウント即時切替',
        badge2: '📊 リアルタイム利用枠',
        badge3: '🧠 コンテキスト詳細ツリー',
        badge4: '🛡️ 会話履歴復元ガード',
        accountTitle: 'アクティブアカウント',
        quotaLabel: '利用枠キャパシティ',
        tokenLabel: '合計トークン数',
        analyticsLabel: 'アクティビティヒートマップ',
        langPill: '10言語対応 · 即時リアクティブ切替 · 100%完全ローカライズ',
    },
    {
        code: 'zh-CN',
        name: '简体中文',
        flag: '🇨🇳',
        tagline: 'Antigravity IDE 新一代多账户智能控制中心',
        subtitle: '即时多账户切换 · 实时模型配额监控 · 上下文深度解析 · 全局 Token 消耗分析',
        badge1: '⚡ 一键账户切换',
        badge2: '📊 实时模型配额',
        badge3: '🧠 上下文分级树状图',
        badge4: '🛡️ 会话守护与恢复',
        accountTitle: '当前活跃账户',
        quotaLabel: '配额剩余率',
        tokenLabel: '总计 Token',
        analyticsLabel: '活跃度热力图',
        langPill: '10 种语言原生支持 · 即时无刷新响应 · 100% 全量覆盖',
    },
    {
        code: 'hi',
        name: 'हिन्दी',
        flag: '🇮🇳',
        tagline: 'Antigravity IDE के लिए अगली पीढ़ी का कंट्रोल पैनल',
        subtitle: 'त्वरित खाता स्विचिंग · रीयल-टाइम कोटा मॉनिटरिंग · कॉन्टेक्स्ट इंटेलिजेंस · डीप टोकन एनालिटिक्स',
        badge1: '⚡ मल्टी-अकाउंट स्विचबोर्ड',
        badge2: '📊 रीयल-टाइम एआई कोटा',
        badge3: '🧠 कॉन्टेक्स्ट विंडो ट्री',
        badge4: '🛡️ कन्वर्सेशन गार्ड',
        accountTitle: 'सक्रिय खाता',
        quotaLabel: 'कोटा क्षमता',
        tokenLabel: 'कुल टोकन',
        analyticsLabel: 'एक्टिविटी हीटमैप',
        langPill: '10 भाषाएं · त्वरित प्रतिक्रियाशील स्विचिंग · 100% कवरेज',
    },
    {
        code: 'ru',
        name: 'Русский',
        flag: '🇷🇺',
        tagline: 'Панель управления нового поколения для Antigravity IDE',
        subtitle: 'Мгновенное переключение аккаунтов · Мониторинг квот в реальном времени · Аналитика контекста',
        badge1: '⚡ Мульти-аккаунты',
        badge2: '📊 Квоты в реальном времени',
        badge3: '🧠 Дерево контекста',
        badge4: '🛡️ Восстановление диалогов',
        accountTitle: 'Активный аккаунт',
        quotaLabel: 'Остаток квот',
        tokenLabel: 'Всего токенов',
        analyticsLabel: 'Карта активности',
        langPill: '10 Языков · Мгновенное Переключение · 100% Локализация',
    },
];

function generateBannerHtml(loc) {
    return `<!DOCTYPE html>
<html lang="${loc.code}">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    width: 1280px;
    height: 640px;
    background: #020617;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #f8fafc;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 38px 48px 30px;
}
/* Cybernetic ambient backgrounds */
.bg-ambient {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 0;
    background:
        radial-gradient(circle at 18% 15%, rgba(124, 58, 237, 0.28) 0%, transparent 45%),
        radial-gradient(circle at 82% 20%, rgba(6, 182, 212, 0.22) 0%, transparent 40%),
        radial-gradient(circle at 50% 85%, rgba(16, 185, 129, 0.15) 0%, transparent 50%);
}
.bg-grid {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 32px 32px;
    z-index: 1;
}

/* Header section */
.header-row {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.brand-group {
    display: flex;
    align-items: center;
    gap: 18px;
}
.brand-logo-img {
    width: 64px;
    height: 64px;
    object-fit: contain;
    filter: drop-shadow(0 0 16px rgba(124, 58, 237, 0.65));
}
.brand-text-block {
    display: flex;
    flex-direction: column;
}
.brand-title {
    font-size: 38px;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1;
    display: flex;
    align-items: center;
    gap: 3px;
}
.brand-nexus {
    color: #ffffff;
    text-shadow: 0 0 20px rgba(255,255,255,0.3);
}
.brand-ag {
    background: linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.brand-subtitle-badge {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #94a3b8;
    margin-top: 4px;
    font-weight: 600;
}
.version-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.2);
    backdrop-filter: blur(8px);
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 13px;
    color: #cbd5e1;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.version-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
}

/* Hero Title Section */
.hero-content {
    position: relative;
    z-index: 2;
    margin-top: 8px;
}
.hero-tagline {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.6px;
    line-height: 1.25;
    background: linear-gradient(135deg, #ffffff 30%, #e2e8f0 70%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    max-width: 1000px;
}
.hero-sub {
    font-size: 16px;
    color: #94a3b8;
    margin-top: 8px;
    font-weight: 400;
    line-height: 1.5;
    max-width: 1100px;
}

/* Feature badges */
.badges-row {
    position: relative;
    z-index: 2;
    display: flex;
    gap: 12px;
    margin-top: 14px;
}
.f-badge {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(124, 58, 237, 0.3);
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 13px;
    color: #e2e8f0;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

/* Cards Showcase Preview */
.cards-showcase {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-top: 16px;
}
.sc-card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px 18px;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
    position: relative;
    overflow: hidden;
}
.sc-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #7c3aed, #06b6d4);
}
.sc-card-hdr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #94a3b8;
    font-weight: 700;
    margin-bottom: 10px;
}
.sc-card-val {
    font-size: 24px;
    font-weight: 800;
    color: #ffffff;
    display: flex;
    align-items: baseline;
    gap: 6px;
}
.sc-card-subval {
    font-size: 12px;
    color: #10b981;
    font-weight: 600;
}
.sc-bars {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.sc-bar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: #cbd5e1;
}
.sc-prog-track {
    width: 100%;
    height: 6px;
    background: rgba(255,255,255,0.08);
    border-radius: 999px;
    margin-top: 3px;
    overflow: hidden;
    display: flex;
}
.sc-prog-fill-violet { background: #8b5cf6; }
.sc-prog-fill-cyan { background: #06b6d4; }
.sc-prog-fill-green { background: #10b981; }

.heatmap-mini {
    display: grid;
    grid-template-columns: repeat(16, 1fr);
    gap: 3px;
    margin-top: 10px;
}
.hm-cell {
    height: 10px;
    border-radius: 2px;
    background: rgba(255,255,255,0.05);
}
.hm-1 { background: rgba(16, 185, 129, 0.3); }
.hm-2 { background: rgba(16, 185, 129, 0.55); }
.hm-3 { background: rgba(16, 185, 129, 0.85); }
.hm-4 { background: #10b981; }

/* Bottom Footer */
.footer-row {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.footer-lang-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #38bdf8;
    font-weight: 600;
}
.footer-platforms {
    display: flex;
    gap: 14px;
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
}
</style>
</head>
<body>
<div class="bg-ambient"></div>
<div class="bg-grid"></div>

<!-- Top Header -->
<div class="header-row">
    <div class="brand-group">
        <img class="brand-logo-img" src="${logoDataUri}" alt="NexusAG Logo" />
        <div class="brand-text-block">
            <div class="brand-title">
                <span class="brand-nexus">Nexus</span><span class="brand-ag">AG</span>
            </div>
            <div class="brand-subtitle-badge">ANTIGRAVITY IDE ECOSYSTEM</div>
        </div>
    </div>
    <div class="version-pill">
        <span class="version-dot"></span>
        <span>v1.1.0 • Stable Release</span>
        <span>${loc.flag}</span>
    </div>
</div>

<!-- Main Hero Headline -->
<div class="hero-content">
    <div class="hero-tagline">${loc.tagline}</div>
    <div class="hero-sub">${loc.subtitle}</div>
</div>

<!-- Badges -->
<div class="badges-row">
    <div class="f-badge">${loc.badge1}</div>
    <div class="f-badge">${loc.badge2}</div>
    <div class="f-badge">${loc.badge3}</div>
    <div class="f-badge">${loc.badge4}</div>
</div>

<!-- Showcase Cards -->
<div class="cards-showcase">
    <!-- Card 1: Multi-Account & Live Quotas -->
    <div class="sc-card">
        <div class="sc-card-hdr">
            <span>${loc.accountTitle}</span>
            <span style="color:#10b981;">● ACTIVE</span>
        </div>
        <div class="sc-card-val">dev@antigravity.ai</div>
        <div class="sc-bars">
            <div class="sc-bar-row"><span>Claude 3.7 Sonnet</span><span style="color:#a78bfa">94%</span></div>
            <div class="sc-prog-track"><div class="sc-prog-fill-violet" style="width:94%"></div></div>
            <div class="sc-bar-row" style="margin-top:6px;"><span>Gemini 2.5 Pro</span><span style="color:#38bdf8">78%</span></div>
            <div class="sc-prog-track"><div class="sc-prog-fill-cyan" style="width:78%"></div></div>
        </div>
    </div>

    <!-- Card 2: Deep Token Analytics -->
    <div class="sc-card">
        <div class="sc-card-hdr">
            <span>${loc.tokenLabel}</span>
            <span class="sc-card-subval">+35.8K Calls</span>
        </div>
        <div class="sc-card-val">4.59B <span style="font-size:14px;color:#94a3b8;font-weight:500;">tokens</span></div>
        <div class="heatmap-mini">
            <div class="hm-cell hm-1"></div><div class="hm-cell hm-2"></div><div class="hm-cell hm-3"></div><div class="hm-cell hm-4"></div>
            <div class="hm-cell hm-2"></div><div class="hm-cell hm-1"></div><div class="hm-cell hm-4"></div><div class="hm-cell hm-3"></div>
            <div class="hm-cell hm-3"></div><div class="hm-cell hm-4"></div><div class="hm-cell hm-2"></div><div class="hm-cell hm-1"></div>
            <div class="hm-cell hm-4"></div><div class="hm-cell hm-3"></div><div class="hm-cell hm-2"></div><div class="hm-cell hm-4"></div>
            <div class="hm-cell hm-2"></div><div class="hm-cell hm-3"></div><div class="hm-cell hm-1"></div><div class="hm-cell hm-4"></div>
            <div class="hm-cell hm-4"></div><div class="hm-cell hm-2"></div><div class="hm-cell hm-3"></div><div class="hm-cell hm-1"></div>
            <div class="hm-cell hm-1"></div><div class="hm-cell hm-4"></div><div class="hm-cell hm-2"></div><div class="hm-cell hm-3"></div>
            <div class="hm-cell hm-3"></div><div class="hm-cell hm-1"></div><div class="hm-cell hm-4"></div><div class="hm-cell hm-2"></div>
        </div>
    </div>

    <!-- Card 3: Cost & Context Intelligence -->
    <div class="sc-card">
        <div class="sc-card-hdr">
            <span>Est. Cost & Context</span>
            <span style="color:#38bdf8;">92% Cache</span>
        </div>
        <div class="sc-card-val">$1,556 <span style="font-size:14px;color:#94a3b8;font-weight:500;">USD</span></div>
        <div class="sc-bars">
            <div class="sc-bar-row"><span>Cache Read Savings</span><span style="color:#10b981;">-$840.20</span></div>
            <div class="sc-prog-track">
                <div class="sc-prog-fill-cyan" style="width:48%"></div>
                <div class="sc-prog-fill-violet" style="width:32%"></div>
                <div class="sc-prog-fill-green" style="width:20%"></div>
            </div>
            <div class="sc-bar-row" style="margin-top:6px;"><span>Context Drilldown</span><span style="color:#cbd5e1;">🔥 192K / 200K</span></div>
        </div>
    </div>
</div>

<!-- Bottom Footer -->
<div class="footer-row">
    <div class="footer-lang-pill">
        <span>🌐 ${loc.langPill}</span>
    </div>
    <div class="footer-platforms">
        <span>macOS</span>
        <span>•</span>
        <span>Windows</span>
        <span>•</span>
        <span>Linux</span>
        <span>•</span>
        <span>MIT License</span>
    </div>
</div>

</body>
</html>`;
}

async function renderBanners() {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    if (!fs.existsSync(edgePath)) {
        console.error('Edge executable not found at: ' + edgePath);
        process.exit(1);
    }

    console.log(`Starting banner generation for ${LOCALES.length} languages...`);
    const tempHtmlDir = path.join(__dirname, '..', 'out', 'banner_temps');
    if (!fs.existsSync(tempHtmlDir)) fs.mkdirSync(tempHtmlDir, { recursive: true });

    for (const loc of LOCALES) {
        const html = generateBannerHtml(loc);
        const tempHtmlFile = path.join(tempHtmlDir, `banner_${loc.code}.html`);
        const outPngFile = path.join(BANNERS_DIR, `banner_${loc.code}.png`);

        fs.writeFileSync(tempHtmlFile, html, 'utf-8');

        // Render via headless Edge
        const fileUrl = `file:///${tempHtmlFile.replace(/\\/g, '/')}`;
        const cmd = `"${edgePath}" --headless --disable-gpu --force-device-scale-factor=1 --window-size=1280,640 --screenshot="${outPngFile}" "${fileUrl}"`;

        try {
            execSync(cmd, { stdio: 'pipe' });
            const stat = fs.statSync(outPngFile);
            console.log(`✅ [${loc.code.toUpperCase()}] ${loc.name} banner created: ${outPngFile} (${Math.round(stat.size / 1024)} KB)`);
        } catch (err) {
            console.error(`❌ Failed to render banner for ${loc.code}:`, err.message);
        }
    }

    // Clean temp dir
    fs.rmSync(tempHtmlDir, { recursive: true, force: true });
    console.log('\n🎉 All 10 localized promotional banners generated successfully in assets/banners/!');
}

renderBanners();
