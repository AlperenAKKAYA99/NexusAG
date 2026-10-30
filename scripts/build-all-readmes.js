/**
 * build-all-readmes.js
 * Generates high-quality localized README files for:
 * pt-BR, es, de, fr, ja, zh-CN, hi, ru
 * each linking to its respective banner_*.png, featuring the full 8-image showcase grid:
 * img1.png, img3.png, img4.png, img5.png, img2.png, img7.png, img6.png, img8.png
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

function getNavbar(activeCode) {
    const langs = [
        { code: 'en', label: 'English', file: 'readme.md' },
        { code: 'tr', label: 'TÃ¼rkÃ§e', file: 'README.tr.md' },
        { code: 'pt-BR', label: 'PortuguÃªs', file: 'README.pt-BR.md' },
        { code: 'es', label: 'EspaÃ±ol', file: 'README.es.md' },
        { code: 'de', label: 'Deutsch', file: 'README.de.md' },
        { code: 'fr', label: 'FranÃ§ais', file: 'README.fr.md' },
        { code: 'ja', label: 'æ—¥æœ¬èª', file: 'README.ja.md' },
        { code: 'zh-CN', label: 'ç®€ä½“ä¸­æ–‡', file: 'README.zh-CN.md' },
        { code: 'hi', label: 'à¤¹à¤¿à¤¨à¥à¤¦à¥€', file: 'README.hi.md' },
        { code: 'ru', label: 'Ğ ÑƒÑÑĞºĞ¸Ğ¹', file: 'README.ru.md' }
    ];
    const links = langs.map(l => {
        if (l.code === activeCode) {
            return `<a href="${l.file}"><b>${l.label}</b></a>`;
        }
        return `<a href="${l.file}">${l.label}</a>`;
    });
    return `<p align="center">\n  ${links.join(' â€¢\n  ')}\n</p>`;
}


const LOCALES = [
    {
        code: 'de',
        filename: 'README.de.md',
        banner: 'assets/banners/banner_de.png',
        versionBadge: 'Version',
        langBadge: 'Sprachen-10%20nativ',
        privacyBadge: 'Datenschutz-100%25%20lokal',
        title: 'NexusAG',
        lead: '**NexusAG** ist die hochentwickelte Steuerzentrale fÃ¼r die **Google Antigravity IDE**. Es ermÃ¶glicht Entwicklern den sofortigen Kontowechsel mit einem Klick, Echtzeit-Ãœberwachung von KI-Quoten Ã¼ber mehrere Google-Profile hinweg, tiefgehende Kontextfenster-Inspektion, Wiederherstellung verlorener Konversationen von der Festplatte und lebenslange Token-Kostenanalysen in einem vollstÃ¤ndigen Editor-Dashboard.',
        showcaseHeader: 'ğŸ“¸ Multi-Account-Schaltzentrale & UI Showcase',
        imgs: {
            img1: ['âš¡ Multi-Account-Schaltzentrale', '1-Klick-Kontowechsel, Live-Quotenfortschritt & Reset-Countdown'],
            img3: ['ğŸ”‘ Token-Budget & Kontext', 'Anpassungs-Donut, aktive Sitzungsanzeige & Workspace-Regeln'],
            img4: ['ğŸ“ˆ Nutzungsstatistiken (Sidebar)', 'Sitzungstoken-Gesamtwerte, stÃ¼ndliche AktivitÃ¤t & monatliche Kosten'],
            img5: ['ğŸŒ Einstellungen & 10-Sprachen-Zentrale', 'Reaktiver Sofort-Sprachwechsler, Abfrageintervalle & Reparatur'],
            img2: ['ğŸ”‘ Konten per Token hinzufÃ¼gen', 'Stapelweises EinfÃ¼gen von OAuth-Refresh-Tokens mit Validierung'],
            img7: ['ğŸ”’ Nahtlose Google OAuth-Anmeldung', '1-Klick-Browser-Authentifizierung mit automatischer RÃ¼ckkehr'],
            img6: ['ğŸ” Kontextfenster-Detailansicht (Editor-Tab)', 'Hierarchischer Schrittbaum, Token-Kategorien & Markdown-Export'],
            img8: ['ğŸ“Š Tiefgehendes Token-Analytics Bento-Dashboard (Vollbild)', 'Lebenslange Konversations-PrÃ¼fung, GitHub-AktivitÃ¤ts-Heatmap, Modellkosten-Tabelle & Top-Chats']
        },
        featuresTitle: 'âœ¨ Hauptfunktionen im Ãœberblick',
        sectionAccountsTitle: 'âš¡ Multi-Account-Schaltzentrale & Live-Quoten',
        sectionAccountsText: `- **Unbegrenzte Konten** â€” Ãœberwachen Sie mehrere Google-Konten parallel ohne Ãœberschneidungen.
- **Sofortiger 1-Klick-Wechsel** â€” Wechseln Sie das aktive IDE-Konto direkt aus der Seitenleiste.
- **Farbkodierte Quotenbalken** â€” Sofortige Ãœbersicht (ğŸŸ¢ >50%, ğŸŸ¡ 20-50%, ğŸ”´ <20%) mit prÃ¤zisen Reset-Countdowns.
- **Statusleisten-Integration** â€” Heften Sie Favoritenmodelle mit einem Stern (â˜…) an die Statusleiste an.
- **Proaktive Token-Erneuerung** â€” Automatische Aktualisierung von OAuth-Tokens verhindert 401-Fehler.
- **Abo-Plan-Details** â€” Direkte Anzeige des Tiers (Ultra, Premium, Free) und Guthaben.`,
        sectionI18nTitle: 'ğŸŒ 100% Mehrsprachigkeit & Reaktiver Sofortwechsel',
        sectionI18nText: `- **10 Native Sprachen**: Englisch, TÃ¼rkisch, Portugiesisch, Spanisch, Deutsch, FranzÃ¶sisch, Japanisch, Chinesisch, Hindi und Russisch.
- **Reaktiver Wechsel Ohne Neuladen** â€” Das Umschalten der Sprache Ã¼bersetzt sofort **100%** der BenutzeroberflÃ¤che (Seitenleiste, Editor-Dashboard, Kontextfenster-Inspektor und Benachrichtigungen).`,
        sectionTokensTitle: 'ğŸ”‘ Token-Budget & Kontext-Intelligenz',
        sectionTokensText: `- **Anpassungs-Donut-Diagramm** â€” Token-Verbrauch fÃ¼r MCP-Tools, Regeln, Workflows und Skills.
- **Aktives Kontextfenster-Meter** â€” Echtzeit-Vergleich zwischen verbrauchten Tokens und Modellgrenzen.
- **Workspace-Kontext-Inspektor** â€” Direkte Dateilinks zu allen \`.agent/\`-Dateien mit Aktivierungsmodi.`,
        sectionContextTitle: 'ğŸ” Kontextfenster-Detailansicht (Editor-Tab)',
        sectionContextText: `- Mit einem Klick Ã¼ber **"Alle anzeigen â†’"** erreichbar.
- **Hierarchischer Strukturbaum** â€” Detaillierte AufschlÃ¼sselung von System-Prompt, Werkzeugen, MCP und Chat-Schritten.
- **Inline-Schrittvorschau** â€” Inhalte der einzelnen Schritte direkt im Editor prÃ¼fen.
- **Flammen-Symbole (ğŸ”¥)** â€” Kennzeichnung der grÃ¶ÃŸten Token-Verbraucher im Kontext.
- **Markdown-Export** â€” Kontextdaten mit einem Klick in die Zwischenablage oder als Datei exportieren.`,
        sectionAnalyticsTitle: 'ğŸ“ˆ Tiefgehende Token-Analysen & Bento-Dashboard',
        sectionAnalyticsText: `- Erreichbar Ã¼ber **"VollstÃ¤ndiges Dashboard Ã¶ffnen â†’"**.
- **Gesamter Historien-Scan** â€” Erfasst und analysiert sÃ¤mtliche vergangenen Konversationen in Antigravity.
- **9 KPI-Metriken** â€” Input-, Cache-, Output- und Reasoning-Tokens, API-Aufrufe, geschÃ¤tzte Kosten und Cache-Rate.
- **GitHub-Style AktivitÃ¤ts-Heatmap** â€” 365-Tage-AktivitÃ¤tsgitter mit Jahresauswahl.
- **Dynamische LiteLLM-Preisberechnung** â€” PrÃ¤zise KostenschÃ¤tzungen basierend auf aktuellen API-Preisen.`,
        sectionGuardTitle: 'ğŸ›¡ï¸ Konversations-Schutz (Conversation Guard)',
        sectionGuardText: `- **Automatische Erkennung verwaister Konversationen** â€” Gleicht \`.pb\`-Dateien auf der Festplatte mit dem Index ab.
- **1-Klick-Reparatur** â€” Beendet AG sicher, baut den Index neu auf und startet die IDE ohne Datenverlust neu.`,
        getStartedTitle: 'ğŸš€ Erste Schritte',
        installText: `1. Suchen Sie im Antigravity Extension Marketplace nach **NexusAG** und klicken Sie auf **Installieren**.
2. Oder installieren Sie direkt Ã¼ber die \`.vsix\`-Datei:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: 'VerÃ¶ffentlicht unter der **MIT-Lizenz**. Entwickelt mit â˜• von **[NexusAG Team](https://github.com/AlperenAKKAYA99)**'
    },
    {
        code: 'pt-BR',
        filename: 'README.pt-BR.md',
        banner: 'assets/banners/banner_pt-BR.png',
        versionBadge: 'versÃ£o',
        langBadge: 'idiomas-10%20nativos',
        privacyBadge: 'privacidade-100%25%20local',
        title: 'NexusAG',
        lead: '**NexusAG** Ã© o painel de controle e suÃ­te de inteligÃªncia de Ãºltima geraÃ§Ã£o desenvolvido para o **Google Antigravity IDE**. Permite alternar contas com 1 clique, monitorar cotas de IA em tempo real em mÃºltiplos perfis Google, inspecionar a janela de contexto token por token, recuperar conversas perdidas do disco e analisar o consumo de tokens de todo o histÃ³rico com um painel analÃ­tico completo no editor.',
        showcaseHeader: 'ğŸ“¸ Alternador de Contas e Galeria de Interface (UI Showcase)',
        imgs: {
            img1: ['âš¡ Alternador de Contas', 'Troca de conta em 1 clique, progresso de cotas e timers de reset'],
            img3: ['ğŸ”‘ OrÃ§amento de Tokens e Contexto', 'Donut de customizaÃ§Ãµes, medidor da sessÃ£o e regras'],
            img4: ['ğŸ“ˆ MÃ©tricas de Uso (Sidebar)', 'Totais de tokens da sessÃ£o, atividade horÃ¡ria e custos mensais'],
            img5: ['ğŸŒ ConfiguraÃ§Ãµes e Hub de 10 Idiomas', 'Seletor reativo de idiomas, intervalos de atualizaÃ§Ã£o e reparo'],
            img2: ['ğŸ”‘ Adicionar Contas via Token', 'InserÃ§Ã£o em lote de refresh tokens OAuth com validaÃ§Ã£o'],
            img7: ['ğŸ”’ AutenticaÃ§Ã£o Google OAuth Sem FricÃ§Ã£o', 'Login via navegador com 1 clique e retorno automÃ¡tico'],
            img6: ['ğŸ” Detalhes da Janela de Contexto (Aba do Editor)', 'Ãrvore hierÃ¡rquica de etapas, categorias de tokens e exportaÃ§Ã£o'],
            img8: ['ğŸ“Š Painel Bento de AnÃ¡lise Profunda de Tokens (Editor Completo)', 'Auditoria de todo o histÃ³rico, heatmap estilo GitHub, distribuiÃ§Ã£o de custos e top conversas']
        },
        featuresTitle: 'âœ¨ Principais Recursos e Destaques',
        sectionAccountsTitle: 'âš¡ Alternador de Contas e Monitoramento de Cotas',
        sectionAccountsText: `- **Contas Ilimitadas** â€” Monitore mÃºltiplas contas Google simultaneamente sem conflitos.
- **Troca com 1 Clique** â€” Alterne a conta ativa no IDE diretamente pela barra lateral instantaneamente.
- **Medidores de Cota em Tempo Real** â€” Barras de capacidade coloridas (ğŸŸ¢ >50%, ğŸŸ¡ 20-50%, ğŸ”´ <20%) e contagens regressivas exatas para o reset.
- **IntegraÃ§Ã£o com a Barra de Status** â€” Marque seus modelos favoritos com estrela (â˜…) para visualizaÃ§Ã£o rÃ¡pida na barra de status.
- **RenovaÃ§Ã£o Proativa de Token** â€” AtualizaÃ§Ã£o automÃ¡tica do access_token em segundo plano evita erros 401 durante sessÃµes longas.
- **InformaÃ§Ãµes do Plano** â€” IdentificaÃ§Ã£o imediata da camada de assinatura (Ultra, Premium, Free) e crÃ©ditos de prompt/fluxo.`,
        sectionI18nTitle: 'ğŸŒ 100% InternacionalizaÃ§Ã£o e Troca Reativa InstantÃ¢nea',
        sectionI18nText: `- **10 Idiomas Nativos**: InglÃªs, Turco, PortuguÃªs (Brasil), Espanhol, AlemÃ£o, FrancÃªs, JaponÃªs, ChinÃªs Simplificado, Hindi e Russo.
- **Troca Reativa Sem Recarregar** â€” Mudar de idioma na aba ConfiguraÃ§Ãµes traduz instantaneamente **100%** da interface (Sidebar, Painel Bento no Editor, Detalhes de Contexto e diÃ¡logos) sem necessidade de reiniciar.`,
        sectionTokensTitle: 'ğŸ”‘ OrÃ§amento de Tokens e InteligÃªncia de Contexto',
        sectionTokensText: `- **GrÃ¡fico Donut de CustomizaÃ§Ãµes** â€” Consumo de tokens para Ferramentas MCP, Regras, Fluxos e Skills.
- **Medidor de Contexto Ativo** â€” Monitoramento em tempo real do limite de contexto do modelo versus tokens consumidos.
- **Inspetor de EspaÃ§o de Trabalho** â€” Links diretos para regras e workflows em \`.agent/\` com modos de ativaÃ§Ã£o.`,
        sectionContextTitle: 'ğŸ” Detalhamento da Janela de Contexto (Aba de Editor Completa)',
        sectionContextText: `- Acesse com um clique atravÃ©s do botÃ£o **"Ver Tudo â†’"**.
- **Ãrvore HierÃ¡rquica** â€” DivisÃ£o detalhada de System Prompt, Ferramentas, MCP e Mensagens de Chat com porcentagens exatas.
- **PrÃ©via de Etapas Inline** â€” Inspecione o conteÃºdo de cada etapa sem sair do IDE.
- **InsÃ­gnias de Chamas (ğŸ”¥)** â€” Destaca visualmente os maiores consumidores de contexto.
- **ExportaÃ§Ã£o em Markdown** â€” Copie ou salve relatÃ³rios completos de contexto.`,
        sectionAnalyticsTitle: 'ğŸ“ˆ AnÃ¡lise Profunda de Tokens e Painel Bento',
        sectionAnalyticsText: `- Acesse atravÃ©s do botÃ£o **"Abrir Painel Completo â†’"**.
- **AgregaÃ§Ã£o HistÃ³rica** â€” Analisa cada conversa registrada no Antigravity desde a instalaÃ§Ã£o.
- **9 MÃ©tricas KPI** â€” Tokens de Entrada, Cache, SaÃ­da, RaciocÃ­nio, chamadas totais, custo estimado e taxa de acerto de cache.
- **Heatmap Estilo GitHub** â€” Grade de atividade anual com seletor de ano e indicadores de picos.
- **CÃ¡lculo DinÃ¢mico com LiteLLM** â€” Estimativa precisa de custos de API por modelo.`,
        sectionGuardTitle: 'ğŸ›¡ï¸ GuardiÃ£o de Conversas (Conversation Guard)',
        sectionGuardText: `- **DetecÃ§Ã£o AutomÃ¡tica** â€” Compara arquivos locais \`.pb\` do disco com o Ã­ndice da barra lateral 15s apÃ³s a inicializaÃ§Ã£o.
- **Reparo com 1 Clique** â€” Fecha o AG com seguranÃ§a, reconstrÃ³i o Ã­ndice do zero e reinicia o IDE sem perda de dados.`,
        getStartedTitle: 'ğŸš€ Primeiros Passos',
        installText: `1. Procure por **NexusAG** no marketplace de extensÃµes do Antigravity e clique em **Instalar**.
2. Ou instale via arquivo \`.vsix\`:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: 'DistribuÃ­do sob a **LicenÃ§a MIT**. Desenvolvido com â˜• por **[NexusAG Team](https://github.com/AlperenAKKAYA99)**'
    },
    {
        code: 'es',
        filename: 'README.es.md',
        banner: 'assets/banners/banner_es.png',
        versionBadge: 'versiÃ³n',
        langBadge: 'idiomas-10%20nativos',
        privacyBadge: 'privacidad-100%25%20local',
        title: 'NexusAG',
        lead: '**NexusAG** es el panel de control y suite de inteligencia de Ãºltima generaciÃ³n diseÃ±ado para **Google Antigravity IDE**. Permite a los desarrolladores cambiar de cuenta con 1 clic, supervisar las cuotas de IA en tiempo real en mÃºltiples perfiles de Google, analizar la ventana de contexto token por token, recuperar conversaciones perdidas del disco y examinar el consumo de tokens histÃ³rico con un panel de anÃ¡lisis completo en el editor.',
        showcaseHeader: 'ğŸ“¸ Selector Multicuenta y GalerÃ­a de Interfaz (UI Showcase)',
        imgs: {
            img1: ['âš¡ Selector Multicuenta', 'Cambio de cuenta en 1 clic, progreso de cuotas y temporizadores'],
            img3: ['ğŸ”‘ Presupuesto de Tokens y Contexto', 'Donut de personalizaciones, medidor de sesiÃ³n y reglas'],
            img4: ['ğŸ“ˆ EstadÃ­sticas de Uso (Sidebar)', 'Totales de tokens de sesiÃ³n, actividad horaria y costes mensuales'],
            img5: ['ğŸŒ Ajustes y Centro de 10 Idiomas', 'Selector reactivo de idioma, intervalos de refresco y reparaciÃ³n'],
            img2: ['ğŸ”‘ AÃ±adir Cuentas vÃ­a Token', 'Pegado por lotes de refresh tokens OAuth con validaciÃ³n'],
            img7: ['ğŸ”’ AutenticaciÃ³n Google OAuth Fluida', 'Inicio de sesiÃ³n en navegador con 1 clic y retorno automÃ¡tico'],
            img6: ['ğŸ” Detalle de Ventana de Contexto (PestaÃ±a Editor)', 'Ãrbol jerÃ¡rquico de pasos, categorÃ­as de tokens y exportaciÃ³n'],
            img8: ['ğŸ“Š Panel Bento de AnalÃ­tica Profunda de Tokens (Pantalla Completa)', 'AuditorÃ­a histÃ³rica total, mapa de calor estilo GitHub, tabla de costes y conversaciones top']
        },
        featuresTitle: 'âœ¨ CaracterÃ­sticas Principales',
        sectionAccountsTitle: 'âš¡ Selector Multicuenta y MonitorizaciÃ³n de Cuotas en Vivo',
        sectionAccountsText: `- **Cuentas Ilimitadas** â€” Monitorice mÃºltiples cuentas de Google simultÃ¡neamente sin conflictos.
- **Cambio InstantÃ¡neo en 1 Clic** â€” Cambie la cuenta activa del IDE directamente desde la barra lateral.
- **Indicadores de Cuota en Tiempo Real** â€” Barras de capacidad con cÃ³digo de colores (ğŸŸ¢ >50%, ğŸŸ¡ 20-50%, ğŸ”´ <20%) y temporizadores de reinicio exactos.
- **IntegraciÃ³n con Barra de Estado** â€” Fije modelos con estrella (â˜…) para ver cuotas sin abrir el panel.
- **RenovaciÃ³n Proactiva de Tokens** â€” Refresco automÃ¡tico de tokens OAuth para evitar errores 401.
- **InformaciÃ³n del Nivel de SuscripciÃ³n** â€” Visualice su categorÃ­a (Ultra, Premium, Free) y crÃ©ditos disponibles.`,
        sectionI18nTitle: 'ğŸŒ 100% InternacionalizaciÃ³n y Cambio Reactivo InstantÃ¡neo',
        sectionI18nText: `- **10 Idiomas Nativos**: InglÃ©s, Turco, PortuguÃ©s, EspaÃ±ol, AlemÃ¡n, FrancÃ©s, JaponÃ©s, Chino Simplificado, Hindi y Ruso.
- **Cambio Reactivo Sin Recargar** â€” Cambiar el idioma en la pestaÃ±a Ajustes traduce instantÃ¡neamente el **100%** de la interfaz (Sidebar, Panel Bento en Editor, Detalle de Contexto y diÃ¡logos).`,
        sectionTokensTitle: 'ğŸ”‘ Presupuesto de Tokens e Inteligencia de Contexto',
        sectionTokensText: `- **GrÃ¡fico Donut de Personalizaciones** â€” Desglose de tokens para MCP Tools, Reglas, Workflows y Skills.
- **Medidor de Contexto Activo** â€” VisualizaciÃ³n en tiempo real del lÃ­mite del modelo frente a tokens usados.
- **Inspector de Contexto de Workspace** â€” Enlaces directos a archivos en \`.agent/\` con modos de activaciÃ³n.`,
        sectionContextTitle: 'ğŸ” Detalle de Ventana de Contexto (PestaÃ±a Completa de Editor)',
        sectionContextText: `- Acceda en un clic con el botÃ³n **"Ver Todo â†’"**.
- **Ãrbol JerÃ¡rquico** â€” Desglose agrupado de System Prompt, Herramientas, MCP y Mensajes de Chat.
- **Vistas Previas Inline** â€” Inspeccione el contenido de cada paso sin salir del IDE.
- **Insignias de Fuego (ğŸ”¥)** â€” Destaque visual inmediato de los pasos con mayor consumo de tokens.
- **ExportaciÃ³n a Markdown** â€” Guarde o copie al portapapeles el historial de contexto formateado.`,
        sectionAnalyticsTitle: 'ğŸ“ˆ AnalÃ­tica Profunda de Tokens y Panel Bento',
        sectionAnalyticsText: `- Acceda mediante el botÃ³n **"Abrir Panel Completo â†’"**.
- **AgregaciÃ³n HistÃ³rica Total** â€” Escanea y suma el uso de tokens en cada conversaciÃ³n en Antigravity.
- **9 MÃ©tricas KPI** â€” Entrada, Lecturas de CachÃ©, Salida, Razonamiento, llamadas totales, coste estimado y ratio de acierto de cachÃ©.
- **Mapa de Calor Estilo GitHub** â€” GrÃ­cula de actividad de 365 dÃ­as con selector de aÃ±o y picos de uso.
- **Motor de Precios LiteLLM** â€” EstimaciÃ³n precisa del coste de API segÃºn las tarifas vigentes.`,
        sectionGuardTitle: 'ğŸ›¡ï¸ GuardiÃ¡n de Conversaciones (Conversation Guard)',
        sectionGuardText: `- **DetecciÃ³n AutomÃ¡tica de HuÃ©rfanas** â€” Compara archivos \`.pb\` en disco con el Ã­ndice de la barra lateral tras 15s de inicio.
- **ReparaciÃ³n en 1 Clic** â€” Cierra AG de forma segura, reconstruye el Ã­ndice y reinicia el IDE automÃ¡ticamente.`,
        getStartedTitle: 'ğŸš€ Primeros Pasos',
        installText: `1. Busque **NexusAG** en el Marketplace de extensiones de Antigravity e instÃ¡lela.
2. O instÃ¡lela mediante el archivo \`.vsix\`:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: 'Distribuido bajo la **Licencia MIT**. Creado con â˜• por **[NexusAG Team](https://github.com/AlperenAKKAYA99)**'
    },
    {
        code: 'fr',
        filename: 'README.fr.md',
        banner: 'assets/banners/banner_fr.png',
        versionBadge: 'version',
        langBadge: 'langues-10%20natives',
        privacyBadge: 'confidentialitÃ©-100%25%20locale',
        title: 'NexusAG',
        lead: '**NexusAG** est le panneau de contrÃ´le de nouvelle gÃ©nÃ©ration conÃ§u pour l\'environnement **Google Antigravity IDE**. Il permet aux dÃ©veloppeurs de changer de compte en 1 clic, de surveiller les quotas IA en temps rÃ©el sur plusieurs profils Google, d\'analyser la fenÃªtre de contexte pas Ã  pas, de rÃ©cupÃ©rer les conversations orphelines sur disque et d\'auditer la consommation globale de jetons via un tableau de bord analytique complet.',
        showcaseHeader: 'ğŸ“¸ SÃ©lecteur Multi-comptes et Galerie d\'Interface (UI Showcase)',
        imgs: {
            img1: ['âš¡ SÃ©lecteur Multi-comptes', 'Changement de compte en 1 clic, jauges de quotas et comptes Ã  rebours'],
            img3: ['ğŸ”‘ Budget de Tokens et Contexte', 'Donut des personnalisations, jauge de session et rÃ¨gles'],
            img4: ['ğŸ“ˆ Statistiques d\'Utilisation (Sidebar)', 'Totaux de jetons de session, activitÃ© horaire et coÃ»ts mensuels'],
            img5: ['ğŸŒ ParamÃ¨tres et Hub 10 Langues', 'SÃ©lecteur rÃ©actif de langue, intervalles d\'actualisation et rÃ©paration'],
            img2: ['ğŸ”‘ Ajouter des Comptes via Token', 'Collage par lot de tokens d\'actualisation OAuth avec validation'],
            img7: ['ğŸ”’ Authentification Google OAuth Fluide', 'Connexion dans le navigateur en 1 clic avec retour automatique'],
            img6: ['ğŸ” DÃ©tail de la FenÃªtre de Contexte (Onglet Ã‰diteur)', 'Arborescence des Ã©tapes, ventilation des tokens et export Markdown'],
            img8: ['ğŸ“Š Tableau de Bord Bento d\'Analyse Approfondie (Plein Ã‰diteur)', 'Audit de tout l\'historique, heatmap GitHub, grille des coÃ»ts par modÃ¨le et top conversations']
        },
        featuresTitle: 'âœ¨ FonctionnalitÃ©s Majeures',
        sectionAccountsTitle: 'âš¡ SÃ©lecteur Multi-comptes et Quotas en Temps RÃ©el',
        sectionAccountsText: `- **Comptes IllimitÃ©s** â€” Suivez plusieurs comptes Google simultanÃ©ment sans conflit.
- **Bascule InstantanÃ©e en 1 Clic** â€” Changez le compte actif de l'IDE directement depuis la barre latÃ©rale.
- **Jauges de Quotas en Temps RÃ©el** â€” Barres colorÃ©es (ğŸŸ¢ >50%, ğŸŸ¡ 20-50%, ğŸ”´ <20%) avec compte Ã  rebours de rÃ©initialisation prÃ©cis.
- **IntÃ©gration Barre d'Ã‰tat** â€” Ã‰pinglez vos modÃ¨les favoris avec une Ã©toile (â˜…) pour un suivi constant.
- **Renouvellement Proactif des Jetons** â€” RafraÃ®chissement automatique des jetons d'accÃ¨s Ã©vitant les erreurs 401.
- **DÃ©tails de l'Abonnement** â€” Affichage direct du palier (Ultra, Premium, Free) et des crÃ©dits d'utilisation.`,
        sectionI18nTitle: 'ğŸŒ 100% Internationalisation et RÃ©activitÃ© ImmÃ©diate',
        sectionI18nText: `- **10 Langues Natives**: Anglais, Turc, Portugais, Espagnol, Allemand, FranÃ§ais, Japonais, Chinois SimplifiÃ©, Hindi et Russe.
- **Basculement Sans Rechargement** â€” Changer de langue dans l'onglet ParamÃ¨tres traduit instantanÃ©ment **100%** de l'interface (Sidebar, Tableau Bento, Inspection de Contexte et alertes).`,
        sectionTokensTitle: 'ğŸ”‘ Budget de Tokens et Intelligence de Contexte',
        sectionTokensText: `- **Graphique Donut des Personnalisations** â€” Empreinte token des outils MCP, rÃ¨gles, flux et compÃ©tences.
- **Jauge de FenÃªtre de Contexte Active** â€” Comparaison en direct entre tokens consommÃ©s et limite maximale du modÃ¨le.
- **Inspecteur de Contexte de l'Espace de Travail** â€” Liens directs vers les fichiers \`.agent/\` et modes d'activation.`,
        sectionContextTitle: 'ğŸ” DÃ©tail de la FenÃªtre de Contexte (Onglet Ã‰diteur Complet)',
        sectionContextText: `- Accessible en un clic via **"Voir Tout â†’"**.
- **Arborescence HiÃ©rarchique** â€” DÃ©composition du System Prompt, des Outils, de MCP et des messages.
- **AperÃ§us IntÃ©grÃ©s** â€” Examinez le contenu de chaque Ã©tape directement dans l'Ã©diteur.
- **Badges Flamme (ğŸ”¥)** â€” RepÃ©rez immÃ©diatement les Ã©tapes les plus coÃ»teuses en tokens.
- **Export Markdown** â€” Exportez facilement les mÃ©triques de contexte.`,
        sectionAnalyticsTitle: 'ğŸ“ˆ Statistiques Approfondies et Tableau de Bord Bento',
        sectionAnalyticsText: `- Accessible via **"Ouvrir le Tableau Complet â†’"**.
- **AgrÃ©gation de Tout l'Historique** â€” Analyse l'ensemble des conversations enregistrÃ©es dans Antigravity.
- **9 MÃ©triques KPI** â€” Tokens d'entrÃ©e, de cache, de sortie, de rÃ©flexion, nombre d'appels et taux de cache.
- **Heatmap d'ActivitÃ© Style GitHub** â€” Grille annuelle avec sÃ©lecteur d'annÃ©e et pic d'utilisation.
- **Moteur Tarifaire LiteLLM** â€” Estimation prÃ©cise des coÃ»ts de facturation API.`,
        sectionGuardTitle: 'ğŸ›¡ï¸ Garde de Conversation (Conversation Guard)',
        sectionGuardText: `- **DÃ©tection Automatique des Conversations Perdues** â€” Compare les fichiers \`.pb\` avec l'index IDE 15s aprÃ¨s le dÃ©marrage.
- **RÃ©paration en 1 Clic** â€” Ferme AG en toute sÃ©curitÃ©, reconstruit l'index et relance l'IDE sans perte de donnÃ©es.`,
        getStartedTitle: 'ğŸš€ DÃ©marrage Rapide',
        installText: `1. Recherchez **NexusAG** dans le Marketplace d'extensions Antigravity et cliquez sur **Installer**.
2. Ou installez directement depuis le fichier \`.vsix\` :
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: 'DistribuÃ© sous **Licence MIT**. DÃ©veloppÃ© avec â˜• par **[NexusAG Team](https://github.com/AlperenAKKAYA99)**'
    },
    {
        code: 'ja',
        filename: 'README.ja.md',
        banner: 'assets/banners/banner_ja.png',
        versionBadge: 'ãƒãƒ¼ã‚¸ãƒ§ãƒ³',
        langBadge: 'è¨€èª-10è¨€èªå¯¾å¿œ',
        privacyBadge: 'ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼-100%25ãƒ­ãƒ¼ã‚«ãƒ«',
        title: 'NexusAG',
        lead: '**NexusAG** ã¯ã€**Google Antigravity IDE** ã®ãŸã‚ã«è¨­è¨ˆã•ã‚ŒãŸæ¬¡ä¸–ä»£ã®ã‚¤ãƒ³ãƒ†ãƒªã‚¸ã‚§ãƒ³ãƒˆãƒ»ã‚³ãƒ³ãƒˆãƒ­ãƒ¼ãƒ«ãƒ‘ãƒãƒ«ã§ã™ã€‚ãƒ¯ãƒ³ã‚¯ãƒªãƒƒã‚¯ã§ã®ã‚¢ã‚«ã‚¦ãƒ³ãƒˆåˆ‡ã‚Šæ›¿ãˆã€è¤‡æ•° Google ãƒ—ãƒ­ãƒ•ã‚¡ã‚¤ãƒ«ã®ãƒªã‚¢ãƒ«ã‚¿ã‚¤ãƒ  AI ã‚¯ã‚©ãƒ¼ã‚¿å®¹é‡ç›£è¦–ã€ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚¦ã‚£ãƒ³ãƒ‰ã‚¦ã®ãƒˆãƒ¼ã‚¯ãƒ³è©³ç´°ãƒ„ãƒªãƒ¼åˆ†æã€ãƒ‡ã‚£ã‚¹ã‚¯ã‹ã‚‰ã®æ¶ˆå¤±ä¼šè©±å±¥æ­´ã®è‡ªå‹•å¾©æ—§ã€ãã—ã¦ã‚¨ãƒ‡ã‚£ã‚¿å…¨ç”»é¢ãƒ€ãƒƒã‚·ãƒ¥ãƒœãƒ¼ãƒ‰ã«ã‚ˆã‚‹å…¨æœŸé–“ãƒˆãƒ¼ã‚¯ãƒ³æ¶ˆè²»åˆ†æã‚’æä¾›ã—ã¾ã™ã€‚',
        showcaseHeader: 'ğŸ“¸ ãƒãƒ«ãƒã‚¢ã‚«ã‚¦ãƒ³ãƒˆåˆ‡æ›¿ç›¤ ï¼† UI ã‚®ãƒ£ãƒ©ãƒªãƒ¼ (UI Showcase)',
        imgs: {
            img1: ['âš¡ ãƒãƒ«ãƒã‚¢ã‚«ã‚¦ãƒ³ãƒˆåˆ‡æ›¿ç›¤', 'ãƒ¯ãƒ³ã‚¯ãƒªãƒƒã‚¯åˆ‡æ›¿ã€ãƒªã‚¢ãƒ«ã‚¿ã‚¤ãƒ åˆ©ç”¨æ é€²æ—ï¼†ãƒªã‚»ãƒƒãƒˆã‚¿ã‚¤ãƒãƒ¼'],
            img3: ['ğŸ”‘ ãƒˆãƒ¼ã‚¯ãƒ³ãƒã‚¸ã‚§ãƒƒãƒˆï¼†ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ', 'ã‚«ã‚¹ã‚¿ãƒã‚¤ã‚ºãƒ‰ãƒ¼ãƒŠãƒ„ã€ã‚¢ã‚¯ãƒ†ã‚£ãƒ–ã‚»ãƒƒã‚·ãƒ§ãƒ³æ ï¼†ãƒ«ãƒ¼ãƒ«'],
            img4: ['ğŸ“ˆ åˆ©ç”¨çµ±è¨ˆï¼ˆã‚µã‚¤ãƒ‰ãƒãƒ¼ï¼‰', 'ã‚»ãƒƒã‚·ãƒ§ãƒ³ãƒˆãƒ¼ã‚¯ãƒ³åˆè¨ˆã€æ™‚é–“åˆ¥ã‚¢ã‚¯ãƒ†ã‚£ãƒ“ãƒ†ã‚£ï¼†æœˆåˆ¥ã‚³ã‚¹ãƒˆ'],
            img5: ['ğŸŒ è¨­å®šï¼†10è¨€èªãƒãƒ–', 'å³æ™‚ãƒªã‚¢ã‚¯ãƒ†ã‚£ãƒ–è¨€èªåˆ‡æ›¿ã€ãƒãƒ¼ãƒªãƒ³ã‚°é–“éš”ï¼†å¾©å…ƒã‚¹ã‚­ãƒ£ãƒ³'],
            img2: ['ğŸ”‘ ãƒˆãƒ¼ã‚¯ãƒ³ä¸€æ‹¬è¿½åŠ ãƒ¢ãƒ¼ãƒ€ãƒ«', 'æ¤œè¨¼æ©Ÿèƒ½ä»˜ã OAuth ãƒªãƒ•ãƒ¬ãƒƒã‚·ãƒ¥ãƒˆãƒ¼ã‚¯ãƒ³ã®ä¸€æ‹¬ç™»éŒ²'],
            img7: ['ğŸ”’ ã‚·ãƒ¼ãƒ ãƒ¬ã‚¹ãª Google OAuth èªè¨¼', 'è‡ªå‹•ã‚¯ãƒ­ãƒ¼ã‚ºå¯¾å¿œã®ãƒ¯ãƒ³ã‚¯ãƒªãƒƒã‚¯ãƒ»ãƒ–ãƒ©ã‚¦ã‚¶èªè¨¼ãƒ•ãƒ­ãƒ¼'],
            img6: ['ğŸ” ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚¦ã‚£ãƒ³ãƒ‰ã‚¦è©³ç´°ï¼ˆã‚¨ãƒ‡ã‚£ã‚¿ã‚¿ãƒ–ï¼‰', 'éšå±¤åŒ–ã‚¹ãƒ†ãƒƒãƒ—ãƒ„ãƒªãƒ¼ã€ãƒˆãƒ¼ã‚¯ãƒ³ã‚«ãƒ†ã‚´ãƒªåˆ†é¡ï¼†Markdownå‡ºåŠ›'],
            img8: ['ğŸ“Š ãƒˆãƒ¼ã‚¯ãƒ³è©³ç´°åˆ†æ Bento ãƒ€ãƒƒã‚·ãƒ¥ãƒœãƒ¼ãƒ‰ï¼ˆå…¨ç”»é¢ã‚¨ãƒ‡ã‚£ã‚¿ï¼‰', 'å…¨å±¥æ­´ã®ä¼šè©±ç›£æŸ»ã€GitHubé¢¨æ´»å‹•ãƒ’ãƒ¼ãƒˆãƒãƒƒãƒ—ã€ãƒ¢ãƒ‡ãƒ«åˆ¥ã‚³ã‚¹ãƒˆè¡¨ï¼†ä¼šè©±ãƒ©ãƒ³ã‚­ãƒ³ã‚°']
        },
        featuresTitle: 'âœ¨ ä¸»ãªæ©Ÿèƒ½ã¨ç‰¹å¾´',
        sectionAccountsTitle: 'âš¡ ãƒãƒ«ãƒã‚¢ã‚«ã‚¦ãƒ³ãƒˆåˆ‡æ›¿ç›¤ã¨ãƒªã‚¢ãƒ«ã‚¿ã‚¤ãƒ åˆ©ç”¨æ ç›£è¦–',
        sectionAccountsText: `- **ç„¡åˆ¶é™ã®ã‚¢ã‚«ã‚¦ãƒ³ãƒˆç™»éŒ²** â€” è¤‡æ•°ã® Google ã‚¢ã‚«ã‚¦ãƒ³ãƒˆã‚’ç«¶åˆãªãåŒæ™‚ã«ç›£è¦–ã§ãã¾ã™ã€‚
- **ãƒ¯ãƒ³ã‚¯ãƒªãƒƒã‚¯å³æ™‚åˆ‡ã‚Šæ›¿ãˆ** â€” ãƒ¡ãƒ‹ãƒ¥ãƒ¼ã‚’é–‹ãã“ã¨ãªãã€ã‚µã‚¤ãƒ‰ãƒãƒ¼ã‹ã‚‰ç›´æ¥ã‚¢ã‚¯ãƒ†ã‚£ãƒ–ã‚¢ã‚«ã‚¦ãƒ³ãƒˆã‚’å³åº§ã«åˆ‡ã‚Šæ›¿ãˆã¾ã™ã€‚
- **ã‚«ãƒ©ãƒ¼åˆ¥ãƒªã‚¢ãƒ«ã‚¿ã‚¤ãƒ ã‚²ãƒ¼ã‚¸** â€” æ®‹é‡ã«å¿œã˜ãŸè‰²åˆ†ã‘è¡¨ç¤ºï¼ˆğŸŸ¢ >50%ã€ğŸŸ¡ 20-50%ã€ğŸ”´ <20%ï¼‰ã¨æ­£ç¢ºãªãƒªã‚»ãƒƒãƒˆã‚«ã‚¦ãƒ³ãƒˆãƒ€ã‚¦ãƒ³ã€‚
- **ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹ãƒãƒ¼é€£å‹•** â€” ãŠæ°—ã«å…¥ã‚Šãƒ¢ãƒ‡ãƒ«ã«æ˜Ÿï¼ˆâ˜…ï¼‰ã‚’ä»˜ã‘ã‚‹ã“ã¨ã§ã€ãƒ‘ãƒãƒ«ã‚’é–‹ã‹ãšã«ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹ãƒãƒ¼ã§æ ã‚’å¸¸æ™‚ç¢ºèªå¯èƒ½ã€‚
- **ãƒ—ãƒ­ã‚¢ã‚¯ãƒ†ã‚£ãƒ–ãªãƒˆãƒ¼ã‚¯ãƒ³æ›´æ–°** â€” ãƒãƒƒã‚¯ã‚°ãƒ©ã‚¦ãƒ³ãƒ‰ã§ã‚¢ã‚¯ã‚»ã‚¹ãƒˆãƒ¼ã‚¯ãƒ³ã‚’è‡ªå‹•æ›´æ–°ã—ã€é•·æ™‚é–“ã®é–‹ç™ºã‚»ãƒƒã‚·ãƒ§ãƒ³ã§ã‚‚èªè¨¼åˆ‡ã‚Œã‚’é˜²æ­¢ã—ã¾ã™ã€‚
- **ãƒ—ãƒ©ãƒ³æƒ…å ±ã®å¯è¦–åŒ–** â€” Ultraã€Premiumã€Free ãªã©ã®ãƒ—ãƒ©ãƒ³éšå±¤ã¨ã‚¯ãƒ¬ã‚¸ãƒƒãƒˆæ®‹é‡ã‚’å³æ™‚è¡¨ç¤ºã€‚`,
        sectionI18nTitle: 'ğŸŒ 100% å®Œå…¨å¤šè¨€èªå¯¾å¿œãƒ»å³æ™‚ãƒªã‚¢ã‚¯ãƒ†ã‚£ãƒ–åˆ‡æ›¿',
        sectionI18nText: `- **10ã®ä¸»è¦è¨€èªã‚’ãƒã‚¤ãƒ†ã‚£ãƒ–ã‚µãƒãƒ¼ãƒˆ**: è‹±èªã€ãƒˆãƒ«ã‚³èªã€ãƒãƒ«ãƒˆã‚¬ãƒ«èªã€ã‚¹ãƒšã‚¤ãƒ³èªã€ãƒ‰ã‚¤ãƒ„èªã€ãƒ•ãƒ©ãƒ³ã‚¹èªã€æ—¥æœ¬èªã€ç°¡ä½“å­—ä¸­å›½èªã€ãƒ’ãƒ³ãƒ‡ã‚£ãƒ¼èªã€ãƒ­ã‚·ã‚¢èªã€‚
- **ãƒªãƒ­ãƒ¼ãƒ‰ä¸è¦ã®ãƒªã‚¢ã‚¯ãƒ†ã‚£ãƒ–åˆ‡æ›¿** â€” è¨­å®šã‚¿ãƒ–ã§è¨€èªã‚’é¸æŠã™ã‚‹ã¨ã€ã‚µã‚¤ãƒ‰ãƒãƒ¼ã€å…¨ç”»é¢ Bento ãƒ€ãƒƒã‚·ãƒ¥ãƒœãƒ¼ãƒ‰ã€ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆè©³ç´°ç”»é¢ã€ãƒ€ã‚¤ã‚¢ãƒ­ã‚°ã«è‡³ã‚‹ã¾ã§ **100% ã® UI ãŒç¬æ™‚ã«åˆ‡ã‚Šæ›¿ã‚ã‚Šã¾ã™**ã€‚`,
        sectionTokensTitle: 'ğŸ”‘ ãƒˆãƒ¼ã‚¯ãƒ³ãƒã‚¸ã‚§ãƒƒãƒˆï¼†ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆãƒ»ã‚¤ãƒ³ãƒ†ãƒªã‚¸ã‚§ãƒ³ã‚¹',
        sectionTokensText: `- **ã‚«ã‚¹ã‚¿ãƒã‚¤ã‚ºãƒã‚¸ã‚§ãƒƒãƒˆãƒ»ãƒ‰ãƒ¼ãƒŠãƒ„** â€” MCP ãƒ„ãƒ¼ãƒ«ã€Rulesã€Workflowsã€Skills ã”ã¨ã®æ¶ˆè²»é‡ã‚’è¦–è¦šåŒ–ã€‚
- **ã‚¢ã‚¯ãƒ†ã‚£ãƒ–ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆåˆ©ç”¨æ ** â€” ä½¿ç”¨ä¸­ãƒˆãƒ¼ã‚¯ãƒ³æ•°ã¨ãƒ¢ãƒ‡ãƒ«ã®ä¸Šé™å€¤ã‚’ãƒªã‚¢ãƒ«ã‚¿ã‚¤ãƒ ã§æ¯”è¼ƒã€‚
- **ãƒ¯ãƒ¼ã‚¯ã‚¹ãƒšãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆæ¤œæŸ»** â€” \`.agent/\` ãƒ‡ã‚£ãƒ¬ã‚¯ãƒˆãƒªå†…ã®ãƒ«ãƒ¼ãƒ«ã¸ã®ç›´æ¥ãƒ•ã‚¡ã‚¤ãƒ«ãƒªãƒ³ã‚¯ã¨ãƒˆãƒªã‚¬ãƒ¼çŠ¶æ…‹ã‚’è¡¨ç¤ºã€‚`,
        sectionContextTitle: 'ğŸ” ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚¦ã‚£ãƒ³ãƒ‰ã‚¦è©³ç´°åˆ†æï¼ˆå…¨ç”»é¢ã‚¨ãƒ‡ã‚£ã‚¿ã‚¿ãƒ–ï¼‰',
        sectionContextText: `- ã‚µã‚¤ãƒ‰ãƒãƒ¼ã® **"ã™ã¹ã¦è¦‹ã‚‹ â†’"** ã‹ã‚‰ãƒ¯ãƒ³ã‚¯ãƒªãƒƒã‚¯ã§å±•é–‹ã€‚
- **éšå±¤åŒ–ã‚¹ãƒ†ãƒƒãƒ—ãƒ„ãƒªãƒ¼** â€” System Promptã€ãƒ„ãƒ¼ãƒ«å‘¼ã³å‡ºã—ã€MCPã€ãƒãƒ£ãƒƒãƒˆå±¥æ­´ã”ã¨ã®ãƒˆãƒ¼ã‚¯ãƒ³æ•°ã¨å‰²åˆã€‚
- **ã‚¤ãƒ³ãƒ©ã‚¤ãƒ³ãƒ»ã‚¹ãƒ†ãƒƒãƒ—ãƒ—ãƒ¬ãƒ“ãƒ¥ãƒ¼** â€” IDE ã‚’é›¢ã‚Œã‚‹ã“ã¨ãªãã€ãƒ—ãƒ­ãƒ³ãƒ—ãƒˆã‚„ãƒ¢ãƒ‡ãƒ«å¿œç­”ã€ã‚³ãƒãƒ³ãƒ‰å‡ºåŠ›ã‚’ç›´æ¥ãƒ—ãƒ¬ãƒ“ãƒ¥ãƒ¼ã€‚
- **ç‚ãƒãƒƒã‚¸ï¼ˆğŸ”¥ï¼‰** â€” ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’æœ€ã‚‚åœ§è¿«ã—ã¦ã„ã‚‹é‡ã„ã‚¹ãƒ†ãƒƒãƒ—ã‚’ç¬æ™‚ã«è­˜åˆ¥ã€‚
- **Markdown ã‚¨ã‚¯ã‚¹ãƒãƒ¼ãƒˆ** â€” ãƒ¯ãƒ³ã‚¯ãƒªãƒƒã‚¯ã§ãƒ¬ãƒãƒ¼ãƒˆã‚’ã‚³ãƒ”ãƒ¼ã¾ãŸã¯ãƒ•ã‚¡ã‚¤ãƒ«ä¿å­˜ã€‚`,
        sectionAnalyticsTitle: 'ğŸ“ˆ ãƒˆãƒ¼ã‚¯ãƒ³è©³ç´°åˆ†æï¼† Bento ãƒ€ãƒƒã‚·ãƒ¥ãƒœãƒ¼ãƒ‰',
        sectionAnalyticsText: `- **"å…¨ç”»é¢ãƒ€ãƒƒã‚·ãƒ¥ãƒœãƒ¼ãƒ‰ã‚’é–‹ã â†’"** ã‹ã‚‰èµ·å‹•ã€‚
- **å…¨å±¥æ­´ã‚¹ã‚­ãƒ£ãƒ³** â€” Antigravity ä¸Šã§è¡Œã‚ã‚ŒãŸéå»ã™ã¹ã¦ã®ä¼šè©±ã‹ã‚‰ãƒˆãƒ¼ã‚¯ãƒ³æ¶ˆè²»ã‚’é›†è¨ˆã€‚
- **9ã¤ã®ä¸»è¦ KPI æŒ‡æ¨™** â€” å…¥åŠ›ã€ã‚­ãƒ£ãƒƒã‚·ãƒ¥èª­ã¿å–ã‚Šã€å‡ºåŠ›ã€æ€è€ƒãƒˆãƒ¼ã‚¯ãƒ³ã€API ã‚³ã‚¹ãƒˆè©¦ç®—ã€ã‚­ãƒ£ãƒƒã‚·ãƒ¥ç‡ã€‚
- **GitHub ã‚¹ã‚¿ã‚¤ãƒ«ãƒ»ã‚¢ã‚¯ãƒ†ã‚£ãƒ“ãƒ†ã‚£ãƒ’ãƒ¼ãƒˆãƒãƒƒãƒ—** â€” 365æ—¥é–“ã®æ´»å‹•ã‚°ãƒªãƒƒãƒ‰ã¨ãƒ”ãƒ¼ã‚¯æ—¥è¡¨ç¤ºã€‚
- **LiteLLM å‹•çš„ãƒ—ãƒ©ã‚¤ã‚·ãƒ³ã‚°** â€” å„ãƒ¢ãƒ‡ãƒ«ã®æœ€æ–°å˜ä¾¡ã«åŸºã¥ã„ãŸé«˜ç²¾åº¦ãª API åˆ©ç”¨ã‚³ã‚¹ãƒˆç®—å‡ºã€‚`,
        sectionGuardTitle: 'ğŸ›¡ï¸ ä¼šè©±å±¥æ­´å¾©å…ƒã‚¬ãƒ¼ãƒ‰ï¼ˆConversation Guardï¼‰',
        sectionGuardText: `- **æ¶ˆå¤±ä¼šè©±ã®è‡ªå‹•æ¤œçŸ¥** â€” èµ·å‹•15ç§’å¾Œã«ãƒ‡ã‚£ã‚¹ã‚¯ä¸Šã® \`.pb\` ãƒ•ã‚¡ã‚¤ãƒ«ã¨ã‚µã‚¤ãƒ‰ãƒãƒ¼ç´¢å¼•ã‚’ç…§åˆã€‚
- **ãƒ¯ãƒ³ã‚¯ãƒªãƒƒã‚¯å¾©æ—§** â€” å®‰å…¨ã« AG ã‚’çµ‚äº†ã—ã€ãƒ‡ã‚£ã‚¹ã‚¯ã‹ã‚‰ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã‚’å†æ§‹ç¯‰ã—ã¦ IDE ã‚’è‡ªå‹•å†èµ·å‹•ã—ã¾ã™ã€‚`,
        getStartedTitle: 'ğŸš€ ã¯ã˜ã‚æ–¹',
        installText: `1. Antigravity æ‹¡å¼µæ©Ÿèƒ½ãƒãƒ¼ã‚±ãƒƒãƒˆãƒ—ãƒ¬ã‚¤ã‚¹ã§ **NexusAG** ã‚’æ¤œç´¢ã—ã€**ã‚¤ãƒ³ã‚¹ãƒˆãƒ¼ãƒ«** ã‚’ã‚¯ãƒªãƒƒã‚¯ã—ã¾ã™ã€‚
2. ã¾ãŸã¯ \`.vsix\` ãƒ•ã‚¡ã‚¤ãƒ«ã‹ã‚‰ç›´æ¥ã‚¤ãƒ³ã‚¹ãƒˆãƒ¼ãƒ«ã—ã¾ã™:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: '**MIT ãƒ©ã‚¤ã‚»ãƒ³ã‚¹**ã®ä¸‹ã§å…¬é–‹ã•ã‚Œã¦ã„ã¾ã™ã€‚Made with â˜• by **[NexusAG Team](https://github.com/AlperenAKKAYA99)**'
    },
    {
        code: 'zh-CN',
        filename: 'README.zh-CN.md',
        banner: 'assets/banners/banner_zh-CN.png',
        versionBadge: 'ç‰ˆæœ¬',
        langBadge: 'å¤šè¯­è¨€-10ç§åŸç”Ÿè¯­è¨€',
        privacyBadge: 'éšç§å®‰å…¨-100%25æœ¬åœ°æ•°æ®',
        title: 'NexusAG',
        lead: '**NexusAG** æ˜¯ä¸“ä¸º **Google Antigravity IDE** æ‰“é€ çš„æ–°ä¸€ä»£å¤šè´¦æˆ·æ™ºèƒ½æ§åˆ¶ä¸­å¿ƒã€‚è®©å¼€å‘è€…èƒ½å¤Ÿä¸€é”®ç¬æ—¶åˆ‡æ¢å¤šè´¦å·ï¼Œå®æ—¶ç›‘æ§å¤šä¸ª Google è´¦æˆ·çš„ AI é…é¢ä¸é‡ç½®å€’è®¡æ—¶ï¼Œæ·±å±‚è§£æä¸Šä¸‹æ–‡çª—å£ Token æ¶ˆè€—åˆ†çº§æ ‘ï¼Œè‡ªåŠ¨æŒ½æ•‘å¹¶é‡å»ºä¸¢å¤±çš„å¯¹è¯è®°å½•ï¼Œå¹¶é€šè¿‡å…¨å°ºå¯¸ Bento ä»ªè¡¨ç›˜å¯¹å†å²å…¨éƒ¨ Token è´¦å•è¿›è¡Œç²¾ç»†åŒ–æˆæœ¬æ ¸ç®—ã€‚',
        showcaseHeader: 'ğŸ“¸ å¤šè´¦æˆ·æ§åˆ¶ä¸­å¿ƒä¸ UI ç•Œé¢å±•ç¤º (UI Showcase)',
        imgs: {
            img1: ['âš¡ å¤šè´¦æˆ·æ§åˆ¶ä¸­å¿ƒ', 'ä¸€é”®ç¬æ—¶åˆ‡å·ã€å®æ—¶é…é¢è¿›åº¦æ¡ä¸é‡ç½®å€’è®¡æ—¶'],
            img3: ['ğŸ”‘ Token é¢„ç®—ä¸ä¸Šä¸‹æ–‡', 'è‡ªå®šä¹‰é¡¹ç¯å½¢å›¾ã€æ´»è·ƒä¼šè¯ç”¨é‡ä¸å·¥ä½œåŒºè§„åˆ™'],
            img4: ['ğŸ“ˆ ä¾§è¾¹æ ä½¿ç”¨ç»Ÿè®¡', 'ä¼šè¯ Token æ€»é‡ã€æ¯å°æ—¶æ´»è·ƒè¶‹åŠ¿ä¸æœˆåº¦è´¹ç”¨æ˜ç»†'],
            img5: ['ğŸŒ è®¾ç½®ä¸ 10 è¯­è¨€ä¸­å¿ƒ', 'å³æ—¶å“åº”å¼è¯­è¨€åˆ‡æ¢ã€åå°è½®è¯¢é¢‘ç‡ä¸ç´¢å¼•ä¿®å¤'],
            img2: ['ğŸ”‘ ä»¤ç‰Œä¸€é”®æ‰¹é‡æ·»åŠ ', 'å¸¦æ ¼å¼æ ¡éªŒçš„å¤šè¡Œ OAuth Refresh Token æ‰¹é‡å¯¼å…¥çª—å£'],
            img7: ['ğŸ”’ æé€Ÿ Google OAuth ç½‘é¡µæˆæƒ', 'æ”¯æŒæµè§ˆå™¨ 1 é”®å®‰å…¨æˆæƒä¸è‡ªåŠ¨è·³å› IDE é—­ç¯'],
            img6: ['ğŸ” ä¸Šä¸‹æ–‡çª—å£æ·±åº¦è§£æï¼ˆç‹¬ç«‹ç¼–è¾‘æ ‡ç­¾é¡µï¼‰', 'å¤šçº§åˆ†å±‚æ­¥éª¤æ ‘ã€Token åˆ†ç±»å æ¯”è‰²æ¡ä¸ Markdown ä¸€é”®å¯¼å‡º'],
            img8: ['ğŸ“Š å…¨å°ºå¯¸ Bento Token æ·±åº¦æ¶ˆè€—å¤§ç›˜ï¼ˆå…¨å±ç‹¬ç«‹è§†å›¾ï¼‰', 'å…¨å†å²ä¼šè¯ç©¿é€å®¡è®¡ã€GitHub é£æ ¼è´¡çŒ®çƒ­åŠ›å›¾ã€æ¨¡å‹ç²¾ç»†åŒ–å•ä»·è¡¨ä¸é«˜é¢ä¼šè¯æ¦œå•']
        },
        featuresTitle: 'âœ¨ æ ¸å¿ƒç‰¹æ€§ä¸€è§ˆ',
        sectionAccountsTitle: 'âš¡ å¤šè´¦æˆ·æé€Ÿåˆ‡å·ä¸å®æ—¶é…é¢ç›‘æ§',
        sectionAccountsText: `- **æ”¯æŒæ— ä¸Šé™ç»‘å®š** â€” å®Œç¾åŒæ—¶ç®¡ç†å¤šä¸ª Google è´¦æˆ·ï¼Œäº’ä¸å¹²æ‰°ã€‚
- **ä¸€é”®å…ç™»ç¬æ—¶åˆ‡æ¢** â€” æ— éœ€é‡å¤ç™»å½•ï¼Œç›´æ¥åœ¨ä¾§è¾¹æ ç‚¹å‡»å³å¯ç§’çº§åˆ‡æ¢ IDE å½“å‰æ´»è·ƒè´¦å·ã€‚
- **åŠ¨æ€é…é¢å®¹é‡è¿›åº¦æ¡** â€” é¢œè‰²ç›´è§‚åˆ†åŒºï¼ˆğŸŸ¢ >50%ã€ğŸŸ¡ 20-50%ã€ğŸ”´ <20%ï¼‰ï¼Œé…å¤‡ç²¾å‡†çš„é‡ç½®å€’è®¡æ—¶ã€‚
- **çŠ¶æ€æ æ— æ„Ÿå¸¸é©»** â€” ç‚¹å‡»æ˜Ÿå·ï¼ˆâ˜…ï¼‰å³å¯å°†æœ€çˆ±æ¨¡å‹æˆ–é…é¢é’‰åœ¨åº•æ ï¼Œæ— éœ€å±•å¼€é¢æ¿éšæ—¶æŒæ§ã€‚
- **å‰ç½®ä»¤ç‰Œè‡ªåŠ¨ç»­æœŸ** â€” åå°è‡ªåŠ¨ç»­æœŸ access_tokenï¼Œå½»åº•å‘Šåˆ«é•¿æ—¶é—´ç¼–ç ä¸­çš„ 401 è®¤è¯ä¸­æ–­ã€‚
- **è®¢é˜…å¥—é¤ä¸ç§¯åˆ†ä¿¡æ¯** â€” å¿«é€ŸæŸ¥çœ‹è´¦å·æ‰€å±å±‚çº§ï¼ˆUltraã€Premiumã€Freeï¼‰åŠ AI ç§¯åˆ†ä½™é‡ã€‚`,
        sectionI18nTitle: 'ğŸŒ 100% å…¨é‡æœ¬åœ°åŒ–ä¸å³æ—¶æ— åˆ·æ–°å¤šè¯­è¨€å“åº”',
        sectionI18nText: `- **åŸç”Ÿå†…ç½® 10 ç§å›½é™…ä¸»æµè¯­è¨€**: è‹±è¯­ã€åœŸè€³å…¶è¯­ã€å·´è¥¿è‘¡è„ç‰™è¯­ã€è¥¿ç­ç‰™è¯­ã€å¾·è¯­ã€æ³•è¯­ã€æ—¥è¯­ã€ç®€ä½“ä¸­æ–‡ã€å°åœ°è¯­å’Œä¿„è¯­ã€‚
- **ç§’çº§å³æ—¶å“åº”** â€” åœ¨è®¾ç½®é¡µåˆ‡æ¢è¯­è¨€æ—¶ï¼Œ**100%** çš„ç•Œé¢å…ƒç´ ï¼ˆä¾§è¾¹æ ã€å…¨å°ºå¯¸ Bento ä»ªè¡¨ç›˜ã€ä¸Šä¸‹æ–‡æ ‘ã€å¯¹è¯æ¡†åŠç³»ç»Ÿæç¤ºï¼‰ç¬é—´å®Œæˆæœ¬åœ°åŒ–ï¼Œæ— éœ€é‡æ–°åŠ è½½çª—å£ã€‚`,
        sectionTokensTitle: 'ğŸ”‘ Token é¢„ç®—ä¸ä¸Šä¸‹æ–‡æ™ºèƒ½æ´å¯Ÿ',
        sectionTokensText: `- **è‡ªå®šä¹‰é¡¹ç¯å½¢å›¾** â€” ç›´è§‚å‘ˆç° MCP å·¥å…·ã€å…¨å±€è§„åˆ™ã€å·¥ä½œæµå’Œ Skills çš„ Token å ç”¨ã€‚
- **å®æ—¶æ´»è·ƒä¸Šä¸‹æ–‡ç”¨é‡** â€” å®æ—¶ç›‘æ§å½“å‰æ¨¡å‹å•æ¬¡è°ƒç”¨æ¶ˆè€—ä¸æœ€å¤§ä¸Šé™çš„ç™¾åˆ†æ¯”ã€‚
- **å·¥ä½œåŒºè§„åˆ™æ£€æŸ¥å™¨** â€” ç›´è¾¾ \`.agent/\` è§„åˆ™æ–‡ä»¶ï¼Œæ¸…æ™°å‘ˆç°è§¦å‘æ¨¡å¼ï¼ˆ\`always-on\`ã€\`model-decision\`ã€\`manual\`ï¼‰ã€‚`,
        sectionContextTitle: 'ğŸ” ä¸Šä¸‹æ–‡çª—å£æ·±åº¦è§£æï¼ˆå…¨å°ºå¯¸ç‹¬ç«‹æ ‡ç­¾é¡µï¼‰',
        sectionContextText: `- åœ¨ä¾§è¾¹æ ç‚¹å‡» **"æŸ¥çœ‹å®Œæ•´æ˜ç»† â†’"** ä¸€é”®æ‰“å¼€ã€‚
- **å¤šçº§åˆ†å±‚æ ‘çŠ¶å›¾** â€” å®Œæ•´æ‹†è§£ç³»ç»Ÿæç¤ºè¯ã€å·¥å…·è°ƒç”¨ã€MCP ä¸ä¼šè¯è®°å½•çš„ç²¾ç¡® Token ä¸å æ¯”ã€‚
- **è¡Œå†…æ— è·³å‡ºé¢„è§ˆ** â€” ç›´æ¥åœ¨å½“å‰ç•Œé¢æŸ¥çœ‹æç¤ºè¯æ˜ç»†ã€å¤§æ¨¡å‹å›å¤ã€å·¥å…·è¾“å…¥å’Œå‘½ä»¤è¾“å‡ºã€‚
- **ç«ç„°é«˜è€—é¢„è­¦ï¼ˆğŸ”¥ï¼‰** â€” è‡ªåŠ¨æ ‡çº¢æœ€åƒä¸Šä¸‹æ–‡çš„è¶…å¤§æ­¥éª¤ã€‚
- **ä¸€é”®å¯¼å‡º Markdown** â€” æ–¹ä¾¿å­˜æ¡£ä¸å›¢é˜Ÿåˆ†äº«ã€‚`,
        sectionAnalyticsTitle: 'ğŸ“ˆ å…¨å±€ Token æ¶ˆè€—æ·±åº¦åˆ†æä¸ Bento ä»ªè¡¨ç›˜',
        sectionAnalyticsText: `- ç‚¹å‡»ä¾§è¾¹æ  **"æ‰“å¼€å…¨å±åˆ†æå¤§ç›˜ â†’"** æŸ¥çœ‹ã€‚
- **å…¨å†å²å‘¨æœŸå›æº¯** â€” æ·±åº¦æ£€ç´¢æ±‡æ€»æ‚¨åœ¨ Antigravity ä¸­äº§ç”Ÿè¿‡çš„æ‰€æœ‰å†å²ä¼šè¯ã€‚
- **9 é¡¹æ ¸å¿ƒæŒ‡æ ‡** â€” ç»Ÿè®¡è¾“å…¥ã€ç¼“å­˜å‘½ä¸­ã€è¾“å‡ºã€æ€è€ƒ Tokenã€è°ƒç”¨æ€»é¢‘æ¬¡ã€ä¼°ç®—è´¦å•ä¸ç¼“å­˜å‘½ä¸­ç‡ã€‚
- **GitHub é£æ ¼è´¡çŒ®çƒ­åŠ›å›¾** â€” å®Œæ•´æ”¯æŒ 365 å¤©å†å²ç½‘æ ¼ï¼Œé…å¤‡å¹´åº¦åˆ‡æ¢ä¸å³°å€¼æ—¥é«˜äº®ã€‚
- **LiteLLM åŠ¨æ€å®šä»·å¼•æ“** â€” ç²¾ç¡®ç»“åˆæœ€æ–°å®˜æ–¹ API èµ„è´¹ä¸è‡ªå®šä¹‰å•ä»·ï¼Œè´¦å•è®¡ç®—ç²¾å‡†åˆ°åˆ†ã€‚`,
        sectionGuardTitle: 'ğŸ›¡ï¸ ä¼šè¯å®ˆæŠ¤ä¸æ¢å¤ï¼ˆConversation Guardï¼‰',
        sectionGuardText: `- **è‡ªåŠ¨æ£€æµ‹ç£ç›˜å­¤å„¿å¯¹è¯** â€” å¼€æœº 15 ç§’è‡ªåŠ¨æ‰«ææœ¬åœ°ç£ç›˜ \`.pb\` è®°å½•ä¸ä¾§è¾¹æ ç´¢å¼•çš„æ¯”å¯¹å·®å¼‚ã€‚
- **ä¸€é”®è‡ªåŠ¨åŒ–ä¿®å¤** â€” ä¼˜é›…å…³é—­ AGã€ä»ç£ç›˜æé€Ÿé‡å»ºä¾§è¾¹æ ç´¢å¼•å¹¶è‡ªåŠ¨é‡æ‹‰ IDEï¼Œç»ä¸æŸååŸæœ‰æ•°æ®ã€‚`,
        getStartedTitle: 'ğŸš€ å¿«é€Ÿä¸Šæ‰‹',
        installText: `1. åœ¨ Antigravity æ‰©å±•å•†åº—æœç´¢ **NexusAG**ï¼Œç‚¹å‡» **å®‰è£…**ã€‚
2. æˆ–è€…ç›´æ¥é€šè¿‡ \`.vsix\` å®‰è£…åŒ…æœ¬åœ°å®‰è£…:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: 'åŸºäº **MIT è®¸å¯è¯** å¼€æºå‘å¸ƒã€‚ç”± **[NexusAG Team](https://github.com/AlperenAKKAYA99)** å€¾æƒ…æ‰“é€ ã€‚'
    },
    {
        code: 'hi',
        filename: 'README.hi.md',
        banner: 'assets/banners/banner_hi.png',
        versionBadge: 'à¤µà¤°à¥à¤œà¤¼à¤¨',
        langBadge: 'à¤­à¤¾à¤·à¤¾à¤à¤‚-10%20à¤®à¥‚à¤²%20à¤­à¤¾à¤·à¤¾à¤à¤‚',
        privacyBadge: 'à¤—à¥‹à¤ªà¤¨à¥€à¤¯à¤¤à¤¾-100%25%20à¤¸à¥à¤¥à¤¾à¤¨à¥€à¤¯',
        title: 'NexusAG',
        lead: '**NexusAG** **Google Antigravity IDE** à¤•à¥‡ à¤²à¤¿à¤ à¤¡à¤¿à¤œà¤¼à¤¾à¤‡à¤¨ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤…à¤—à¤²à¥€ à¤ªà¥€à¤¢à¤¼à¥€ à¤•à¤¾ à¤¬à¥à¤¦à¥à¤§à¤¿à¤®à¤¾à¤¨ à¤¨à¤¿à¤¯à¤‚à¤¤à¥à¤°à¤£ à¤•à¤•à¥à¤· à¤”à¤° à¤‡à¤‚à¤Ÿà¥‡à¤²à¤¿à¤œà¥‡à¤‚à¤¸ à¤¸à¥‚à¤Ÿ à¤¹à¥ˆà¥¤ à¤¯à¤¹ à¤¡à¥‡à¤µà¤²à¤ªà¤°à¥à¤¸ à¤•à¥‹ 1-à¤•à¥à¤²à¤¿à¤• à¤®à¥‡à¤‚ à¤–à¤¾à¤¤à¥‡ à¤¬à¤¦à¤²à¤¨à¥‡, à¤•à¤ˆ Google à¤ªà¥à¤°à¥‹à¤«à¤¾à¤‡à¤² à¤®à¥‡à¤‚ à¤°à¥€à¤¯à¤²-à¤Ÿà¤¾à¤‡à¤® AI à¤•à¥‹à¤Ÿà¤¾ à¤•à¥€ à¤¨à¤¿à¤—à¤°à¤¾à¤¨à¥€ à¤•à¤°à¤¨à¥‡, à¤•à¥‰à¤¨à¥à¤Ÿà¥‡à¤•à¥à¤¸à¥à¤Ÿ à¤µà¤¿à¤‚à¤¡à¥‹ à¤Ÿà¥‹à¤•à¤¨ à¤¬à¥à¤°à¥‡à¤•à¤¡à¤¾à¤‰à¤¨ à¤•à¤¾ à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£ à¤•à¤°à¤¨à¥‡, à¤¡à¤¿à¤¸à¥à¤• à¤¸à¥‡ à¤–à¥‹à¤ˆ à¤¹à¥à¤ˆ à¤¬à¤¾à¤¤à¤šà¥€à¤¤ à¤•à¥‹ à¤ªà¥à¤¨à¤°à¥à¤ªà¥à¤°à¤¾à¤ªà¥à¤¤ à¤•à¤°à¤¨à¥‡ à¤”à¤° à¤ªà¥‚à¤°à¥‡ à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸ à¤•à¥‡ à¤Ÿà¥‹à¤•à¤¨ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤¾ à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£ à¤•à¤°à¤¨à¥‡ à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¦à¥‡à¤¤à¤¾ à¤¹à¥ˆà¥¤',
        showcaseHeader: 'ğŸ“¸ à¤®à¤²à¥à¤Ÿà¥€-à¤…à¤•à¤¾à¤‰à¤‚à¤Ÿ à¤¸à¥à¤µà¤¿à¤šà¤¬à¥‹à¤°à¥à¤¡ à¤”à¤° à¤¯à¥‚à¤†à¤ˆ à¤—à¥ˆà¤²à¤°à¥€ (UI Showcase)',
        imgs: {
            img1: ['âš¡ à¤®à¤²à¥à¤Ÿà¥€-à¤…à¤•à¤¾à¤‰à¤‚à¤Ÿ à¤¸à¥à¤µà¤¿à¤šà¤¬à¥‹à¤°à¥à¤¡', '1-à¤•à¥à¤²à¤¿à¤• à¤–à¤¾à¤¤à¤¾ à¤¸à¥à¤µà¤¿à¤šà¤¿à¤‚à¤—, à¤°à¥€à¤¯à¤²-à¤Ÿà¤¾à¤‡à¤® à¤•à¥‹à¤Ÿà¤¾ à¤ªà¥à¤°à¤—à¤¤à¤¿ à¤”à¤° à¤°à¥€à¤¸à¥‡à¤Ÿ à¤Ÿà¤¾à¤‡à¤®à¤°'],
            img3: ['ğŸ”‘ à¤Ÿà¥‹à¤•à¤¨ à¤¬à¤œà¤Ÿ à¤”à¤° à¤•à¥‰à¤¨à¥à¤Ÿà¥‡à¤•à¥à¤¸à¥à¤Ÿ', 'à¤•à¤¸à¥à¤Ÿà¤®à¤¾à¤‡à¤œà¤¼à¥‡à¤¶à¤¨ à¤¡à¥‹à¤¨à¤Ÿ, à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¸à¤¤à¥à¤° à¤—à¥‡à¤œ à¤”à¤° à¤¨à¤¿à¤¯à¤®'],
            img4: ['ğŸ“ˆ à¤‰à¤ªà¤¯à¥‹à¤— à¤†à¤‚à¤•à¤¡à¤¼à¥‡ (à¤¸à¤¾à¤‡à¤¡à¤¬à¤¾à¤°)', 'à¤¸à¤¤à¥à¤° à¤Ÿà¥‹à¤•à¤¨ à¤¯à¥‹à¤—, à¤ªà¥à¤°à¤¤à¤¿ à¤˜à¤‚à¤Ÿà¤¾ à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿ à¤”à¤° à¤®à¤¾à¤¸à¤¿à¤• à¤²à¤¾à¤—à¤¤'],
            img5: ['ğŸŒ à¤¸à¥‡à¤Ÿà¤¿à¤‚à¤—à¥à¤¸ à¤”à¤° 10-à¤­à¤¾à¤·à¤¾ à¤•à¥‡à¤‚à¤¦à¥à¤°', 'à¤¤à¥à¤µà¤°à¤¿à¤¤ à¤ªà¥à¤°à¤¤à¤¿à¤•à¥à¤°à¤¿à¤¯à¤¾à¤¶à¥€à¤² à¤­à¤¾à¤·à¤¾ à¤šà¤¯à¤¨à¤•à¤°à¥à¤¤à¤¾, à¤…à¤‚à¤¤à¤°à¤¾à¤² à¤”à¤° à¤®à¤°à¤®à¥à¤®à¤¤'],
            img2: ['ğŸ”‘ à¤Ÿà¥‹à¤•à¤¨ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤–à¤¾à¤¤à¥‡ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚', 'à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¨ à¤•à¥‡ à¤¸à¤¾à¤¥ à¤¬à¥ˆà¤š OAuth à¤°à¥€à¤«à¤¼à¥à¤°à¥‡à¤¶ à¤Ÿà¥‹à¤•à¤¨ à¤ªà¥‡à¤¸à¥à¤Ÿ'],
            img7: ['ğŸ”’ à¤¨à¤¿à¤°à¥à¤¬à¤¾à¤§ Google OAuth à¤ªà¥à¤°à¤®à¤¾à¤£à¥€à¤•à¤°à¤£', 'à¤‘à¤Ÿà¥‹-à¤°à¤¿à¤Ÿà¤°à¥à¤¨ à¤•à¥‡ à¤¸à¤¾à¤¥ 1-à¤•à¥à¤²à¤¿à¤• à¤¬à¥à¤°à¤¾à¤‰à¤œà¤¼à¤° à¤²à¥‰à¤—à¤¿à¤¨'],
            img6: ['ğŸ” à¤•à¥‰à¤¨à¥à¤Ÿà¥‡à¤•à¥à¤¸à¥à¤Ÿ à¤µà¤¿à¤‚à¤¡à¥‹ à¤µà¤¿à¤µà¤°à¤£ (à¤¸à¤‚à¤ªà¤¾à¤¦à¤• à¤Ÿà¥ˆà¤¬)', 'à¤ªà¤¦à¤¾à¤¨à¥à¤•à¥à¤°à¤®à¤¿à¤¤ à¤¸à¥à¤Ÿà¥‡à¤ª à¤Ÿà¥à¤°à¥€, à¤Ÿà¥‹à¤•à¤¨ à¤¶à¥à¤°à¥‡à¤£à¥€ à¤µà¤¿à¤­à¤¾à¤œà¤¨ à¤”à¤° à¤®à¤¾à¤°à¥à¤•à¤¡à¤¾à¤‰à¤¨ à¤¨à¤¿à¤°à¥à¤¯à¤¾à¤¤'],
            img8: ['ğŸ“Š à¤¡à¥€à¤ª à¤Ÿà¥‹à¤•à¤¨ à¤à¤¨à¤¾à¤²à¤¿à¤Ÿà¤¿à¤•à¥à¤¸ à¤¬à¥‡à¤¨à¥à¤Ÿà¥‹ à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡ (à¤ªà¥‚à¤°à¥à¤£ à¤¸à¤‚à¤ªà¤¾à¤¦à¤•)', 'à¤†à¤œà¥€à¤µà¤¨ à¤¬à¤¾à¤¤à¤šà¥€à¤¤ à¤‘à¤¡à¤¿à¤Ÿ, GitHub-à¤¶à¥ˆà¤²à¥€ à¤¹à¥€à¤Ÿà¤®à¥ˆà¤ª, à¤®à¥‰à¤¡à¤² à¤²à¤¾à¤—à¤¤ à¤¤à¤¾à¤²à¤¿à¤•à¤¾ à¤”à¤° à¤¶à¥€à¤°à¥à¤· à¤šà¥ˆà¤Ÿ']
        },
        featuresTitle: 'âœ¨ à¤®à¥à¤–à¥à¤¯ à¤µà¤¿à¤¶à¥‡à¤·à¤¤à¤¾à¤à¤‚',
        sectionAccountsTitle: 'âš¡ à¤®à¤²à¥à¤Ÿà¥€-à¤…à¤•à¤¾à¤‰à¤‚à¤Ÿ à¤¸à¥à¤µà¤¿à¤šà¤¬à¥‹à¤°à¥à¤¡ à¤”à¤° à¤°à¥€à¤¯à¤²-à¤Ÿà¤¾à¤‡à¤® à¤•à¥‹à¤Ÿà¤¾ à¤Ÿà¥à¤°à¥ˆà¤•à¤¿à¤‚à¤—',
        sectionAccountsText: `- **à¤…à¤¸à¥€à¤®à¤¿à¤¤ à¤–à¤¾à¤¤à¥‡** â€” à¤¬à¤¿à¤¨à¤¾ à¤•à¤¿à¤¸à¥€ à¤°à¥à¤•à¤¾à¤µà¤Ÿ à¤•à¥‡ à¤à¤• à¤¸à¤¾à¤¥ à¤•à¤ˆ Google à¤–à¤¾à¤¤à¥‹à¤‚ à¤•à¥€ à¤¨à¤¿à¤—à¤°à¤¾à¤¨à¥€ à¤•à¤°à¥‡à¤‚à¥¤
- **1-à¤•à¥à¤²à¤¿à¤• à¤¤à¥à¤µà¤°à¤¿à¤¤ à¤¸à¥à¤µà¤¿à¤šà¤¿à¤‚à¤—** â€” à¤¸à¤¾à¤‡à¤¡à¤¬à¤¾à¤° à¤¸à¥‡ à¤¸à¥€à¤§à¥‡ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤–à¤¾à¤¤à¥‡ à¤•à¥‹ à¤¤à¥à¤°à¤‚à¤¤ à¤¬à¤¦à¤²à¥‡à¤‚à¥¤
- **à¤°à¥€à¤¯à¤²-à¤Ÿà¤¾à¤‡à¤® à¤•à¥‹à¤Ÿà¤¾ à¤—à¥‡à¤œ** â€” à¤°à¤‚à¤—-à¤•à¥‹à¤¡à¤¿à¤¤ à¤•à¥à¤·à¤®à¤¤à¤¾ à¤¸à¤‚à¤•à¥‡à¤¤à¤• (ğŸŸ¢ >50%, ğŸŸ¡ 20-50%, ğŸ”´ <20%) à¤”à¤° à¤¸à¤Ÿà¥€à¤• à¤°à¥€à¤¸à¥‡à¤Ÿ à¤Ÿà¤¾à¤‡à¤®à¤°à¥¤
- **à¤¸à¥à¤Ÿà¥‡à¤Ÿà¤¸ à¤¬à¤¾à¤° à¤à¤•à¥€à¤•à¤°à¤£** â€” à¤ªà¤¸à¤‚à¤¦à¥€à¤¦à¤¾ à¤®à¥‰à¤¡à¤² à¤•à¥‹ à¤¸à¥à¤Ÿà¤¾à¤° (â˜…) à¤•à¤°à¥‡à¤‚ à¤”à¤° à¤¬à¤¿à¤¨à¤¾ à¤ªà¥ˆà¤¨à¤² à¤–à¥‹à¤²à¥‡ à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤¦à¥‡à¤–à¥‡à¤‚à¥¤
- **à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤Ÿà¥‹à¤•à¤¨ à¤¨à¤µà¥€à¤¨à¥€à¤•à¤°à¤£** â€” à¤¸à¥à¤µà¤šà¤¾à¤²à¤¿à¤¤ à¤¬à¥ˆà¤•à¤—à¥à¤°à¤¾à¤‰à¤‚à¤¡ à¤°à¥€à¤«à¥à¤°à¥‡à¤¶ à¤²à¤‚à¤¬à¥‡ à¤¸à¤¤à¥à¤°à¥‹à¤‚ à¤•à¥‡ à¤¦à¥Œà¤°à¤¾à¤¨ 401 à¤¤à¥à¤°à¥à¤Ÿà¤¿à¤¯à¥‹à¤‚ à¤•à¥‹ à¤°à¥‹à¤•à¤¤à¤¾ à¤¹à¥ˆà¥¤`,
        sectionI18nTitle: 'ğŸŒ 100% à¤¬à¤¹à¥à¤­à¤¾à¤·à¥€ à¤¸à¤®à¤°à¥à¤¥à¤¨ à¤”à¤° à¤¤à¥à¤µà¤°à¤¿à¤¤ à¤ªà¥à¤°à¤¤à¤¿à¤•à¥à¤°à¤¿à¤¯à¤¾à¤¶à¥€à¤² à¤¸à¥à¤µà¤¿à¤šà¤¿à¤‚à¤—',
        sectionI18nText: `- **10 à¤®à¥‚à¤² à¤­à¤¾à¤·à¤¾à¤à¤‚**: à¤…à¤‚à¤—à¥à¤°à¥‡à¤œà¥€, à¤¤à¥à¤°à¥à¤•à¥€, à¤ªà¥à¤°à¥à¤¤à¤—à¤¾à¤²à¥€, à¤¸à¥à¤ªà¥‡à¤¨à¤¿à¤¶, à¤œà¤°à¥à¤®à¤¨, à¤«à¥à¤°à¥‡à¤‚à¤š, à¤œà¤¾à¤ªà¤¾à¤¨à¥€, à¤šà¥€à¤¨à¥€, à¤¹à¤¿à¤¨à¥à¤¦à¥€ à¤”à¤° à¤°à¥‚à¤¸à¥€à¥¤
- **à¤¬à¤¿à¤¨à¤¾ à¤ªà¥à¤¨à¤ƒ à¤²à¥‹à¤¡ à¤•à¤¿à¤ à¤¤à¥à¤µà¤°à¤¿à¤¤ à¤¸à¥à¤µà¤¿à¤šà¤¿à¤‚à¤—** â€” à¤¸à¥‡à¤Ÿà¤¿à¤‚à¤—à¥à¤¸ à¤®à¥‡à¤‚ à¤­à¤¾à¤·à¤¾ à¤¬à¤¦à¤²à¤¨à¥‡ à¤ªà¤° **100% à¤‡à¤‚à¤Ÿà¤°à¤«à¤¼à¥‡à¤¸ à¤¤à¥à¤°à¤‚à¤¤ à¤¬à¤¦à¤² à¤œà¤¾à¤¤à¤¾ à¤¹à¥ˆ**à¥¤`,
        sectionTokensTitle: 'ğŸ”‘ à¤Ÿà¥‹à¤•à¤¨ à¤¬à¤œà¤Ÿ à¤”à¤° à¤•à¥‰à¤¨à¥à¤Ÿà¥‡à¤•à¥à¤¸à¥à¤Ÿ à¤‡à¤‚à¤Ÿà¥‡à¤²à¤¿à¤œà¥‡à¤‚à¤¸',
        sectionTokensText: `- **à¤•à¤¸à¥à¤Ÿà¤®à¤¾à¤‡à¤œà¤¼à¥‡à¤¶à¤¨ à¤¬à¤œà¤Ÿ à¤¡à¥‹à¤¨à¤Ÿ** â€” MCP à¤Ÿà¥‚à¤²à¥à¤¸, à¤°à¥‚à¤²à¥à¤¸, à¤µà¤°à¥à¤•à¤«à¤¼à¥à¤²à¥‹ à¤”à¤° à¤¸à¥à¤•à¤¿à¤²à¥à¤¸ à¤•à¤¾ à¤Ÿà¥‹à¤•à¤¨ à¤‰à¤ªà¤¯à¥‹à¤— à¤¦à¥‡à¤–à¥‡à¤‚à¥¤
- **à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤•à¥‰à¤¨à¥à¤Ÿà¥‡à¤•à¥à¤¸à¥à¤Ÿ à¤—à¥‡à¤œ** â€” à¤®à¥‰à¤¡à¤² à¤•à¥€ à¤¸à¥€à¤®à¤¾ à¤”à¤° à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤¿à¤ à¤—à¤ à¤Ÿà¥‹à¤•à¤¨ à¤•à¥€ à¤¤à¥à¤²à¤¨à¤¾ à¤°à¥€à¤¯à¤²-à¤Ÿà¤¾à¤‡à¤® à¤®à¥‡à¤‚ à¤•à¤°à¥‡à¤‚à¥¤`,
        sectionContextTitle: 'ğŸ” à¤•à¥‰à¤¨à¥à¤Ÿà¥‡à¤•à¥à¤¸à¥à¤Ÿ à¤µà¤¿à¤‚à¤¡à¥‹ à¤¡à¥à¤°à¤¿à¤²-à¤¡à¤¾à¤‰à¤¨ (à¤ªà¥‚à¤°à¥à¤£ à¤¸à¤‚à¤ªà¤¾à¤¦à¤• à¤Ÿà¥ˆà¤¬)',
        sectionContextText: `- **"à¤¸à¤­à¥€ à¤¦à¥‡à¤–à¥‡à¤‚ â†’"** à¤ªà¤° à¤•à¥à¤²à¤¿à¤• à¤•à¤°à¤•à¥‡ à¤¸à¥€à¤§à¥‡ à¤ªà¤¹à¥à¤‚à¤šà¥‡à¤‚à¥¤
- **à¤ªà¤¦à¤¾à¤¨à¥à¤•à¥à¤°à¤®à¤¿à¤¤ à¤¸à¥à¤Ÿà¥‡à¤ª à¤Ÿà¥à¤°à¥€** â€” à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤ªà¥à¤°à¥‰à¤®à¥à¤ªà¥à¤Ÿ, à¤Ÿà¥‚à¤²à¥à¤¸, MCP à¤”à¤° à¤šà¥ˆà¤Ÿ à¤¸à¤‚à¤¦à¥‡à¤¶à¥‹à¤‚ à¤•à¤¾ à¤¸à¤Ÿà¥€à¤• à¤Ÿà¥‹à¤•à¤¨ à¤µà¤¿à¤­à¤¾à¤œà¤¨à¥¤
- **à¤‡à¤¨à¤²à¤¾à¤‡à¤¨ à¤¸à¥à¤Ÿà¥‡à¤ª à¤ªà¥‚à¤°à¥à¤µà¤¾à¤µà¤²à¥‹à¤•à¤¨** â€” IDE à¤›à¥‹à¤¡à¤¼à¥‡ à¤¬à¤¿à¤¨à¤¾ à¤ªà¥à¤°à¤¤à¥à¤¯à¥‡à¤• à¤¸à¥à¤Ÿà¥‡à¤ª à¤•à¤¾ à¤†à¤‰à¤Ÿà¤ªà¥à¤Ÿ à¤¦à¥‡à¤–à¥‡à¤‚à¥¤
- **à¤«à¥à¤²à¥‡à¤® à¤¬à¥ˆà¤œ (ğŸ”¥)** â€” à¤¸à¤¬à¤¸à¥‡ à¤­à¤¾à¤°à¥€ à¤Ÿà¥‹à¤•à¤¨ à¤‰à¤ªà¤­à¥‹à¤•à¥à¤¤à¤¾à¤“à¤‚ à¤•à¥€ à¤¤à¥à¤°à¤‚à¤¤ à¤ªà¤¹à¤šà¤¾à¤¨ à¤•à¤°à¥‡à¤‚à¥¤`,
        sectionAnalyticsTitle: 'ğŸ“ˆ à¤¡à¥€à¤ª à¤Ÿà¥‹à¤•à¤¨ à¤à¤¨à¤¾à¤²à¤¿à¤Ÿà¤¿à¤•à¥à¤¸ à¤”à¤° à¤¬à¥‡à¤¨à¥à¤Ÿà¥‹ à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡',
        sectionAnalyticsText: `- **"à¤ªà¥‚à¤°à¤¾ à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡ à¤–à¥‹à¤²à¥‡à¤‚ â†’"** à¤ªà¤° à¤•à¥à¤²à¤¿à¤• à¤•à¤°à¤•à¥‡ à¤¦à¥‡à¤–à¥‡à¤‚à¥¤
- **à¤†à¤œà¥€à¤µà¤¨ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤¾ à¤¸à¤¾à¤°à¤¾à¤‚à¤¶** â€” Antigravity à¤®à¥‡à¤‚ à¤†à¤ªà¤•à¥€ à¤¸à¤­à¥€ à¤ªà¤¿à¤›à¤²à¥€ à¤¬à¤¾à¤¤à¤šà¥€à¤¤à¥‹à¤‚ à¤•à¤¾ à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤
- **9 à¤ªà¥à¤°à¤®à¥à¤– KPI à¤®à¥‡à¤Ÿà¥à¤°à¤¿à¤•à¥à¤¸** â€” à¤‡à¤¨à¤ªà¥à¤Ÿ, à¤•à¥ˆà¤¶ à¤°à¥€à¤¡, à¤†à¤‰à¤Ÿà¤ªà¥à¤Ÿ, à¤°à¥€à¤œà¤¨à¤¿à¤‚à¤— à¤Ÿà¥‹à¤•à¤¨, à¤²à¤¾à¤—à¤¤ à¤”à¤° à¤•à¥ˆà¤¶ à¤¹à¤¿à¤Ÿ à¤¦à¤°à¥¤
- **GitHub à¤¸à¥à¤Ÿà¤¾à¤‡à¤² à¤¹à¥€à¤Ÿà¤®à¥ˆà¤ª** â€” 365 à¤¦à¤¿à¤¨à¥‹à¤‚ à¤•à¤¾ à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿ à¤—à¥à¤°à¤¿à¤¡à¥¤`,
        sectionGuardTitle: 'ğŸ›¡ï¸ à¤•à¤¨à¥à¤µà¤°à¥à¤¸à¥‡à¤¶à¤¨ à¤—à¤¾à¤°à¥à¤¡ (Conversation Guard)',
        sectionGuardText: `- **à¤–à¥‹à¤ˆ à¤¹à¥à¤ˆ à¤¬à¤¾à¤¤à¤šà¥€à¤¤ à¤•à¤¾ à¤ªà¤¤à¤¾ à¤²à¤—à¤¾à¤¨à¤¾** â€” à¤¡à¤¿à¤¸à¥à¤• à¤ªà¤° à¤®à¥Œà¤œà¥‚à¤¦ \`.pb\` à¤«à¤¼à¤¾à¤‡à¤²à¥‹à¤‚ à¤•à¥€ à¤¤à¥à¤²à¤¨à¤¾ à¤¸à¤¾à¤‡à¤¡à¤¬à¤¾à¤° à¤‡à¤‚à¤¡à¥‡à¤•à¥à¤¸ à¤¸à¥‡ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤
- **1-à¤•à¥à¤²à¤¿à¤• à¤®à¤°à¤®à¥à¤®à¤¤** â€” à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤°à¥‚à¤ª à¤¸à¥‡ à¤‡à¤‚à¤¡à¥‡à¤•à¥à¤¸ à¤•à¥‹ à¤ªà¥à¤¨à¤°à¥à¤¨à¤¿à¤°à¥à¤®à¤¿à¤¤ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆ à¤”à¤° IDE à¤•à¥‹ à¤ªà¥à¤¨à¤ƒ à¤ªà¥à¤°à¤¾à¤°à¤‚à¤­ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤`,
        getStartedTitle: 'ğŸš€ à¤¶à¥à¤°à¥à¤†à¤¤ à¤•à¤°à¥‡à¤‚',
        installText: `1. Antigravity Extension Marketplace à¤®à¥‡à¤‚ **NexusAG** à¤–à¥‹à¤œà¥‡à¤‚ à¤”à¤° **Install** à¤ªà¤° à¤•à¥à¤²à¤¿à¤• à¤•à¤°à¥‡à¤‚à¥¤
2. à¤¯à¤¾ à¤¸à¥€à¤§à¥‡ \`.vsix\` à¤«à¤¼à¤¾à¤‡à¤² à¤¸à¥‡ à¤‡à¤‚à¤¸à¥à¤Ÿà¥‰à¤² à¤•à¤°à¥‡à¤‚:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: '**MIT à¤²à¤¾à¤‡à¤¸à¥‡à¤‚à¤¸** à¤•à¥‡ à¤¤à¤¹à¤¤ à¤µà¤¿à¤¤à¤°à¤¿à¤¤à¥¤ **[NexusAG Team](https://github.com/AlperenAKKAYA99)** à¤¦à¥à¤µà¤¾à¤°à¤¾ â˜• à¤•à¥‡ à¤¸à¤¾à¤¥ à¤µà¤¿à¤•à¤¸à¤¿à¤¤à¥¤'
    },
    {
        code: 'ru',
        filename: 'README.ru.md',
        banner: 'assets/banners/banner_ru.png',
        versionBadge: 'Ğ²ĞµÑ€ÑĞ¸Ñ',
        langBadge: 'ÑĞ·Ñ‹ĞºĞ¸-10%20Ğ½Ğ°Ñ‚Ğ¸Ğ²Ğ½Ñ‹Ñ…',
        privacyBadge: 'Ğ¿Ñ€Ğ¸Ğ²Ğ°Ñ‚Ğ½Ğ¾ÑÑ‚ÑŒ-100%25%20Ğ»Ğ¾ĞºĞ°Ğ»ÑŒĞ½Ğ¾',
        title: 'NexusAG',
        lead: '**NexusAG** â€” ÑÑ‚Ğ¾ Ğ¿Ğ°Ğ½ĞµĞ»ÑŒ ÑƒĞ¿Ñ€Ğ°Ğ²Ğ»ĞµĞ½Ğ¸Ñ Ğ½Ğ¾Ğ²Ğ¾Ğ³Ğ¾ Ğ¿Ğ¾ĞºĞ¾Ğ»ĞµĞ½Ğ¸Ñ Ğ¸ Ğ¸Ğ½Ñ‚ĞµĞ»Ğ»ĞµĞºÑ‚ÑƒĞ°Ğ»ÑŒĞ½Ñ‹Ğ¹ Ñ†ĞµĞ½Ñ‚Ñ€ Ğ´Ğ»Ñ **Google Antigravity IDE**. Ğ Ğ°ÑÑˆĞ¸Ñ€ĞµĞ½Ğ¸Ğµ Ğ¿Ğ¾Ğ·Ğ²Ğ¾Ğ»ÑĞµÑ‚ Ñ€Ğ°Ğ·Ñ€Ğ°Ğ±Ğ¾Ñ‚Ñ‡Ğ¸ĞºĞ°Ğ¼ Ğ¿ĞµÑ€ĞµĞºĞ»ÑÑ‡Ğ°Ñ‚ÑŒ ÑƒÑ‡ĞµÑ‚Ğ½Ñ‹Ğµ Ğ·Ğ°Ğ¿Ğ¸ÑĞ¸ Ğ² 1 ĞºĞ»Ğ¸Ğº, Ğ¾Ñ‚ÑĞ»ĞµĞ¶Ğ¸Ğ²Ğ°Ñ‚ÑŒ Ğ»Ğ¸Ğ¼Ğ¸Ñ‚Ñ‹ AI Ğ² Ñ€ĞµĞ°Ğ»ÑŒĞ½Ğ¾Ğ¼ Ğ²Ñ€ĞµĞ¼ĞµĞ½Ğ¸ Ğ´Ğ»Ñ Ğ½ĞµÑĞºĞ¾Ğ»ÑŒĞºĞ¸Ñ… Ğ¿Ñ€Ğ¾Ñ„Ğ¸Ğ»ĞµĞ¹ Google, Ğ´ĞµÑ‚Ğ°Ğ»ÑŒĞ½Ğ¾ Ğ¸ÑÑĞ»ĞµĞ´Ğ¾Ğ²Ğ°Ñ‚ÑŒ Ğ¾ĞºĞ½Ğ¾ ĞºĞ¾Ğ½Ñ‚ĞµĞºÑÑ‚Ğ°, Ğ²Ğ¾ÑÑÑ‚Ğ°Ğ½Ğ°Ğ²Ğ»Ğ¸Ğ²Ğ°Ñ‚ÑŒ ÑƒÑ‚ĞµÑ€ÑĞ½Ğ½Ñ‹Ğµ Ğ´Ğ¸Ğ°Ğ»Ğ¾Ğ³Ğ¸ Ñ Ğ´Ğ¸ÑĞºĞ° Ğ¸ Ğ¿Ñ€Ğ¾Ğ²Ğ¾Ğ´Ğ¸Ñ‚ÑŒ Ğ³Ğ»ÑƒĞ±Ğ¾ĞºĞ¸Ğ¹ Ñ„Ğ¸Ğ½Ğ°Ğ½ÑĞ¾Ğ²Ñ‹Ğ¹ Ğ°ÑƒĞ´Ğ¸Ñ‚ Ñ€Ğ°ÑÑ…Ğ¾Ğ´Ğ¾Ğ² Ğ½Ğ° Ñ‚Ğ¾ĞºĞµĞ½Ñ‹ Ñ‡ĞµÑ€ĞµĞ· Ğ¿Ğ¾Ğ»Ğ½Ğ¾ÑĞºÑ€Ğ°Ğ½Ğ½Ñ‹Ğ¹ Ğ´Ğ°ÑˆĞ±Ğ¾Ñ€Ğ´.',
        showcaseHeader: 'ğŸ“¸ ĞœÑƒĞ»ÑŒÑ‚Ğ¸-Ğ°ĞºĞºĞ°ÑƒĞ½Ñ‚Ñ‹ Ğ¸ Ğ³Ğ°Ğ»ĞµÑ€ĞµÑ Ğ¸Ğ½Ñ‚ĞµÑ€Ñ„ĞµĞ¹ÑĞ° (UI Showcase)',
        imgs: {
            img1: ['âš¡ ĞœÑƒĞ»ÑŒÑ‚Ğ¸-Ğ°ĞºĞºĞ°ÑƒĞ½Ñ‚Ñ‹', 'ĞŸĞµÑ€ĞµĞºĞ»ÑÑ‡ĞµĞ½Ğ¸Ğµ Ğ² 1 ĞºĞ»Ğ¸Ğº, Ğ¿Ñ€Ğ¾Ğ³Ñ€ĞµÑÑ ĞºĞ²Ğ¾Ñ‚ Ğ¸ Ñ‚Ğ°Ğ¹Ğ¼ĞµÑ€Ñ‹ ÑĞ±Ñ€Ğ¾ÑĞ°'],
            img3: ['ğŸ”‘ Ğ‘ÑĞ´Ğ¶ĞµÑ‚ Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ² Ğ¸ ĞºĞ¾Ğ½Ñ‚ĞµĞºÑÑ‚', 'ĞšĞ¾Ğ»ÑŒÑ†ĞµĞ²Ğ°Ñ Ğ´Ğ¸Ğ°Ğ³Ñ€Ğ°Ğ¼Ğ¼Ğ° ĞºĞ°ÑÑ‚Ğ¾Ğ¼Ğ¸Ğ·Ğ°Ñ†Ğ¸Ğ¹, Ğ°ĞºÑ‚Ğ¸Ğ²Ğ½Ğ°Ñ ÑĞµÑÑĞ¸Ñ Ğ¸ Ğ¿Ñ€Ğ°Ğ²Ğ¸Ğ»Ğ°'],
            img4: ['ğŸ“ˆ Ğ¡Ñ‚Ğ°Ñ‚Ğ¸ÑÑ‚Ğ¸ĞºĞ° Ğ¸ÑĞ¿Ğ¾Ğ»ÑŒĞ·Ğ¾Ğ²Ğ°Ğ½Ğ¸Ñ (Ğ‘Ğ¾ĞºĞ¾Ğ²Ğ°Ñ Ğ¿Ğ°Ğ½ĞµĞ»ÑŒ)', 'Ğ˜Ñ‚Ğ¾Ğ³Ğ¸ Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ² ÑĞµÑÑĞ¸Ğ¸, Ğ¿Ğ¾Ñ‡Ğ°ÑĞ¾Ğ²Ğ°Ñ Ğ°ĞºÑ‚Ğ¸Ğ²Ğ½Ğ¾ÑÑ‚ÑŒ Ğ¸ Ğ¿Ğ¾Ğ¼ĞµÑÑÑ‡Ğ½Ñ‹Ğµ Ğ·Ğ°Ñ‚Ñ€Ğ°Ñ‚Ñ‹'],
            img5: ['ğŸŒ ĞĞ°ÑÑ‚Ñ€Ğ¾Ğ¹ĞºĞ¸ Ğ¸ 10 ÑĞ·Ñ‹ĞºĞ¾Ğ²', 'ĞœĞ³Ğ½Ğ¾Ğ²ĞµĞ½Ğ½Ñ‹Ğ¹ Ğ¿ĞµÑ€ĞµĞºĞ»ÑÑ‡Ğ°Ñ‚ĞµĞ»ÑŒ ÑĞ·Ñ‹ĞºĞ°, Ğ¸Ğ½Ñ‚ĞµÑ€Ğ²Ğ°Ğ»Ñ‹ Ğ¾Ğ¿Ñ€Ğ¾ÑĞ° Ğ¸ ÑĞºĞ°Ğ½Ğ¸Ñ€Ğ¾Ğ²Ğ°Ğ½Ğ¸Ğµ'],
            img2: ['ğŸ”‘ Ğ”Ğ¾Ğ±Ğ°Ğ²Ğ»ĞµĞ½Ğ¸Ğµ Ğ°ĞºĞºĞ°ÑƒĞ½Ñ‚Ğ¾Ğ² Ğ¿Ğ¾ Ñ‚Ğ¾ĞºĞµĞ½Ñƒ', 'ĞŸĞ°ĞºĞµÑ‚Ğ½Ñ‹Ğ¹ Ğ²Ğ²Ğ¾Ğ´ OAuth refresh-Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ² Ñ Ğ²Ğ°Ğ»Ğ¸Ğ´Ğ°Ñ†Ğ¸ĞµĞ¹'],
            img7: ['ğŸ”’ Ğ‘ĞµÑÑˆĞ¾Ğ²Ğ½Ğ°Ñ Ğ°Ğ²Ñ‚Ğ¾Ñ€Ğ¸Ğ·Ğ°Ñ†Ğ¸Ñ Google OAuth', 'Ğ’Ñ…Ğ¾Ğ´ Ñ‡ĞµÑ€ĞµĞ· Ğ±Ñ€Ğ°ÑƒĞ·ĞµÑ€ Ğ² 1 ĞºĞ»Ğ¸Ğº Ñ Ğ°Ğ²Ñ‚Ğ¾Ğ¼Ğ°Ñ‚Ğ¸Ñ‡ĞµÑĞºĞ¸Ğ¼ Ğ²Ğ¾Ğ·Ğ²Ñ€Ğ°Ñ‚Ğ¾Ğ¼'],
            img6: ['ğŸ” Ğ”ĞµÑ‚Ğ°Ğ»Ğ¸Ğ·Ğ°Ñ†Ğ¸Ñ Ğ¾ĞºĞ½Ğ° ĞºĞ¾Ğ½Ñ‚ĞµĞºÑÑ‚Ğ° (Ğ’ĞºĞ»Ğ°Ğ´ĞºĞ° Ñ€ĞµĞ´Ğ°ĞºÑ‚Ğ¾Ñ€Ğ°)', 'Ğ˜ĞµÑ€Ğ°Ñ€Ñ…Ğ¸Ñ‡ĞµÑĞºĞ¾Ğµ Ğ´ĞµÑ€ĞµĞ²Ğ¾ ÑˆĞ°Ğ³Ğ¾Ğ², ĞºĞ°Ñ‚ĞµĞ³Ğ¾Ñ€Ğ¸Ğ¸ Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ² Ğ¸ ÑĞºÑĞ¿Ğ¾Ñ€Ñ‚ Ğ² Markdown'],
            img8: ['ğŸ“Š ĞŸĞ¾Ğ»Ğ½Ğ¾ÑĞºÑ€Ğ°Ğ½Ğ½Ñ‹Ğ¹ Ğ´Ğ°ÑˆĞ±Ğ¾Ñ€Ğ´ Bento Ğ³Ğ»ÑƒĞ±Ğ¾ĞºĞ¾Ğ¹ Ğ°Ğ½Ğ°Ğ»Ğ¸Ñ‚Ğ¸ĞºĞ¸ Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ²', 'ĞÑƒĞ´Ğ¸Ñ‚ Ğ´Ğ¸Ğ°Ğ»Ğ¾Ğ³Ğ¾Ğ² Ğ·Ğ° Ğ²ÑĞµ Ğ²Ñ€ĞµĞ¼Ñ, Ñ‚ĞµĞ¿Ğ»Ğ¾Ğ²Ğ°Ñ ĞºĞ°Ñ€Ñ‚Ğ° GitHub, Ñ€Ğ°ÑÑ‡ĞµÑ‚ Ğ·Ğ°Ñ‚Ñ€Ğ°Ñ‚ Ğ¿Ğ¾ Ğ¼Ğ¾Ğ´ĞµĞ»ÑĞ¼ Ğ¸ Ñ‚Ğ¾Ğ¿ Ğ´Ğ¸Ğ°Ğ»Ğ¾Ğ³Ğ¾Ğ²']
        },
        featuresTitle: 'âœ¨ ĞšĞ»ÑÑ‡ĞµĞ²Ñ‹Ğµ Ğ²Ğ¾Ğ·Ğ¼Ğ¾Ğ¶Ğ½Ğ¾ÑÑ‚Ğ¸',
        sectionAccountsTitle: 'âš¡ ĞœÑƒĞ»ÑŒÑ‚Ğ¸-Ğ°ĞºĞºĞ°ÑƒĞ½Ñ‚Ñ‹ Ğ¸ Ğ¼Ğ¾Ğ½Ğ¸Ñ‚Ğ¾Ñ€Ğ¸Ğ½Ğ³ ĞºĞ²Ğ¾Ñ‚ Ğ² Ñ€ĞµĞ°Ğ»ÑŒĞ½Ğ¾Ğ¼ Ğ²Ñ€ĞµĞ¼ĞµĞ½Ğ¸',
        sectionAccountsText: `- **ĞĞµĞ¾Ğ³Ñ€Ğ°Ğ½Ğ¸Ñ‡ĞµĞ½Ğ½Ğ¾Ğµ Ñ‡Ğ¸ÑĞ»Ğ¾ Ğ°ĞºĞºĞ°ÑƒĞ½Ñ‚Ğ¾Ğ²** â€” ĞĞ´Ğ½Ğ¾Ğ²Ñ€ĞµĞ¼ĞµĞ½Ğ½Ğ¾Ğµ Ğ¾Ñ‚ÑĞ»ĞµĞ¶Ğ¸Ğ²Ğ°Ğ½Ğ¸Ğµ Ğ½ĞµÑĞºĞ¾Ğ»ÑŒĞºĞ¸Ñ… Ğ°ĞºĞºĞ°ÑƒĞ½Ñ‚Ğ¾Ğ² Google Ğ±ĞµĞ· ĞºĞ¾Ğ½Ñ„Ğ»Ğ¸ĞºÑ‚Ğ¾Ğ².
- **ĞœĞ³Ğ½Ğ¾Ğ²ĞµĞ½Ğ½Ğ¾Ğµ Ğ¿ĞµÑ€ĞµĞºĞ»ÑÑ‡ĞµĞ½Ğ¸Ğµ Ğ² 1 ĞºĞ»Ğ¸Ğº** â€” ĞœĞµĞ½ÑĞ¹Ñ‚Ğµ Ğ°ĞºÑ‚Ğ¸Ğ²Ğ½Ñ‹Ğ¹ Ğ¿Ñ€Ğ¾Ñ„Ğ¸Ğ»ÑŒ IDE Ğ¿Ñ€ÑĞ¼Ğ¾ Ğ¸Ğ· Ğ±Ğ¾ĞºĞ¾Ğ²Ğ¾Ğ¹ Ğ¿Ğ°Ğ½ĞµĞ»Ğ¸ Ğ±ĞµĞ· Ğ²Ñ‹Ñ…Ğ¾Ğ´Ğ° Ğ¸Ğ· ÑĞ¸ÑÑ‚ĞµĞ¼Ñ‹.
- **Ğ¦Ğ²ĞµÑ‚Ğ¾Ğ²Ğ°Ñ Ğ¸Ğ½Ğ´Ğ¸ĞºĞ°Ñ†Ğ¸Ñ ĞµĞ¼ĞºĞ¾ÑÑ‚Ğ¸** â€” ĞĞ°Ğ³Ğ»ÑĞ´Ğ½Ñ‹Ğµ Ğ¸Ğ½Ğ´Ğ¸ĞºĞ°Ñ‚Ğ¾Ñ€Ñ‹ (ğŸŸ¢ >50%, ğŸŸ¡ 20-50%, ğŸ”´ <20%) Ğ¸ Ñ‚Ğ¾Ñ‡Ğ½Ñ‹Ğµ Ñ‚Ğ°Ğ¹Ğ¼ĞµÑ€Ñ‹ ÑĞ±Ñ€Ğ¾ÑĞ° Ğ»Ğ¸Ğ¼Ğ¸Ñ‚Ğ¾Ğ².
- **Ğ˜Ğ½Ñ‚ĞµĞ³Ñ€Ğ°Ñ†Ğ¸Ñ ÑĞ¾ ÑÑ‚Ñ€Ğ¾ĞºĞ¾Ğ¹ ÑĞ¾ÑÑ‚Ğ¾ÑĞ½Ğ¸Ñ** â€” Ğ—Ğ°ĞºÑ€ĞµĞ¿Ğ»ÑĞ¹Ñ‚Ğµ Ğ¼Ğ¾Ğ´ĞµĞ»Ğ¸ Ğ·Ğ²ĞµĞ·Ğ´Ğ¾Ñ‡ĞºĞ¾Ğ¹ (â˜…) Ğ´Ğ»Ñ Ğ¿Ğ¾ÑÑ‚Ğ¾ÑĞ½Ğ½Ğ¾Ğ³Ğ¾ ĞºĞ¾Ğ½Ñ‚Ñ€Ğ¾Ğ»Ñ Ğ² ÑÑ‚Ñ€Ğ¾ĞºĞµ ÑĞ¾ÑÑ‚Ğ¾ÑĞ½Ğ¸Ñ.
- **Ğ£Ğ¿Ñ€ĞµĞ¶Ğ´Ğ°ÑÑ‰ĞµĞµ Ğ¾Ğ±Ğ½Ğ¾Ğ²Ğ»ĞµĞ½Ğ¸Ğµ Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ²** â€” Ğ¤Ğ¾Ğ½Ğ¾Ğ²Ğ¾Ğµ Ğ¾Ğ±Ğ½Ğ¾Ğ²Ğ»ĞµĞ½Ğ¸Ğµ access_token Ğ¿Ñ€ĞµĞ´Ğ¾Ñ‚Ğ²Ñ€Ğ°Ñ‰Ğ°ĞµÑ‚ Ğ¾ÑˆĞ¸Ğ±ĞºĞ¸ Ğ°Ğ²Ñ‚Ğ¾Ñ€Ğ¸Ğ·Ğ°Ñ†Ğ¸Ğ¸ 401.
- **Ğ¡Ğ²ĞµĞ´ĞµĞ½Ğ¸Ñ Ğ¾ Ñ‚Ğ°Ñ€Ğ¸Ñ„Ğµ** â€” ĞÑ‚Ğ¾Ğ±Ñ€Ğ°Ğ¶ĞµĞ½Ğ¸Ğµ ÑƒÑ€Ğ¾Ğ²Ğ½Ñ Ğ¿Ğ¾Ğ´Ğ¿Ğ¸ÑĞºĞ¸ (Ultra, Premium, Free) Ğ¸ Ğ¾ÑÑ‚Ğ°Ñ‚ĞºĞ° ĞºÑ€ĞµĞ´Ğ¸Ñ‚Ğ¾Ğ².`,
        sectionI18nTitle: 'ğŸŒ 100% ĞœÑƒĞ»ÑŒÑ‚Ğ¸ÑĞ·Ñ‹Ñ‡Ğ½Ğ¾ÑÑ‚ÑŒ Ğ¸ Ğ¼Ğ³Ğ½Ğ¾Ğ²ĞµĞ½Ğ½Ğ¾Ğµ Ğ¿ĞµÑ€ĞµĞºĞ»ÑÑ‡ĞµĞ½Ğ¸Ğµ',
        sectionI18nText: `- **10 Ğ²ÑÑ‚Ñ€Ğ¾ĞµĞ½Ğ½Ñ‹Ñ… ÑĞ·Ñ‹ĞºĞ¾Ğ²**: Ğ°Ğ½Ğ³Ğ»Ğ¸Ğ¹ÑĞºĞ¸Ğ¹, Ñ‚ÑƒÑ€ĞµÑ†ĞºĞ¸Ğ¹, Ğ¿Ğ¾Ñ€Ñ‚ÑƒĞ³Ğ°Ğ»ÑŒÑĞºĞ¸Ğ¹, Ğ¸ÑĞ¿Ğ°Ğ½ÑĞºĞ¸Ğ¹, Ğ½ĞµĞ¼ĞµÑ†ĞºĞ¸Ğ¹, Ñ„Ñ€Ğ°Ğ½Ñ†ÑƒĞ·ÑĞºĞ¸Ğ¹, ÑĞ¿Ğ¾Ğ½ÑĞºĞ¸Ğ¹, ĞºĞ¸Ñ‚Ğ°Ğ¹ÑĞºĞ¸Ğ¹, Ñ…Ğ¸Ğ½Ğ´Ğ¸ Ğ¸ Ñ€ÑƒÑÑĞºĞ¸Ğ¹.
- **ĞœĞ³Ğ½Ğ¾Ğ²ĞµĞ½Ğ½Ñ‹Ğ¹ Ğ¾Ñ‚ĞºĞ»Ğ¸Ğº Ğ±ĞµĞ· Ğ¿ĞµÑ€ĞµĞ·Ğ°Ğ³Ñ€ÑƒĞ·ĞºĞ¸** â€” ĞŸÑ€Ğ¸ Ğ²Ñ‹Ğ±Ğ¾Ñ€Ğµ ÑĞ·Ñ‹ĞºĞ° Ğ² Ğ½Ğ°ÑÑ‚Ñ€Ğ¾Ğ¹ĞºĞ°Ñ… **100% Ğ¸Ğ½Ñ‚ĞµÑ€Ñ„ĞµĞ¹ÑĞ° Ğ¼Ğ³Ğ½Ğ¾Ğ²ĞµĞ½Ğ½Ğ¾ Ğ¿ĞµÑ€ĞµĞ²Ğ¾Ğ´Ğ¸Ñ‚ÑÑ** (Ğ±Ğ¾ĞºĞ¾Ğ²Ğ°Ñ Ğ¿Ğ°Ğ½ĞµĞ»ÑŒ, Ğ°Ğ½Ğ°Ğ»Ğ¸Ñ‚Ğ¸Ñ‡ĞµÑĞºĞ¸Ğ¹ Ğ´Ğ°ÑˆĞ±Ğ¾Ñ€Ğ´ Bento, Ğ¸Ğ½ÑĞ¿ĞµĞºÑ‚Ğ¾Ñ€ ĞºĞ¾Ğ½Ñ‚ĞµĞºÑÑ‚Ğ° Ğ¸ Ğ´Ğ¸Ğ°Ğ»Ğ¾Ğ³Ğ¾Ğ²Ñ‹Ğµ Ğ¾ĞºĞ½Ğ°).`,
        sectionTokensTitle: 'ğŸ”‘ Ğ‘ÑĞ´Ğ¶ĞµÑ‚ Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ² Ğ¸ Ğ°Ğ½Ğ°Ğ»Ğ¸Ñ‚Ğ¸ĞºĞ° ĞºĞ¾Ğ½Ñ‚ĞµĞºÑÑ‚Ğ°',
        sectionTokensText: `- **Ğ”Ğ¸Ğ°Ğ³Ñ€Ğ°Ğ¼Ğ¼Ğ° ĞºĞ°ÑÑ‚Ğ¾Ğ¼Ğ¸Ğ·Ğ°Ñ†Ğ¸Ğ¹** â€” Ğ¢Ğ¾Ñ‡Ğ½Ñ‹Ğ¹ Ğ¾Ğ±ÑŠĞµĞ¼ Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ² Ğ´Ğ»Ñ MCP Tools, Rules, Workflows Ğ¸ Skills.
- **Ğ˜Ğ½Ğ´Ğ¸ĞºĞ°Ñ‚Ğ¾Ñ€ Ğ°ĞºÑ‚Ğ¸Ğ²Ğ½Ğ¾Ğ³Ğ¾ ĞºĞ¾Ğ½Ñ‚ĞµĞºÑÑ‚Ğ°** â€” Ğ¡Ñ€Ğ°Ğ²Ğ½ĞµĞ½Ğ¸Ğµ Ğ¸ÑĞ¿Ğ¾Ğ»ÑŒĞ·Ğ¾Ğ²Ğ°Ğ½Ğ½Ñ‹Ñ… Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ² Ñ Ğ¼Ğ°ĞºÑĞ¸Ğ¼Ğ°Ğ»ÑŒĞ½Ñ‹Ğ¼ Ğ»Ğ¸Ğ¼Ğ¸Ñ‚Ğ¾Ğ¼ Ğ¼Ğ¾Ğ´ĞµĞ»Ğ¸ Ğ² Ñ€ĞµĞ°Ğ»ÑŒĞ½Ğ¾Ğ¼ Ğ²Ñ€ĞµĞ¼ĞµĞ½Ğ¸.
- **Ğ˜Ğ½ÑĞ¿ĞµĞºÑ‚Ğ¾Ñ€ Ğ¿Ñ€Ğ°Ğ²Ğ¸Ğ» Ñ€Ğ°Ğ±Ğ¾Ñ‡ĞµĞ¹ Ğ¾Ğ±Ğ»Ğ°ÑÑ‚Ğ¸** â€” Ğ‘Ñ‹ÑÑ‚Ñ€Ñ‹Ğ¹ Ğ¿ĞµÑ€ĞµÑ…Ğ¾Ğ´ Ğº Ñ„Ğ°Ğ¹Ğ»Ğ°Ğ¼ Ğ² \`.agent/\` Ñ ÑƒĞºĞ°Ğ·Ğ°Ğ½Ğ¸ĞµĞ¼ Ñ€ĞµĞ¶Ğ¸Ğ¼Ğ¾Ğ² Ğ°ĞºÑ‚Ğ¸Ğ²Ğ°Ñ†Ğ¸Ğ¸.`,
        sectionContextTitle: 'ğŸ” Ğ”ĞµÑ‚Ğ°Ğ»Ğ¸Ğ·Ğ°Ñ†Ğ¸Ñ Ğ¾ĞºĞ½Ğ° ĞºĞ¾Ğ½Ñ‚ĞµĞºÑÑ‚Ğ° (ĞÑ‚Ğ´ĞµĞ»ÑŒĞ½Ğ°Ñ Ğ²ĞºĞ»Ğ°Ğ´ĞºĞ° Ñ€ĞµĞ´Ğ°ĞºÑ‚Ğ¾Ñ€Ğ°)',
        sectionContextText: `- ĞÑ‚ĞºÑ€Ñ‹Ğ²Ğ°ĞµÑ‚ÑÑ Ğ² 1 ĞºĞ»Ğ¸Ğº Ğ¿Ğ¾ ĞºĞ½Ğ¾Ğ¿ĞºĞµ **"ĞŸĞ¾ĞºĞ°Ğ·Ğ°Ñ‚ÑŒ Ğ²ÑĞµ â†’"**.
- **Ğ˜ĞµÑ€Ğ°Ñ€Ñ…Ğ¸Ñ‡ĞµÑĞºĞ¾Ğµ Ğ´ĞµÑ€ĞµĞ²Ğ¾** â€” ĞŸĞ¾Ğ»Ğ½Ğ°Ñ Ñ€Ğ°Ğ·Ğ±Ğ¸Ğ²ĞºĞ° ÑĞ¸ÑÑ‚ĞµĞ¼Ğ½Ğ¾Ğ³Ğ¾ Ğ¿Ñ€Ğ¾Ğ¼Ğ¿Ñ‚Ğ°, Ğ¸Ğ½ÑÑ‚Ñ€ÑƒĞ¼ĞµĞ½Ñ‚Ğ¾Ğ², MCP Ğ¸ Ğ¸ÑÑ‚Ğ¾Ñ€Ğ¸Ğ¸ ÑĞ¾Ğ¾Ğ±Ñ‰ĞµĞ½Ğ¸Ğ¹ Ñ Ğ¿Ñ€Ğ¾Ñ†ĞµĞ½Ñ‚Ğ°Ğ¼Ğ¸.
- **Ğ’ÑÑ‚Ñ€Ğ¾ĞµĞ½Ğ½Ñ‹Ğ¹ Ğ¿Ñ€Ğ¾ÑĞ¼Ğ¾Ñ‚Ñ€ ÑˆĞ°Ğ³Ğ¾Ğ²** â€” ĞŸÑ€Ğ¾ÑĞ¼Ğ°Ñ‚Ñ€Ğ¸Ğ²Ğ°Ğ¹Ñ‚Ğµ Ğ¿Ñ€Ğ¾Ğ¼Ğ¿Ñ‚Ñ‹, Ğ¾Ñ‚Ğ²ĞµÑ‚Ñ‹ Ğ¼Ğ¾Ğ´ĞµĞ»Ğ¸ Ğ¸ Ğ²Ñ‹Ğ²Ğ¾Ğ´Ñ‹ ĞºĞ¾Ğ¼Ğ°Ğ½Ğ´ Ğ¿Ñ€ÑĞ¼Ğ¾ Ğ² Ğ¸Ğ½Ñ‚ĞµÑ€Ñ„ĞµĞ¹ÑĞµ.
- **Ğ—Ğ½Ğ°Ñ‡ĞºĞ¸ Ğ¿Ğ»Ğ°Ğ¼ĞµĞ½Ğ¸ (ğŸ”¥)** â€” ĞœĞ³Ğ½Ğ¾Ğ²ĞµĞ½Ğ½Ğ¾ Ğ¿Ğ¾Ğ´ÑĞ²ĞµÑ‡Ğ¸Ğ²Ğ°ÑÑ‚ ÑĞ°Ğ¼Ñ‹Ğµ Ñ€ĞµÑÑƒÑ€ÑĞ¾ĞµĞ¼ĞºĞ¸Ğµ ÑˆĞ°Ğ³Ğ¸ Ğ² ĞºĞ¾Ğ½Ñ‚ĞµĞºÑÑ‚Ğµ.
- **Ğ­ĞºÑĞ¿Ğ¾Ñ€Ñ‚ Ğ² Markdown** â€” ĞšĞ¾Ğ¿Ğ¸Ñ€ÑƒĞ¹Ñ‚Ğµ Ğ¾Ñ‚Ñ‡ĞµÑ‚Ñ‹ Ğ¾ ĞºĞ¾Ğ½Ñ‚ĞµĞºÑÑ‚Ğµ Ğ¸Ğ»Ğ¸ ÑĞ¾Ñ…Ñ€Ğ°Ğ½ÑĞ¹Ñ‚Ğµ Ğ¸Ñ… Ğ² Ñ„Ğ°Ğ¹Ğ».`,
        sectionAnalyticsTitle: 'ğŸ“ˆ Ğ“Ğ»ÑƒĞ±Ğ¾ĞºĞ°Ñ Ğ°Ğ½Ğ°Ğ»Ğ¸Ñ‚Ğ¸ĞºĞ° Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ² Ğ¸ Ğ´Ğ°ÑˆĞ±Ğ¾Ñ€Ğ´ Bento',
        sectionAnalyticsText: `- ĞÑ‚ĞºÑ€Ñ‹Ğ²Ğ°ĞµÑ‚ÑÑ Ğ¿Ğ¾ ĞºĞ½Ğ¾Ğ¿ĞºĞµ **"ĞÑ‚ĞºÑ€Ñ‹Ñ‚ÑŒ Ğ¿Ğ¾Ğ»Ğ½Ñ‹Ğ¹ Ğ´Ğ°ÑˆĞ±Ğ¾Ñ€Ğ´ â†’"**.
- **ĞĞ½Ğ°Ğ»Ğ¸Ğ· Ğ·Ğ° Ğ²ÑĞµ Ğ²Ñ€ĞµĞ¼Ñ** â€” Ğ¡ĞºĞ°Ğ½Ğ¸Ñ€ÑƒĞµÑ‚ Ğ¸ ÑÑƒĞ¼Ğ¼Ğ¸Ñ€ÑƒĞµÑ‚ Ğ¸ÑĞ¿Ğ¾Ğ»ÑŒĞ·Ğ¾Ğ²Ğ°Ğ½Ğ¸Ğµ Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ² Ğ¿Ğ¾ Ğ²ÑĞµĞ¼ Ğ´Ğ¸Ğ°Ğ»Ğ¾Ğ³Ğ°Ğ¼ Ğ·Ğ° Ğ¸ÑÑ‚Ğ¾Ñ€Ğ¸Ñ Ğ¸ÑĞ¿Ğ¾Ğ»ÑŒĞ·Ğ¾Ğ²Ğ°Ğ½Ğ¸Ñ Antigravity.
- **9 ĞºĞ»ÑÑ‡ĞµĞ²Ñ‹Ñ… Ğ¼ĞµÑ‚Ñ€Ğ¸Ğº KPI** â€” Ğ’Ñ…Ğ¾Ğ´Ğ½Ñ‹Ğµ, ĞºÑÑˆĞ¸Ñ€Ğ¾Ğ²Ğ°Ğ½Ğ½Ñ‹Ğµ, Ğ²Ñ‹Ñ…Ğ¾Ğ´Ğ½Ñ‹Ğµ Ñ‚Ğ¾ĞºĞµĞ½Ñ‹, Ñ‚Ğ¾ĞºĞµĞ½Ñ‹ Ñ€Ğ°ÑÑÑƒĞ¶Ğ´ĞµĞ½Ğ¸Ğ¹, Ğ¾Ğ±Ñ‰ĞµĞµ Ñ‡Ğ¸ÑĞ»Ğ¾ Ğ²Ñ‹Ğ·Ğ¾Ğ²Ğ¾Ğ² Ğ¸ ĞºĞ¾ÑÑ„Ñ„Ğ¸Ñ†Ğ¸ĞµĞ½Ñ‚ ĞºÑÑˆĞ°.
- **Ğ¢ĞµĞ¿Ğ»Ğ¾Ğ²Ğ°Ñ ĞºĞ°Ñ€Ñ‚Ğ° Ğ² ÑÑ‚Ğ¸Ğ»Ğµ GitHub** â€” Ğ¡ĞµÑ‚ĞºĞ° Ğ°ĞºÑ‚Ğ¸Ğ²Ğ½Ğ¾ÑÑ‚Ğ¸ Ğ·Ğ° 365 Ğ´Ğ½ĞµĞ¹ Ñ Ğ²Ğ¾Ğ·Ğ¼Ğ¾Ğ¶Ğ½Ğ¾ÑÑ‚ÑŒÑ Ğ²Ñ‹Ğ±Ğ¾Ñ€Ğ° Ğ³Ğ¾Ğ´Ğ°.
- **Ğ”Ğ¸Ğ½Ğ°Ğ¼Ğ¸Ñ‡ĞµÑĞºĞ¸Ğ¹ Ñ€Ğ°ÑÑ‡ĞµÑ‚ Ñ†ĞµĞ½ LiteLLM** â€” Ğ¢Ğ¾Ñ‡Ğ½Ğ°Ñ Ğ¾Ñ†ĞµĞ½ĞºĞ° Ğ·Ğ°Ñ‚Ñ€Ğ°Ñ‚ Ğ½Ğ° API Ğ¿Ğ¾ Ğ°ĞºÑ‚ÑƒĞ°Ğ»ÑŒĞ½Ñ‹Ğ¼ Ñ‚Ğ°Ñ€Ğ¸Ñ„Ğ°Ğ¼.`,
        sectionGuardTitle: 'ğŸ›¡ï¸ Ğ—Ğ°Ñ‰Ğ¸Ñ‚Ğ° Ğ´Ğ¸Ğ°Ğ»Ğ¾Ğ³Ğ¾Ğ² (Conversation Guard)',
        sectionGuardText: `- **ĞĞ²Ñ‚Ğ¾Ğ¼Ğ°Ñ‚Ğ¸Ñ‡ĞµÑĞºĞ¸Ğ¹ Ğ¿Ğ¾Ğ¸ÑĞº ÑƒÑ‚ĞµÑ€ÑĞ½Ğ½Ñ‹Ñ… Ğ´Ğ¸Ğ°Ğ»Ğ¾Ğ³Ğ¾Ğ²** â€” Ğ¡Ñ€Ğ°Ğ²Ğ½Ğ¸Ğ²Ğ°ĞµÑ‚ Ğ»Ğ¾ĞºĞ°Ğ»ÑŒĞ½Ñ‹Ğµ Ñ„Ğ°Ğ¹Ğ»Ñ‹ \`.pb\` Ñ Ğ¸Ğ½Ğ´ĞµĞºÑĞ¾Ğ¼ Ñ‡ĞµÑ€ĞµĞ· 15 ÑĞµĞºÑƒĞ½Ğ´ Ğ¿Ğ¾ÑĞ»Ğµ Ğ·Ğ°Ğ¿ÑƒÑĞºĞ°.
- **Ğ’Ğ¾ÑÑÑ‚Ğ°Ğ½Ğ¾Ğ²Ğ»ĞµĞ½Ğ¸Ğµ Ğ² 1 ĞºĞ»Ğ¸Ğº** â€” Ğ‘ĞµĞ·Ğ¾Ğ¿Ğ°ÑĞ½Ğ¾ Ğ·Ğ°ĞºÑ€Ñ‹Ğ²Ğ°ĞµÑ‚ AG, Ğ·Ğ°Ğ½Ğ¾Ğ²Ğ¾ Ğ¿ĞµÑ€ĞµÑĞ¾Ğ±Ğ¸Ñ€Ğ°ĞµÑ‚ Ğ¸Ğ½Ğ´ĞµĞºÑ Ñ Ğ´Ğ¸ÑĞºĞ° Ğ¸ Ğ¿ĞµÑ€ĞµĞ·Ğ°Ğ¿ÑƒÑĞºĞ°ĞµÑ‚ IDE Ğ±ĞµĞ· Ğ¿Ğ¾Ñ‚ĞµÑ€Ğ¸ Ğ´Ğ°Ğ½Ğ½Ñ‹Ñ….`,
        getStartedTitle: 'ğŸš€ Ğ¡ Ñ‡ĞµĞ³Ğ¾ Ğ½Ğ°Ñ‡Ğ°Ñ‚ÑŒ',
        installText: `1. ĞĞ°Ğ¹Ğ´Ğ¸Ñ‚Ğµ **NexusAG** Ğ² Marketplace Ñ€Ğ°ÑÑˆĞ¸Ñ€ĞµĞ½Ğ¸Ğ¹ Antigravity Ğ¸ Ğ½Ğ°Ğ¶Ğ¼Ğ¸Ñ‚Ğµ **Ğ£ÑÑ‚Ğ°Ğ½Ğ¾Ğ²Ğ¸Ñ‚ÑŒ**.
2. Ğ˜Ğ»Ğ¸ ÑƒÑÑ‚Ğ°Ğ½Ğ¾Ğ²Ğ¸Ñ‚Ğµ Ğ½Ğ°Ğ¿Ñ€ÑĞ¼ÑƒÑ Ğ¸Ğ· Ñ„Ğ°Ğ¹Ğ»Ğ° \`.vsix\`:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: 'Ğ Ğ°ÑĞ¿Ñ€Ğ¾ÑÑ‚Ñ€Ğ°Ğ½ÑĞµÑ‚ÑÑ Ğ¿Ğ¾Ğ´ **Ğ»Ğ¸Ñ†ĞµĞ½Ğ·Ğ¸ĞµĞ¹ MIT**. Ğ¡Ğ¾Ğ·Ğ´Ğ°Ğ½Ğ¾ Ñ â˜• Ğ°Ğ²Ñ‚Ğ¾Ñ€Ğ¾Ğ¼ **[NexusAG Team](https://github.com/AlperenAKKAYA99)**'
    }
];

const QUICK_STARTS = {
    de: {
        title: 'âš¡ Schnellstart in 60 Sekunden',
        step1: '**Installieren** â€” Suchen Sie nach `NexusAG` im Antigravity Marketplace oder installieren Sie die `.vsix`-Datei.',
        step2: '**Konto hinzufÃ¼gen** â€” Klicken Sie in der Seitenleiste auf `+` fÃ¼r Google OAuth oder nutzen Sie `ğŸ”‘` zum EinfÃ¼gen von Tokens.',
        step3: '**Ãœberwachen & Wechseln** â€” Ihre Live-Quotenanzeigen, Reset-Countdowns und Analysen sind sofort aktiv!'
    },
    'pt-BR': {
        title: 'âš¡ Comece em 60 Segundos',
        step1: '**Instalar** â€” Busque por `NexusAG` no marketplace do Antigravity ou instale o pacote `.vsix`.',
        step2: '**Adicionar Conta** â€” Clique em `+` na barra lateral para login Google OAuth no navegador ou use `ğŸ”‘` para colar tokens.',
        step3: '**Monitorar & Alternar** â€” Seus medidores de cota em tempo real, contagens regressivas e mÃ©tricas estÃ£o imediatamente ativos!'
    },
    es: {
        title: 'âš¡ Primeros Pasos en 60 Segundos',
        step1: '**Instalar** â€” Busque `NexusAG` en el marketplace de extensiones de Antigravity o instale el archivo `.vsix`.',
        step2: '**AÃ±adir Cuenta** â€” Haga clic en `+` en la barra lateral para autenticaciÃ³n Google OAuth en 1 clic o pulse `ğŸ”‘` para pegar tokens.',
        step3: '**Monitorizar & Cambiar** â€” Â¡Sus indicadores de cuota en vivo, temporizadores y analÃ­tica se activan al instante!'
    },
    fr: {
        title: 'âš¡ DÃ©marrage Rapide en 60 Secondes',
        step1: '**Installer** â€” Recherchez `NexusAG` dans le marketplace Antigravity ou installez le package `.vsix`.',
        step2: '**Ajouter un Compte** â€” Cliquez sur `+` dans la barre latÃ©rale pour vous connecter via Google OAuth ou utilisez `ğŸ”‘` pour coller des jetons.',
        step3: '**Surveiller & Basculer** â€” Vos jauges de quota en direct, comptes Ã  rebours et analyses de tokens sont immÃ©diatement opÃ©rationnels !'
    },
    ja: {
        title: 'âš¡ 60ç§’ã‚¯ã‚¤ãƒƒã‚¯ã‚¹ã‚¿ãƒ¼ãƒˆ',
        step1: '**ã‚¤ãƒ³ã‚¹ãƒˆãƒ¼ãƒ«** â€” Antigravity æ‹¡å¼µæ©Ÿèƒ½ãƒãƒ¼ã‚±ãƒƒãƒˆãƒ—ãƒ¬ã‚¤ã‚¹ã§ `NexusAG` ã‚’æ¤œç´¢ã™ã‚‹ã‹ã€`.vsix` ãƒ‘ãƒƒã‚±ãƒ¼ã‚¸ã‚’ã‚¤ãƒ³ã‚¹ãƒˆãƒ¼ãƒ«ã—ã¾ã™ã€‚',
        step2: '**ã‚¢ã‚«ã‚¦ãƒ³ãƒˆè¿½åŠ ** â€” ã‚µã‚¤ãƒ‰ãƒãƒ¼ã® `+` ã‚¢ã‚¤ã‚³ãƒ³ã‚’ã‚¯ãƒªãƒƒã‚¯ã—ã¦ Google OAuth ãƒ­ã‚°ã‚¤ãƒ³ã™ã‚‹ã‹ã€`ğŸ”‘` ã§ãƒˆãƒ¼ã‚¯ãƒ³ã‚’è²¼ã‚Šä»˜ã‘ã¾ã™ã€‚',
        step3: '**ç›£è¦–ã¨åˆ‡ã‚Šæ›¿ãˆ** â€” ãƒªã‚¢ãƒ«ã‚¿ã‚¤ãƒ ã®ã‚¯ã‚©ãƒ¼ã‚¿ãƒ¡ãƒ¼ã‚¿ãƒ¼ã€ãƒªã‚»ãƒƒãƒˆã‚¿ã‚¤ãƒãƒ¼ã€ãƒˆãƒ¼ã‚¯ãƒ³åˆ†æãŒå³åº§ã«æœ‰åŠ¹åŒ–ã•ã‚Œã¾ã™ï¼'
    },
    'zh-CN': {
        title: 'âš¡ 60ç§’å¿«é€Ÿä¸Šæ‰‹',
        step1: '**å®‰è£…** â€” åœ¨ Antigravity æ‰©å±•å¸‚åœºä¸­æœç´¢ `NexusAG` æˆ–å®‰è£… `.vsix` å®‰è£…åŒ…ã€‚',
        step2: '**æ·»åŠ è´¦æˆ·** â€” ç‚¹å‡»ä¾§è¾¹æ çš„ `+` å›¾æ ‡é€šè¿‡æµè§ˆå™¨å®Œæˆ Google OAuth ç™»å½•ï¼Œæˆ–ç‚¹å‡» `ğŸ”‘` æ‰¹é‡ç²˜è´´ä»¤ç‰Œã€‚',
        step3: '**ç›‘æ§ä¸åˆ‡æ¢** â€” å®æ—¶é…é¢ä»ªè¡¨ç›˜ã€é‡ç½®å€’è®¡æ—¶å’Œå…¨ç”Ÿå‘½å‘¨æœŸ Token åˆ†æå³åˆ»å°±ç»ªï¼'
    },
    hi: {
        title: 'âš¡ 60 à¤¸à¥‡à¤•à¤‚à¤¡ à¤®à¥‡à¤‚ à¤¶à¥à¤°à¥à¤†à¤¤ à¤•à¤°à¥‡à¤‚',
        step1: '**à¤‡à¤‚à¤¸à¥à¤Ÿà¥‰à¤² à¤•à¤°à¥‡à¤‚** â€” Antigravity à¤à¤•à¥à¤¸à¤Ÿà¥‡à¤‚à¤¶à¤¨ à¤®à¤¾à¤°à¥à¤•à¥‡à¤Ÿà¤ªà¥à¤²à¥‡à¤¸ à¤®à¥‡à¤‚ `NexusAG` à¤–à¥‹à¤œà¥‡à¤‚ à¤¯à¤¾ `.vsix` à¤ªà¥ˆà¤•à¥‡à¤œ à¤‡à¤‚à¤¸à¥à¤Ÿà¥‰à¤² à¤•à¤°à¥‡à¤‚à¥¤',
        step2: '**à¤–à¤¾à¤¤à¤¾ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚** â€” à¤¬à¥à¤°à¤¾à¤‰à¤œà¤¼à¤° à¤®à¥‡à¤‚ 1-à¤•à¥à¤²à¤¿à¤• Google OAuth à¤²à¥‰à¤—à¤¿à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤¸à¤¾à¤‡à¤¡à¤¬à¤¾à¤° à¤®à¥‡à¤‚ `+` à¤ªà¤° à¤•à¥à¤²à¤¿à¤• à¤•à¤°à¥‡à¤‚ à¤¯à¤¾ `ğŸ”‘` à¤¸à¥‡ à¤Ÿà¥‹à¤•à¤¨ à¤šà¤¿à¤ªà¤•à¤¾à¤à¤‚à¥¤',
        step3: '**à¤¨à¤¿à¤—à¤°à¤¾à¤¨à¥€ à¤”à¤° à¤¸à¥à¤µà¤¿à¤š** â€” à¤†à¤ªà¤•à¥‡ à¤²à¤¾à¤‡à¤µ à¤•à¥‹à¤Ÿà¤¾ à¤—à¥‡à¤œ, à¤°à¥€à¤¸à¥‡à¤Ÿ à¤Ÿà¤¾à¤‡à¤®à¤° à¤”à¤° à¤†à¤œà¥€à¤µà¤¨ à¤Ÿà¥‹à¤•à¤¨ à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£ à¤¤à¥à¤°à¤‚à¤¤ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¹à¥ˆà¤‚!'
    },
    ru: {
        title: 'âš¡ Ğ‘Ñ‹ÑÑ‚Ñ€Ñ‹Ğ¹ ÑÑ‚Ğ°Ñ€Ñ‚ Ğ·Ğ° 60 ÑĞµĞºÑƒĞ½Ğ´',
        step1: '**Ğ£ÑÑ‚Ğ°Ğ½Ğ¾Ğ²ĞºĞ°** â€” ĞĞ°Ğ¹Ğ´Ğ¸Ñ‚Ğµ `NexusAG` Ğ² Marketplace Ñ€Ğ°ÑÑˆĞ¸Ñ€ĞµĞ½Ğ¸Ğ¹ Antigravity Ğ¸Ğ»Ğ¸ ÑƒÑÑ‚Ğ°Ğ½Ğ¾Ğ²Ğ¸Ñ‚Ğµ Ğ¿Ğ°ĞºĞµÑ‚ `.vsix`.',
        step2: '**Ğ”Ğ¾Ğ±Ğ°Ğ²Ğ»ĞµĞ½Ğ¸Ğµ Ğ°ĞºĞºĞ°ÑƒĞ½Ñ‚Ğ°** â€” ĞĞ°Ğ¶Ğ¼Ğ¸Ñ‚Ğµ Ğ¸ĞºĞ¾Ğ½ĞºÑƒ `+` Ğ½Ğ° Ğ±Ğ¾ĞºĞ¾Ğ²Ğ¾Ğ¹ Ğ¿Ğ°Ğ½ĞµĞ»Ğ¸ Ğ´Ğ»Ñ Ğ²Ñ…Ğ¾Ğ´Ğ° Ñ‡ĞµÑ€ĞµĞ· Google OAuth Ğ¸Ğ»Ğ¸ Ğ¸ÑĞ¿Ğ¾Ğ»ÑŒĞ·ÑƒĞ¹Ñ‚Ğµ `ğŸ”‘` Ğ´Ğ»Ñ Ğ²ÑÑ‚Ğ°Ğ²ĞºĞ¸ Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ².',
        step3: '**ĞœĞ¾Ğ½Ğ¸Ñ‚Ğ¾Ñ€Ğ¸Ğ½Ğ³ Ğ¸ Ğ¿ĞµÑ€ĞµĞºĞ»ÑÑ‡ĞµĞ½Ğ¸Ğµ** â€” Ğ’Ğ°ÑˆĞ¸ ÑˆĞºĞ°Ğ»Ñ‹ ĞºĞ²Ğ¾Ñ‚, Ñ‚Ğ°Ğ¹Ğ¼ĞµÑ€Ñ‹ ÑĞ±Ñ€Ğ¾ÑĞ° Ğ¸ Ğ¿Ğ¾Ğ¶Ğ¸Ğ·Ğ½ĞµĞ½Ğ½Ğ°Ñ Ğ°Ğ½Ğ°Ğ»Ğ¸Ñ‚Ğ¸ĞºĞ° Ñ‚Ğ¾ĞºĞµĞ½Ğ¾Ğ² ÑÑ€Ğ°Ğ·Ñƒ Ğ°ĞºÑ‚Ğ¸Ğ²Ğ½Ñ‹!'
    }
};

const SECURITY_SECTIONS = {
    de: {
        title: 'ğŸ”’ Sicherheit & Datenschutz',
        bullets: `- **100% Lokale Daten** â€” Keine Konversationsdaten, Prompts oder Dateien verlassen jemals Ihren Rechner.
- **VerschlÃ¼sselung auf Betriebssystemebene** â€” OAuth-Tokens werden Ã¼ber die native VS Code \`SecretStorage\`-Schnittstelle sicher gespeichert (macOS Keychain, Windows Credential Manager, Linux Secret Service).
- **AusschlieÃŸlich Lokale Kommunikation** â€” Die Kommunikation mit Language Servern erfolgt ausschlieÃŸlich Ã¼ber \`127.0.0.1\` Loopback IPC-Sockets.
- **Null (0) Runtime-AbhÃ¤ngigkeiten** â€” Saubere Lieferkette mit **0 externen npm-Paketen**. Alles ist in reinem TypeScript geschrieben.
- **Nur Offizielle API-Endpunkte** â€” BeschrÃ¤nkt auf offizielle Google OAuth- und Cloud Code Quota-APIs.
- **GeprÃ¼fte Sicherheit** â€” VollstÃ¤ndiger SicherheitsprÃ¼fbericht: [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 kritische Schwachstellen, 0 Backdoors).
- **Open Source** â€” Jederzeit transparent und einsehbar unter der **MIT-Lizenz**.`
    },
    'pt-BR': {
        title: 'ğŸ”’ SeguranÃ§a e Privacidade',
        bullets: `- **100% Dados Locais** â€” Nenhum dado de conversa, prompt ou cÃ³digo sai do seu computador.
- **Criptografia no NÃ­vel do SO** â€” Tokens OAuth armazenados no \`SecretStorage\` nativo do VS Code (macOS Keychain, Windows Credential Manager, Linux Secret Service).
- **ComunicaÃ§Ã£o Estritamente Local** â€” Toda comunicaÃ§Ã£o com Language Servers Ã© feita via sockets IPC \`127.0.0.1\`.
- **Zero (0) DependÃªncias de ExecuÃ§Ã£o** â€” Cadeia de suprimentos limpa com **0 pacotes npm de runtime**. Tudo feito em TypeScript puro.
- **Apenas APIs Oficiais** â€” ComunicaÃ§Ã£o restrita Ã s APIs oficiais do Google OAuth e Cloud Code Quota.
- **Auditoria de SeguranÃ§a** â€” RelatÃ³rio completo: [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 vulnerabilidades crÃ­ticas, 0 backdoors).
- **CÃ³digo Aberto** â€” Totalmente transparente sob a **LicenÃ§a MIT**.`
    },
    es: {
        title: 'ğŸ”’ Seguridad y Privacidad',
        bullets: `- **100% Datos Locales** â€” NingÃºn dato de conversaciÃ³n, prompt o cÃ³digo sale jamÃ¡s de su mÃ¡quina.
- **Cifrado a Nivel de SO** â€” Tokens OAuth protegidos mediante \`SecretStorage\` de VS Code (macOS Keychain, Windows Credential Manager, Linux Secret Service).
- **ComunicaciÃ³n Estrictamente Local** â€” Todas las llamadas al Language Server se limitan a sockets IPC en \`127.0.0.1\`.
- **Cero (0) Dependencias de Runtime** â€” Cadena de suministro limpia con **0 dependencias npm externas**. Escrito en TypeScript puro.
- **Solo APIs Oficiales** â€” Conexiones limitadas exclusivamente a endpoints oficiales de Google OAuth y Cloud Code Quota.
- **CÃ³digo Auditado** â€” Informe completo: [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 vulnerabilidades crÃ­ticas, 0 backdoors).
- **CÃ³digo Abierto** â€” Transparente y auditable bajo la **Licencia MIT**.`
    },
    fr: {
        title: 'ğŸ”’ SÃ©curitÃ© et ConfidentialitÃ©',
        bullets: `- **100% DonnÃ©es Locales** â€” Aucune donnÃ©e de conversation, aucun prompt ni fichier ne quitte votre machine.
- **Chiffrement au Niveau de l\'OS** â€” Jetons OAuth sÃ©curisÃ©s dans le \`SecretStorage\` natif de VS Code (Trousseau macOS, Windows Credential Manager, Linux Secret Service).
- **Communication Exclusivement Locale** â€” Les Ã©changes avec les serveurs de langage restent cantonnÃ©s Ã  l\'IPC \`127.0.0.1\`.
- **ZÃ©ro (0) DÃ©pendance Ã  l\'ExÃ©cution** â€” ChaÃ®ne d\'approvisionnement sÃ©curisÃ©e avec **0 package npm tiers**. Tout est conÃ§u en TypeScript pur.
- **APIs Officielles Uniquement** â€” RequÃªtes limitÃ©es aux services Google OAuth et Cloud Code Quota officiels.
- **Audit de SÃ©curitÃ©** â€” Rapport dÃ©taillÃ© : [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 vulnÃ©rabilitÃ© critique, 0 porte dÃ©robÃ©e).
- **Open Source** â€” EntiÃ¨rement transparent sous **Licence MIT**.`
    },
    ja: {
        title: 'ğŸ”’ ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ã¨ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼',
        bullets: `- **100% ãƒ­ãƒ¼ã‚«ãƒ«å®Œçµ** â€” ä¼šè©±å±¥æ­´ã€ãƒ—ãƒ­ãƒ³ãƒ—ãƒˆã€ã‚½ãƒ¼ã‚¹ã‚³ãƒ¼ãƒ‰ãŒå¤–éƒ¨ã‚µãƒ¼ãƒãƒ¼ã¸é€ä¿¡ã•ã‚Œã‚‹ã“ã¨ã¯ä¸€åˆ‡ã‚ã‚Šã¾ã›ã‚“ã€‚
- **OS ãƒ¬ãƒ™ãƒ«ã®èªè¨¼æƒ…å ±æš—å·åŒ–** â€” OAuth ãƒˆãƒ¼ã‚¯ãƒ³ã¯ VS Code ãƒã‚¤ãƒ†ã‚£ãƒ–ã® \`SecretStorage\`ï¼ˆmacOS ã‚­ãƒ¼ãƒã‚§ãƒ¼ãƒ³ã€Windows è³‡æ ¼æƒ…å ±ãƒãƒãƒ¼ã‚¸ãƒ£ãƒ¼ã€Linux Secret Serviceï¼‰ã«æš—å·åŒ–ä¿å­˜ã•ã‚Œã¾ã™ã€‚
- **å®Œå…¨ãƒ­ãƒ¼ã‚«ãƒ«é€šä¿¡** â€” Language Server ã¨ã®é€šä¿¡ã¯ \`127.0.0.1\` ãƒ«ãƒ¼ãƒ—ãƒãƒƒã‚¯ IPC ã‚½ã‚±ãƒƒãƒˆã®ã¿ã«é™å®šã•ã‚Œã¾ã™ã€‚
- **ãƒ©ãƒ³ã‚¿ã‚¤ãƒ ä¾å­˜ã‚¼ãƒ­ï¼ˆ0ï¼‰** â€” ã‚µãƒ—ãƒ©ã‚¤ãƒã‚§ãƒ¼ãƒ³æ”»æ’ƒãƒªã‚¹ã‚¯ã‚’å®Œå…¨ã«æ’é™¤ã™ã‚‹ãŸã‚ã€å¤–éƒ¨ npm ãƒ‘ãƒƒã‚±ãƒ¼ã‚¸ã¸ã®å®Ÿè¡Œæ™‚ä¾å­˜ã¯ **0** ã§ã™ã€‚
- **å…¬å¼ API ã®ã¿ä½¿ç”¨** â€” å…¬å¼ Google OAuth ãŠã‚ˆã³ Cloud Code Quota API ã‚¨ãƒ³ãƒ‰ãƒã‚¤ãƒ³ãƒˆä»¥å¤–ã¸ã®å¤–éƒ¨é€šä¿¡ã¯è¡Œã„ã¾ã›ã‚“ã€‚
- **ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ç›£æŸ»æ¸ˆã¿** â€” åŒ…æ‹¬çš„ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ç›£æŸ»ãƒ¬ãƒãƒ¼ãƒˆï¼š[CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md)ï¼ˆé‡å¤§ãªè„†å¼±æ€§ 0ä»¶ã€ãƒãƒƒã‚¯ãƒ‰ã‚¢ 0ä»¶ï¼‰ã€‚
- **å®Œå…¨ã‚ªãƒ¼ãƒ—ãƒ³ã‚½ãƒ¼ã‚¹** â€” **MIT ãƒ©ã‚¤ã‚»ãƒ³ã‚¹**ã®ä¸‹ã€å…¨ã‚³ãƒ¼ãƒ‰ãŒå…¬é–‹ãƒ»æ¤œè¨¼å¯èƒ½ã§ã™ã€‚`
    },
    'zh-CN': {
        title: 'ğŸ”’ å®‰å…¨æ€§ä¸éšç§ä¿æŠ¤',
        bullets: `- **100% æœ¬åœ°æ•°æ®å­˜å‚¨** â€” ç»ä¸æ”¶é›†æˆ–ä¸Šä¼ ä»»ä½•ä¼šè¯è®°å½•ã€æç¤ºè¯ã€æºç æˆ–æ•æ„Ÿé¥æµ‹æ•°æ®ã€‚
- **æ“ä½œç³»ç»Ÿçº§å‡­æ®åŠ å¯†** â€” æ‰€æœ‰ OAuth ä»¤ç‰Œå‡é€šè¿‡ VS Code åŸç”Ÿ \`SecretStorage\` åŠ å¯†æ‰˜ç®¡ï¼ˆmacOS Keychainã€Windows å‡­æ®ç®¡ç†å™¨ã€Linux Secret Serviceï¼‰ã€‚
- **ä¸¥æ ¼æœ¬åœ°ç¯å›é€šä¿¡** â€” ä¸ Language Server çš„äº¤äº’å…¨éƒ¨è¿è¡Œäº \`127.0.0.1\` æœ¬åœ° IPC å¥—æ¥å­—ã€‚
- **é›¶ï¼ˆ0ï¼‰è¿è¡Œæ—¶ä¾èµ–** â€” å½»åº•æœç»ä¾›åº”é“¾æŠ•æ¯’æ”»å‡»éšæ‚£ï¼Œè¿è¡Œæ—¶ **0 å¤–éƒ¨ç¬¬ä¸‰æ–¹ npm ä¾èµ–**ï¼Œå…¨é‡ TypeScript åŸç”Ÿå®ç°ã€‚
- **ä»…é™å®˜æ–¹ API ç«¯ç‚¹** â€” å¤–éƒ¨ç½‘ç»œè¯·æ±‚ä»…ä¸¥æ ¼å‘å¾€ Google å®˜æ–¹ OAuth ä¸ Cloud Code é…é¢æœåŠ¡ã€‚
- **é€šè¿‡ä¸“ä¸šå®‰å…¨å®¡è®¡** â€” å®Œæ•´å®¡è®¡æŠ¥å‘Šè§ [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md)ï¼ˆ0 ä¸ªé«˜å±æ¼æ´ï¼Œ0 ä¸ªæ¶æ„åé—¨ï¼‰ã€‚
- **å…¨é¢å¼€æºé€æ˜** â€” åœ¨å®½å®¹çš„ **MIT è®¸å¯è¯**ä¸‹å¼€æºï¼Œæ‰€æœ‰ä»£ç å‡å¯å®¡æŸ¥ã€‚`
    },
    hi: {
        title: 'ğŸ”’ à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤”à¤° à¤—à¥‹à¤ªà¤¨à¥€à¤¯à¤¤à¤¾',
        bullets: `- **100% à¤¸à¥à¤¥à¤¾à¤¨à¥€à¤¯ à¤¡à¥‡à¤Ÿà¤¾** â€” à¤•à¥‹à¤ˆ à¤­à¥€ à¤¬à¤¾à¤¤à¤šà¥€à¤¤ à¤¡à¥‡à¤Ÿà¤¾, à¤ªà¥à¤°à¥‰à¤®à¥à¤ªà¥à¤Ÿ à¤¯à¤¾ à¤•à¥‹à¤¡ à¤•à¤­à¥€ à¤­à¥€ à¤†à¤ªà¤•à¥€ à¤®à¤¶à¥€à¤¨ à¤¸à¥‡ à¤¬à¤¾à¤¹à¤° à¤¨à¤¹à¥€à¤‚ à¤œà¤¾à¤¤à¤¾ à¤¹à¥ˆà¥¤
- **OS-à¤¸à¥à¤¤à¤°à¥€à¤¯ à¤•à¥à¤°à¥‡à¤¡à¥‡à¤‚à¤¶à¤¿à¤¯à¤² à¤à¤¨à¥à¤•à¥à¤°à¤¿à¤ªà¥à¤¶à¤¨** â€” OAuth à¤Ÿà¥‹à¤•à¤¨ VS Code à¤•à¥‡ \`SecretStorage\` (macOS Keychain, Windows Credential Manager, Linux Secret Service) à¤®à¥‡à¤‚ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤°à¤¹à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤
- **à¤ªà¥‚à¤°à¥€ à¤¤à¤°à¤¹ à¤¸à¥‡ à¤¸à¥à¤¥à¤¾à¤¨à¥€à¤¯ à¤¸à¤‚à¤šà¤¾à¤°** â€” Language Server à¤•à¥‡ à¤¸à¤¾à¤¥ à¤¸à¤‚à¤šà¤¾à¤° à¤•à¥‡à¤µà¤² \`127.0.0.1\` à¤²à¥‚à¤ªà¤¬à¥ˆà¤• IPC à¤ªà¤° à¤¹à¥‹à¤¤à¤¾ à¤¹à¥ˆà¥¤
- **à¤¶à¥‚à¤¨à¥à¤¯ (0) à¤°à¤¨à¤Ÿà¤¾à¤‡à¤® à¤¨à¤¿à¤°à¥à¤­à¤°à¤¤à¤¾à¤à¤‚** â€” à¤¶à¥‚à¤¨à¥à¤¯ à¤¬à¤¾à¤¹à¤°à¥€ npm à¤ªà¥ˆà¤•à¥‡à¤œ, à¤¸à¤ªà¥à¤²à¤¾à¤ˆ à¤šà¥‡à¤¨ à¤œà¥‹à¤–à¤¿à¤® à¤¸à¥‡ à¤ªà¥‚à¤°à¥à¤£ à¤¸à¥à¤°à¤•à¥à¤·à¤¾à¥¤
- **à¤•à¥‡à¤µà¤² à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• API** â€” à¤•à¥‡à¤µà¤² à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• Google OAuth à¤”à¤° Cloud Code Quota API à¤¸à¥‡ à¤•à¤¨à¥‡à¤•à¥à¤¶à¤¨à¥¤
- **à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤‘à¤¡à¤¿à¤Ÿà¥‡à¤¡** â€” à¤µà¤¿à¤¸à¥à¤¤à¥ƒà¤¤ à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ: [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 à¤®à¤¹à¤¤à¥à¤µà¤ªà¥‚à¤°à¥à¤£ à¤•à¤®à¤œà¥‹à¤°à¤¿à¤¯à¤¾à¤‚, 0 à¤¬à¥ˆà¤•à¤¡à¥‹à¤°)à¥¤
- **à¤“à¤ªà¤¨ à¤¸à¥‹à¤°à¥à¤¸** â€” **MIT à¤²à¤¾à¤‡à¤¸à¥‡à¤‚à¤¸** à¤•à¥‡ à¤¤à¤¹à¤¤ à¤ªà¥‚à¤°à¥€ à¤¤à¤°à¤¹ à¤¸à¥‡ à¤ªà¤¾à¤°à¤¦à¤°à¥à¤¶à¥€à¥¤`
    },
    ru: {
        title: 'ğŸ”’ Ğ‘ĞµĞ·Ğ¾Ğ¿Ğ°ÑĞ½Ğ¾ÑÑ‚ÑŒ Ğ¸ Ğ¿Ñ€Ğ¸Ğ²Ğ°Ñ‚Ğ½Ğ¾ÑÑ‚ÑŒ',
        bullets: `- **100% Ğ›Ğ¾ĞºĞ°Ğ»ÑŒĞ½Ñ‹Ğµ Ğ´Ğ°Ğ½Ğ½Ñ‹Ğµ** â€” ĞĞ¸ĞºĞ°ĞºĞ¸Ğµ Ğ´Ğ¸Ğ°Ğ»Ğ¾Ğ³Ğ¸, Ğ¿Ñ€Ğ¾Ğ¼Ğ¿Ñ‚Ñ‹ Ğ¸Ğ»Ğ¸ Ñ„Ğ°Ğ¹Ğ»Ñ‹ Ğ½Ğ¸ĞºĞ¾Ğ³Ğ´Ğ° Ğ½Ğµ Ğ¿Ğ¾ĞºĞ¸Ğ´Ğ°ÑÑ‚ Ğ²Ğ°ÑˆĞµ ÑƒÑÑ‚Ñ€Ğ¾Ğ¹ÑÑ‚Ğ²Ğ¾.
- **Ğ¨Ğ¸Ñ„Ñ€Ğ¾Ğ²Ğ°Ğ½Ğ¸Ğµ Ğ½Ğ° ÑƒÑ€Ğ¾Ğ²Ğ½Ğµ ĞĞ¡** â€” Ğ¢Ğ¾ĞºĞµĞ½Ñ‹ OAuth Ğ·Ğ°Ñ‰Ğ¸Ñ‰ĞµĞ½Ñ‹ Ñ‡ĞµÑ€ĞµĞ· Ğ²ÑÑ‚Ñ€Ğ¾ĞµĞ½Ğ½Ñ‹Ğ¹ \`SecretStorage\` VS Code (macOS Keychain, Windows Credential Manager, Linux Secret Service).
- **Ğ¡Ñ‚Ñ€Ğ¾Ğ³Ğ¾ Ğ»Ğ¾ĞºĞ°Ğ»ÑŒĞ½Ğ¾Ğµ Ğ²Ğ·Ğ°Ğ¸Ğ¼Ğ¾Ğ´ĞµĞ¹ÑÑ‚Ğ²Ğ¸Ğµ** â€” Ğ¡Ğ²ÑĞ·ÑŒ Ñ Language Server Ğ¿Ñ€Ğ¾Ğ¸ÑÑ…Ğ¾Ğ´Ğ¸Ñ‚ Ğ¸ÑĞºĞ»ÑÑ‡Ğ¸Ñ‚ĞµĞ»ÑŒĞ½Ğ¾ Ñ‡ĞµÑ€ĞµĞ· ÑĞ¾ĞºĞµÑ‚Ñ‹ IPC Ğ½Ğ° \`127.0.0.1\`.
- **ĞĞ¾Ğ»ÑŒ (0) Ğ·Ğ°Ğ²Ğ¸ÑĞ¸Ğ¼Ğ¾ÑÑ‚ĞµĞ¹ Ğ²Ñ€ĞµĞ¼ĞµĞ½Ğ¸ Ğ²Ñ‹Ğ¿Ğ¾Ğ»Ğ½ĞµĞ½Ğ¸Ñ** â€” Ğ§Ğ¸ÑÑ‚Ğ°Ñ Ñ†ĞµĞ¿Ğ¾Ñ‡ĞºĞ° Ğ¿Ğ¾ÑÑ‚Ğ°Ğ²Ğ¾Ğº Ñ **0 ÑÑ‚Ğ¾Ñ€Ğ¾Ğ½Ğ½Ğ¸Ñ… Ğ¿Ğ°ĞºĞµÑ‚Ğ¾Ğ² npm Ğ² runtime**. ĞĞ°Ğ¿Ğ¸ÑĞ°Ğ½Ğ¾ Ğ½Ğ° Ñ‡Ğ¸ÑÑ‚Ğ¾Ğ¼ TypeScript.
- **Ğ¢Ğ¾Ğ»ÑŒĞºĞ¾ Ğ¾Ñ„Ğ¸Ñ†Ğ¸Ğ°Ğ»ÑŒĞ½Ñ‹Ğµ API** â€” Ğ—Ğ°Ğ¿Ñ€Ğ¾ÑÑ‹ Ğ¾Ğ³Ñ€Ğ°Ğ½Ğ¸Ñ‡ĞµĞ½Ñ‹ Ğ¸ÑĞºĞ»ÑÑ‡Ğ¸Ñ‚ĞµĞ»ÑŒĞ½Ğ¾ Ğ¾Ñ„Ğ¸Ñ†Ğ¸Ğ°Ğ»ÑŒĞ½Ñ‹Ğ¼Ğ¸ API Google OAuth Ğ¸ Cloud Code Quota.
- **ĞŸÑ€Ğ¾Ğ¹Ğ´ĞµĞ½ Ğ°ÑƒĞ´Ğ¸Ñ‚ Ğ±ĞµĞ·Ğ¾Ğ¿Ğ°ÑĞ½Ğ¾ÑÑ‚Ğ¸** â€” ĞŸĞ¾Ğ»Ğ½Ñ‹Ğ¹ Ğ¾Ñ‚Ñ‡ĞµÑ‚: [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 ĞºÑ€Ğ¸Ñ‚Ğ¸Ñ‡ĞµÑĞºĞ¸Ñ… ÑƒÑĞ·Ğ²Ğ¸Ğ¼Ğ¾ÑÑ‚ĞµĞ¹, 0 Ğ±ÑĞºĞ´Ğ¾Ñ€Ğ¾Ğ²).
- **ĞÑ‚ĞºÑ€Ñ‹Ñ‚Ñ‹Ğ¹ Ğ¸ÑÑ…Ğ¾Ğ´Ğ½Ñ‹Ğ¹ ĞºĞ¾Ğ´** â€” ĞŸĞ¾Ğ»Ğ½Ğ°Ñ Ğ¿Ñ€Ğ¾Ğ·Ñ€Ğ°Ñ‡Ğ½Ğ¾ÑÑ‚ÑŒ Ğ¿Ğ¾Ğ´ **Ğ»Ğ¸Ñ†ĞµĞ½Ğ·Ğ¸ĞµĞ¹ MIT**.`
    }
};

function buildReadmeContent(loc) {
    const i = loc.imgs;
    const navbar = getNavbar(loc.code);
    const qs = QUICK_STARTS[loc.code];
    const sec = SECURITY_SECTIONS[loc.code];

    return `${navbar}

<p align="center">
  <img src="${loc.banner}" alt="${loc.title}" width="100%"/>
</p>

<p align="center">
  <a href="https://github.com/AlperenAKKAYA99/NexusAG/releases"><img alt="${loc.versionBadge}" src="https://img.shields.io/badge/${loc.versionBadge}-1.1.0-blue.svg?style=for-the-badge&logo=visualstudiocode"/></a>
  <img alt="Platform" src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-6366f1.svg?style=for-the-badge&logo=apple"/>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-10b981.svg?style=for-the-badge"/>
  <img alt="${loc.langBadge}" src="https://img.shields.io/badge/${loc.langBadge}-ec4899.svg?style=for-the-badge&logo=google-translate"/>
  <img alt="${loc.privacyBadge}" src="https://img.shields.io/badge/${loc.privacyBadge}-06b6d4.svg?style=for-the-badge"/>
  <img alt="Security" src="https://img.shields.io/badge/security-audited%20%E2%9C%93-10b981.svg?style=for-the-badge"/>
  <img alt="Dependencies" src="https://img.shields.io/badge/runtime%20deps-0-06b6d4.svg?style=for-the-badge"/>
</p>

---

# ${loc.title}

${loc.lead}

---

## ${qs.title}

1. ${qs.step1}
2. ${qs.step2}
3. ${qs.step3}

---

## ${loc.showcaseHeader}

<table align="center" width="100%">
  <tr>
    <td align="center" width="25%" valign="top">
      <img src="assets/img1.png" alt="${i.img1[0]}" width="100%"/><br/>
      <sub><b>${i.img1[0]}</b><br/>${i.img1[1]}</sub>
    </td>
    <td align="center" width="25%" valign="top">
      <img src="assets/img3.png" alt="${i.img3[0]}" width="100%"/><br/>
      <sub><b>${i.img3[0]}</b><br/>${i.img3[1]}</sub>
    </td>
    <td align="center" width="25%" valign="top">
      <img src="assets/img4.png" alt="${i.img4[0]}" width="100%"/><br/>
      <sub><b>${i.img4[0]}</b><br/>${i.img4[1]}</sub>
    </td>
    <td align="center" width="25%" valign="top">
      <img src="assets/img5.png" alt="${i.img5[0]}" width="100%"/><br/>
      <sub><b>${i.img5[0]}</b><br/>${i.img5[1]}</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="25%" valign="top">
      <img src="assets/img2.png" alt="${i.img2[0]}" width="100%"/><br/>
      <sub><b>${i.img2[0]}</b><br/>${i.img2[1]}</sub>
    </td>
    <td align="center" width="25%" valign="top">
      <img src="assets/img7.png" alt="${i.img7[0]}" width="100%"/><br/>
      <sub><b>${i.img7[0]}</b><br/>${i.img7[1]}</sub>
    </td>
    <td align="center" colspan="2" valign="top">
      <img src="assets/img6.png" alt="${i.img6[0]}" width="100%"/><br/>
      <sub><b>${i.img6[0]}</b><br/>${i.img6[1]}</sub>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="4" valign="top">
      <img src="assets/img8.png" alt="${i.img8[0]}" width="100%"/><br/>
      <sub><b>${i.img8[0]}</b><br/>${i.img8[1]}</sub>
    </td>
  </tr>
</table>

---

## ${loc.featuresTitle}

### ${loc.sectionAccountsTitle}
${loc.sectionAccountsText}

### ${loc.sectionI18nTitle}
${loc.sectionI18nText}

### ${loc.sectionTokensTitle}
${loc.sectionTokensText}

### ${loc.sectionContextTitle}
${loc.sectionContextText}

### ${loc.sectionAnalyticsTitle}
${loc.sectionAnalyticsText}

### ${loc.sectionGuardTitle}
${loc.sectionGuardText}

---

## ${sec.title}

${sec.bullets}

---

## ğŸ—ï¸ Architecture & Internal Mechanics

\`\`\`mermaid
graph TB
    subgraph Antigravity_IDE["Antigravity IDE Environment"]
        WLS["Workspace LS<br/><code>--workspace_id</code><br/>â€¢ Model Quotas<br/>â€¢ Customization Tokens<br/>â€¢ Workspace Rules"]
        GLS["Global LS<br/><code>(Shared)</code><br/>â€¢ Cascade Trajectories<br/>â€¢ Context Window Data<br/>â€¢ Live Event Streams"]
    end

    subgraph NexusAG_Core["NexusAG Extension Core"]
        NEX["Core Controller & Event Bus"]
        VAULT["SecretStorage Vault<br/>OS Keychain / Credential Manager"]
        I18N["i18n Engine<br/>10 Reactive Locales"]
        ANALYTICS["Analytics & Pricing Engine<br/>LiteLLM Catalog & Disk Cache"]
        GUARD["Conversation Guard<br/>Pure TS Protobuf Codec"]
    end

    subgraph UI_Surfaces["Visual Interfaces"]
        SIDEBAR["Sidebar Webview Panel<br/>Live Quota Gauges & Controls"]
        DASHBOARD["Full-Editor Bento Dashboard<br/>Lifetime Analytics & Heatmap"]
        STATUSBAR["VS Code Status Bar<br/>Pinned Model Quotas"]
    end

    WLS <-->|Local IPC 127.0.0.1| NEX
    GLS <-->|Local IPC 127.0.0.1| NEX
    NEX --> VAULT
    NEX --> I18N
    NEX --> ANALYTICS
    NEX --> GUARD
    NEX --> SIDEBAR
    NEX --> DASHBOARD
    NEX --> STATUSBAR
\`\`\`

---

## ${loc.getStartedTitle}

### Installation
${loc.installText}

---

## âŒ¨ï¸ Command Palette

| Command | Identifier | Description |
|---|---|---|
| **NexusAG: Refresh Quota** | \`ag.refreshQuota\` | Forces an immediate quota and token budget refresh from Google APIs. |
| **NexusAG: Add Account** | \`ag.addAccount\` | Opens browser window for 1-click Google OAuth authentication. |
| **NexusAG: Add Account via Token** | \`ag.addAccountByToken\` | Opens modal for batch importing OAuth refresh tokens. |
| **NexusAG: Remove Account** | \`ag.removeAccount\` | Removes a selected account from local storage and tracking. |
| **NexusAG: Open Usage Statistics** | \`ag.openUsageStats\` | Launches the full-editor deep analytics bento dashboard. |
| **NexusAG: Fix Missing Conversations** | \`ag.fixConversations\` | Scans disk storage and repairs unindexed \`.pb\` conversations. |

---

## âš™ï¸ Configuration Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| \`ag-switchboard.language\` | \`string\` | \`auto\` | Interface language (\`auto\`, \`en\`, \`tr\`, \`pt-BR\`, \`es\`, \`de\`, \`fr\`, \`ja\`, \`zh-CN\`, \`hi\`, \`ru\`). |
| \`ag-switchboard.refreshInterval\` | \`string\` | \`1m\` | Background polling frequency for quota updates (\`instant\`, \`30s\`, \`1m\`, \`2m\`, \`5m\`). |
| \`ag-switchboard.modelPricing\` | \`object\` | Defaults | Custom per-model rates per 1M tokens (\`input\`, \`output\`, \`cache\`). |
| \`ag-switchboard.switchWithFixConversations\` | \`boolean\` | \`true\` | Automatically synchronizes and repairs the conversation index on account switch. |
| \`ag-switchboard.diagnosticMode\` | \`boolean\` | \`false\` | Enables verbose diagnostic file logging for troubleshooting. |

---

## ğŸ“Š Project Stats

<div align="center">

| Metric | Specification |
|---|---|
| **Total Source Modules** | 60 TypeScript + 2 CSS files |
| **Codebase Volume** | ~19,200+ Lines of Code |
| **Runtime Dependencies** | **0** (Zero external dependencies) |
| **Build System** | esbuild (Sub-second webview bundling) |
| **Supported Locales** | 10 Native Languages (251 keys each, 100% parity) |
| **Security Audit** | Passed â€” 0 critical / high findings |
| **Supported Platforms** | macOS (Apple Silicon / Intel), Windows 10/11, Linux (x64/arm64) |

</div>

---

## ğŸ› ï¸ Built With

- **[TypeScript](https://www.typescriptlang.org/)** â€” End-to-end static typing and enterprise resilience
- **[esbuild](https://esbuild.github.io/)** â€” Lightning-fast compilation and optimized asset packaging
- **[Font Awesome Pro](https://fontawesome.com/)** â€” Crisp, modern vector iconography
- **[LiteLLM Pricing Catalog](https://github.com/BerriAI/litellm)** â€” Accurate, community-maintained AI token pricing
- **Native VS Code API** â€” Deep integration with \`SecretStorage\`, \`WebviewViewProvider\`, and \`StatusBarItem\`

---

## â“ Frequently Asked Questions (FAQ)

<details>
<summary><b>Is my code, prompt, or account data sent to any third-party servers?</b></summary>
<br/>
<b>No.</b> NexusAG operates with a strict zero-telemetry policy. The extension communicates exclusively with official Google authentication and quota APIs, and with your local Antigravity Language Server on <code>127.0.0.1</code>. No analytics, transcripts, or telemetry are ever collected or transmitted.
</details>

<details>
<summary><b>Where are my Google credentials and OAuth tokens stored?</b></summary>
<br/>
All authentication tokens are secured using VS Code's native <code>SecretStorage</code> API (macOS Keychain, Windows Credential Manager, or Linux Secret Service/Keyring).
</details>

<details>
<summary><b>Why does NexusAG have zero (0) runtime dependencies?</b></summary>
<br/>
To eliminate supply-chain vulnerability vectors, minimize package bundle size, and guarantee maximum execution speed. All protocol handlingâ€”including Protobuf binary encoding and decodingâ€”is custom-built in native TypeScript.
</details>

---

## ğŸ¤ Contributing & Development

Contributions, bug reports, and feature suggestions are warmly welcomed!

1. Fork the repository: \`git clone https://github.com/AlperenAKKAYA99/NexusAG.git\`
2. Install development dependencies: \`npm install\`
3. Compile the extension & webviews: \`npm run compile\`
4. Launch Extension in Debug Mode (\`F5\` in VS Code / Antigravity IDE)
---

## ğŸ“‹ Changelog Highlights

For the full release history, see [CHANGELOG.md](CHANGELOG.md).

- **v1.1.0 (Current)** â€” 10-language instant reactive localization, multi-banner asset generation, enhanced UI showcase, and unified branding.
- **v1.0.5** â€” Usage Stats deduplication via \`responseId\`, dynamic model auto-humanization, and quota 100% bugfix ([#3](https://github.com/AlperenAKKAYA99/NexusAG/pull/3)).
- **v1.0.4** â€” **Conversation Guard**, standalone detached repair worker, and pure-TypeScript Protobuf trajectory codec for orphaned conversation recovery.
- **v1.0.3** â€” Multi-window state isolation, USS event gating, and background polling resilience.
- **v1.0.2** â€” Cross-source pin matching (â˜…), status bar quota integration, heatmap cost tooltips, and diagnostic logging harness.
- **v1.0.1** â€” Dual-LS architecture, full context window drill-down tab, and live event stream monitoring.
- **v1.0.0** â€” Initial public release: 1-click Google account switching, full-editor bento analytics, GitHub-style activity heatmap, and SecretStorage vault.

---

## ğŸ“„ License & Author

${loc.licenseText}

`;
}

console.log('Generating localized README files with img1-img8 showcase...');
for (const loc of LOCALES) {
    const filePath = path.join(ROOT_DIR, loc.filename);
    const content = buildReadmeContent(loc);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`âœ… Created ${loc.filename} (${loc.code})`);
}
console.log('All localized READMEs updated successfully!');


