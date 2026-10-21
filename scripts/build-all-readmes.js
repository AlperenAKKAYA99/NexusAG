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

function getNavbar(activeCode, isSubdir = false) {
    const rootReadme = isSubdir ? '../../README.md' : 'README.md';
    const i18nPrefix = isSubdir ? '' : 'docs/i18n/';
    const langs = [
        { code: 'en', label: 'English', file: rootReadme },
        { code: 'tr', label: 'Türkçe', file: i18nPrefix + 'README.tr.md' },
        { code: 'pt-BR', label: 'Português', file: i18nPrefix + 'README.pt-BR.md' },
        { code: 'es', label: 'Español', file: i18nPrefix + 'README.es.md' },
        { code: 'de', label: 'Deutsch', file: i18nPrefix + 'README.de.md' },
        { code: 'fr', label: 'Français', file: i18nPrefix + 'README.fr.md' },
        { code: 'ja', label: '日本語', file: i18nPrefix + 'README.ja.md' },
        { code: 'zh-CN', label: '简体中文', file: i18nPrefix + 'README.zh-CN.md' },
        { code: 'hi', label: 'हिन्दी', file: i18nPrefix + 'README.hi.md' },
        { code: 'ru', label: 'Русский', file: i18nPrefix + 'README.ru.md' }
    ];
    const links = langs.map(l => {
        if (l.code === activeCode) {
            return `<a href="${l.file}"><b>${l.label}</b></a>`;
        }
        return `<a href="${l.file}">${l.label}</a>`;
    });
    return `<p align="center">\n  ${links.join(' •\n  ')}\n</p>`;
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
        lead: '**NexusAG** ist die hochentwickelte Steuerzentrale für die **Google Antigravity IDE**. Es ermöglicht Entwicklern den sofortigen Kontowechsel mit einem Klick, Echtzeit-Überwachung von KI-Quoten über mehrere Google-Profile hinweg, tiefgehende Kontextfenster-Inspektion, Wiederherstellung verlorener Konversationen von der Festplatte und lebenslange Token-Kostenanalysen in einem vollständigen Editor-Dashboard.',
        showcaseHeader: '📸 Multi-Account-Schaltzentrale & UI Showcase',
        imgs: {
            img1: ['⚡ Multi-Account-Schaltzentrale', '1-Klick-Kontowechsel, Live-Quotenfortschritt & Reset-Countdown'],
            img3: ['🔑 Token-Budget & Kontext', 'Anpassungs-Donut, aktive Sitzungsanzeige & Workspace-Regeln'],
            img4: ['📈 Nutzungsstatistiken (Sidebar)', 'Sitzungstoken-Gesamtwerte, stündliche Aktivität & monatliche Kosten'],
            img5: ['🌐 Einstellungen & 10-Sprachen-Zentrale', 'Reaktiver Sofort-Sprachwechsler, Abfrageintervalle & Reparatur'],
            img2: ['🔑 Konten per Token hinzufügen', 'Stapelweises Einfügen von OAuth-Refresh-Tokens mit Validierung'],
            img7: ['🔒 Nahtlose Google OAuth-Anmeldung', '1-Klick-Browser-Authentifizierung mit automatischer Rückkehr'],
            img6: ['🔍 Kontextfenster-Detailansicht (Editor-Tab)', 'Hierarchischer Schrittbaum, Token-Kategorien & Markdown-Export'],
            img8: ['📊 Tiefgehendes Token-Analytics Bento-Dashboard (Vollbild)', 'Lebenslange Konversations-Prüfung, GitHub-Aktivitäts-Heatmap, Modellkosten-Tabelle & Top-Chats']
        },
        featuresTitle: '✨ Hauptfunktionen im Überblick',
        sectionAccountsTitle: '⚡ Multi-Account-Schaltzentrale & Live-Quoten',
        sectionAccountsText: `- **Unbegrenzte Konten** — Überwachen Sie mehrere Google-Konten parallel ohne Überschneidungen.
- **Sofortiger 1-Klick-Wechsel** — Wechseln Sie das aktive IDE-Konto direkt aus der Seitenleiste.
- **Farbkodierte Quotenbalken** — Sofortige Übersicht (🟢 >50%, 🟡 20-50%, 🔴 <20%) mit präzisen Reset-Countdowns.
- **Statusleisten-Integration** — Heften Sie Favoritenmodelle mit einem Stern (★) an die Statusleiste an.
- **Proaktive Token-Erneuerung** — Automatische Aktualisierung von OAuth-Tokens verhindert 401-Fehler.
- **Abo-Plan-Details** — Direkte Anzeige des Tiers (Ultra, Premium, Free) und Guthaben.`,
        sectionI18nTitle: '🌍 100% Mehrsprachigkeit & Reaktiver Sofortwechsel',
        sectionI18nText: `- **10 Native Sprachen**: Englisch, Türkisch, Portugiesisch, Spanisch, Deutsch, Französisch, Japanisch, Chinesisch, Hindi und Russisch.
- **Reaktiver Wechsel Ohne Neuladen** — Das Umschalten der Sprache übersetzt sofort **100%** der Benutzeroberfläche (Seitenleiste, Editor-Dashboard, Kontextfenster-Inspektor und Benachrichtigungen).`,
        sectionTokensTitle: '🔑 Token-Budget & Kontext-Intelligenz',
        sectionTokensText: `- **Anpassungs-Donut-Diagramm** — Token-Verbrauch für MCP-Tools, Regeln, Workflows und Skills.
- **Aktives Kontextfenster-Meter** — Echtzeit-Vergleich zwischen verbrauchten Tokens und Modellgrenzen.
- **Workspace-Kontext-Inspektor** — Direkte Dateilinks zu allen \`.agent/\`-Dateien mit Aktivierungsmodi.`,
        sectionContextTitle: '🔍 Kontextfenster-Detailansicht (Editor-Tab)',
        sectionContextText: `- Mit einem Klick über **"Alle anzeigen →"** erreichbar.
- **Hierarchischer Strukturbaum** — Detaillierte Aufschlüsselung von System-Prompt, Werkzeugen, MCP und Chat-Schritten.
- **Inline-Schrittvorschau** — Inhalte der einzelnen Schritte direkt im Editor prüfen.
- **Flammen-Symbole (🔥)** — Kennzeichnung der größten Token-Verbraucher im Kontext.
- **Markdown-Export** — Kontextdaten mit einem Klick in die Zwischenablage oder als Datei exportieren.`,
        sectionAnalyticsTitle: '📈 Tiefgehende Token-Analysen & Bento-Dashboard',
        sectionAnalyticsText: `- Erreichbar über **"Vollständiges Dashboard öffnen →"**.
- **Gesamter Historien-Scan** — Erfasst und analysiert sämtliche vergangenen Konversationen in Antigravity.
- **9 KPI-Metriken** — Input-, Cache-, Output- und Reasoning-Tokens, API-Aufrufe, geschätzte Kosten und Cache-Rate.
- **GitHub-Style Aktivitäts-Heatmap** — 365-Tage-Aktivitätsgitter mit Jahresauswahl.
- **Dynamische LiteLLM-Preisberechnung** — Präzise Kostenschätzungen basierend auf aktuellen API-Preisen.`,
        sectionGuardTitle: '🛡️ Konversations-Schutz (Conversation Guard)',
        sectionGuardText: `- **Automatische Erkennung verwaister Konversationen** — Gleicht \`.pb\`-Dateien auf der Festplatte mit dem Index ab.
- **1-Klick-Reparatur** — Beendet AG sicher, baut den Index neu auf und startet die IDE ohne Datenverlust neu.`,
        getStartedTitle: '🚀 Erste Schritte',
        installText: `1. Suchen Sie im Antigravity Extension Marketplace nach **NexusAG** und klicken Sie auf **Installieren**.
2. Oder installieren Sie direkt über die \`.vsix\`-Datei:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: 'Veröffentlicht unter der **MIT-Lizenz**. Entwickelt mit ☕ von **[Alperen AKKAYA](https://github.com/AlperenAKKAYA99)**'
    },
    {
        code: 'pt-BR',
        filename: 'README.pt-BR.md',
        banner: 'assets/banners/banner_pt-BR.png',
        versionBadge: 'versão',
        langBadge: 'idiomas-10%20nativos',
        privacyBadge: 'privacidade-100%25%20local',
        title: 'NexusAG',
        lead: '**NexusAG** é o painel de controle e suíte de inteligência de última geração desenvolvido para o **Google Antigravity IDE**. Permite alternar contas com 1 clique, monitorar cotas de IA em tempo real em múltiplos perfis Google, inspecionar a janela de contexto token por token, recuperar conversas perdidas do disco e analisar o consumo de tokens de todo o histórico com um painel analítico completo no editor.',
        showcaseHeader: '📸 Alternador de Contas e Galeria de Interface (UI Showcase)',
        imgs: {
            img1: ['⚡ Alternador de Contas', 'Troca de conta em 1 clique, progresso de cotas e timers de reset'],
            img3: ['🔑 Orçamento de Tokens e Contexto', 'Donut de customizações, medidor da sessão e regras'],
            img4: ['📈 Métricas de Uso (Sidebar)', 'Totais de tokens da sessão, atividade horária e custos mensais'],
            img5: ['🌐 Configurações e Hub de 10 Idiomas', 'Seletor reativo de idiomas, intervalos de atualização e reparo'],
            img2: ['🔑 Adicionar Contas via Token', 'Inserção em lote de refresh tokens OAuth com validação'],
            img7: ['🔒 Autenticação Google OAuth Sem Fricção', 'Login via navegador com 1 clique e retorno automático'],
            img6: ['🔍 Detalhes da Janela de Contexto (Aba do Editor)', 'Árvore hierárquica de etapas, categorias de tokens e exportação'],
            img8: ['📊 Painel Bento de Análise Profunda de Tokens (Editor Completo)', 'Auditoria de todo o histórico, heatmap estilo GitHub, distribuição de custos e top conversas']
        },
        featuresTitle: '✨ Principais Recursos e Destaques',
        sectionAccountsTitle: '⚡ Alternador de Contas e Monitoramento de Cotas',
        sectionAccountsText: `- **Contas Ilimitadas** — Monitore múltiplas contas Google simultaneamente sem conflitos.
- **Troca com 1 Clique** — Alterne a conta ativa no IDE diretamente pela barra lateral instantaneamente.
- **Medidores de Cota em Tempo Real** — Barras de capacidade coloridas (🟢 >50%, 🟡 20-50%, 🔴 <20%) e contagens regressivas exatas para o reset.
- **Integração com a Barra de Status** — Marque seus modelos favoritos com estrela (★) para visualização rápida na barra de status.
- **Renovação Proativa de Token** — Atualização automática do access_token em segundo plano evita erros 401 durante sessões longas.
- **Informações do Plano** — Identificação imediata da camada de assinatura (Ultra, Premium, Free) e créditos de prompt/fluxo.`,
        sectionI18nTitle: '🌍 100% Internacionalização e Troca Reativa Instantânea',
        sectionI18nText: `- **10 Idiomas Nativos**: Inglês, Turco, Português (Brasil), Espanhol, Alemão, Francês, Japonês, Chinês Simplificado, Hindi e Russo.
- **Troca Reativa Sem Recarregar** — Mudar de idioma na aba Configurações traduz instantaneamente **100%** da interface (Sidebar, Painel Bento no Editor, Detalhes de Contexto e diálogos) sem necessidade de reiniciar.`,
        sectionTokensTitle: '🔑 Orçamento de Tokens e Inteligência de Contexto',
        sectionTokensText: `- **Gráfico Donut de Customizações** — Consumo de tokens para Ferramentas MCP, Regras, Fluxos e Skills.
- **Medidor de Contexto Ativo** — Monitoramento em tempo real do limite de contexto do modelo versus tokens consumidos.
- **Inspetor de Espaço de Trabalho** — Links diretos para regras e workflows em \`.agent/\` com modos de ativação.`,
        sectionContextTitle: '🔍 Detalhamento da Janela de Contexto (Aba de Editor Completa)',
        sectionContextText: `- Acesse com um clique através do botão **"Ver Tudo →"**.
- **Árvore Hierárquica** — Divisão detalhada de System Prompt, Ferramentas, MCP e Mensagens de Chat com porcentagens exatas.
- **Prévia de Etapas Inline** — Inspecione o conteúdo de cada etapa sem sair do IDE.
- **Insígnias de Chamas (🔥)** — Destaca visualmente os maiores consumidores de contexto.
- **Exportação em Markdown** — Copie ou salve relatórios completos de contexto.`,
        sectionAnalyticsTitle: '📈 Análise Profunda de Tokens e Painel Bento',
        sectionAnalyticsText: `- Acesse através do botão **"Abrir Painel Completo →"**.
- **Agregação Histórica** — Analisa cada conversa registrada no Antigravity desde a instalação.
- **9 Métricas KPI** — Tokens de Entrada, Cache, Saída, Raciocínio, chamadas totais, custo estimado e taxa de acerto de cache.
- **Heatmap Estilo GitHub** — Grade de atividade anual com seletor de ano e indicadores de picos.
- **Cálculo Dinâmico com LiteLLM** — Estimativa precisa de custos de API por modelo.`,
        sectionGuardTitle: '🛡️ Guardião de Conversas (Conversation Guard)',
        sectionGuardText: `- **Detecção Automática** — Compara arquivos locais \`.pb\` do disco com o índice da barra lateral 15s após a inicialização.
- **Reparo com 1 Clique** — Fecha o AG com segurança, reconstrói o índice do zero e reinicia o IDE sem perda de dados.`,
        getStartedTitle: '🚀 Primeiros Passos',
        installText: `1. Procure por **NexusAG** no marketplace de extensões do Antigravity e clique em **Instalar**.
2. Ou instale via arquivo \`.vsix\`:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: 'Distribuído sob a **Licença MIT**. Desenvolvido com ☕ por **[Alperen AKKAYA](https://github.com/AlperenAKKAYA99)**'
    },
    {
        code: 'es',
        filename: 'README.es.md',
        banner: 'assets/banners/banner_es.png',
        versionBadge: 'versión',
        langBadge: 'idiomas-10%20nativos',
        privacyBadge: 'privacidad-100%25%20local',
        title: 'NexusAG',
        lead: '**NexusAG** es el panel de control y suite de inteligencia de última generación diseñado para **Google Antigravity IDE**. Permite a los desarrolladores cambiar de cuenta con 1 clic, supervisar las cuotas de IA en tiempo real en múltiples perfiles de Google, analizar la ventana de contexto token por token, recuperar conversaciones perdidas del disco y examinar el consumo de tokens histórico con un panel de análisis completo en el editor.',
        showcaseHeader: '📸 Selector Multicuenta y Galería de Interfaz (UI Showcase)',
        imgs: {
            img1: ['⚡ Selector Multicuenta', 'Cambio de cuenta en 1 clic, progreso de cuotas y temporizadores'],
            img3: ['🔑 Presupuesto de Tokens y Contexto', 'Donut de personalizaciones, medidor de sesión y reglas'],
            img4: ['📈 Estadísticas de Uso (Sidebar)', 'Totales de tokens de sesión, actividad horaria y costes mensuales'],
            img5: ['🌐 Ajustes y Centro de 10 Idiomas', 'Selector reactivo de idioma, intervalos de refresco y reparación'],
            img2: ['🔑 Añadir Cuentas vía Token', 'Pegado por lotes de refresh tokens OAuth con validación'],
            img7: ['🔒 Autenticación Google OAuth Fluida', 'Inicio de sesión en navegador con 1 clic y retorno automático'],
            img6: ['🔍 Detalle de Ventana de Contexto (Pestaña Editor)', 'Árbol jerárquico de pasos, categorías de tokens y exportación'],
            img8: ['📊 Panel Bento de Analítica Profunda de Tokens (Pantalla Completa)', 'Auditoría histórica total, mapa de calor estilo GitHub, tabla de costes y conversaciones top']
        },
        featuresTitle: '✨ Características Principales',
        sectionAccountsTitle: '⚡ Selector Multicuenta y Monitorización de Cuotas en Vivo',
        sectionAccountsText: `- **Cuentas Ilimitadas** — Monitorice múltiples cuentas de Google simultáneamente sin conflictos.
- **Cambio Instantáneo en 1 Clic** — Cambie la cuenta activa del IDE directamente desde la barra lateral.
- **Indicadores de Cuota en Tiempo Real** — Barras de capacidad con código de colores (🟢 >50%, 🟡 20-50%, 🔴 <20%) y temporizadores de reinicio exactos.
- **Integración con Barra de Estado** — Fije modelos con estrella (★) para ver cuotas sin abrir el panel.
- **Renovación Proactiva de Tokens** — Refresco automático de tokens OAuth para evitar errores 401.
- **Información del Nivel de Suscripción** — Visualice su categoría (Ultra, Premium, Free) y créditos disponibles.`,
        sectionI18nTitle: '🌍 100% Internacionalización y Cambio Reactivo Instantáneo',
        sectionI18nText: `- **10 Idiomas Nativos**: Inglés, Turco, Portugués, Español, Alemán, Francés, Japonés, Chino Simplificado, Hindi y Ruso.
- **Cambio Reactivo Sin Recargar** — Cambiar el idioma en la pestaña Ajustes traduce instantáneamente el **100%** de la interfaz (Sidebar, Panel Bento en Editor, Detalle de Contexto y diálogos).`,
        sectionTokensTitle: '🔑 Presupuesto de Tokens e Inteligencia de Contexto',
        sectionTokensText: `- **Gráfico Donut de Personalizaciones** — Desglose de tokens para MCP Tools, Reglas, Workflows y Skills.
- **Medidor de Contexto Activo** — Visualización en tiempo real del límite del modelo frente a tokens usados.
- **Inspector de Contexto de Workspace** — Enlaces directos a archivos en \`.agent/\` con modos de activación.`,
        sectionContextTitle: '🔍 Detalle de Ventana de Contexto (Pestaña Completa de Editor)',
        sectionContextText: `- Acceda en un clic con el botón **"Ver Todo →"**.
- **Árbol Jerárquico** — Desglose agrupado de System Prompt, Herramientas, MCP y Mensajes de Chat.
- **Vistas Previas Inline** — Inspeccione el contenido de cada paso sin salir del IDE.
- **Insignias de Fuego (🔥)** — Destaque visual inmediato de los pasos con mayor consumo de tokens.
- **Exportación a Markdown** — Guarde o copie al portapapeles el historial de contexto formateado.`,
        sectionAnalyticsTitle: '📈 Analítica Profunda de Tokens y Panel Bento',
        sectionAnalyticsText: `- Acceda mediante el botón **"Abrir Panel Completo →"**.
- **Agregación Histórica Total** — Escanea y suma el uso de tokens en cada conversación en Antigravity.
- **9 Métricas KPI** — Entrada, Lecturas de Caché, Salida, Razonamiento, llamadas totales, coste estimado y ratio de acierto de caché.
- **Mapa de Calor Estilo GitHub** — Grícula de actividad de 365 días con selector de año y picos de uso.
- **Motor de Precios LiteLLM** — Estimación precisa del coste de API según las tarifas vigentes.`,
        sectionGuardTitle: '🛡️ Guardián de Conversaciones (Conversation Guard)',
        sectionGuardText: `- **Detección Automática de Huérfanas** — Compara archivos \`.pb\` en disco con el índice de la barra lateral tras 15s de inicio.
- **Reparación en 1 Clic** — Cierra AG de forma segura, reconstruye el índice y reinicia el IDE automáticamente.`,
        getStartedTitle: '🚀 Primeros Pasos',
        installText: `1. Busque **NexusAG** en el Marketplace de extensiones de Antigravity e instálela.
2. O instálela mediante el archivo \`.vsix\`:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: 'Distribuido bajo la **Licencia MIT**. Creado con ☕ por **[Alperen AKKAYA](https://github.com/AlperenAKKAYA99)**'
    },
    {
        code: 'fr',
        filename: 'README.fr.md',
        banner: 'assets/banners/banner_fr.png',
        versionBadge: 'version',
        langBadge: 'langues-10%20natives',
        privacyBadge: 'confidentialité-100%25%20locale',
        title: 'NexusAG',
        lead: '**NexusAG** est le panneau de contrôle de nouvelle génération conçu pour l\'environnement **Google Antigravity IDE**. Il permet aux développeurs de changer de compte en 1 clic, de surveiller les quotas IA en temps réel sur plusieurs profils Google, d\'analyser la fenêtre de contexte pas à pas, de récupérer les conversations orphelines sur disque et d\'auditer la consommation globale de jetons via un tableau de bord analytique complet.',
        showcaseHeader: '📸 Sélecteur Multi-comptes et Galerie d\'Interface (UI Showcase)',
        imgs: {
            img1: ['⚡ Sélecteur Multi-comptes', 'Changement de compte en 1 clic, jauges de quotas et comptes à rebours'],
            img3: ['🔑 Budget de Tokens et Contexte', 'Donut des personnalisations, jauge de session et règles'],
            img4: ['📈 Statistiques d\'Utilisation (Sidebar)', 'Totaux de jetons de session, activité horaire et coûts mensuels'],
            img5: ['🌐 Paramètres et Hub 10 Langues', 'Sélecteur réactif de langue, intervalles d\'actualisation et réparation'],
            img2: ['🔑 Ajouter des Comptes via Token', 'Collage par lot de tokens d\'actualisation OAuth avec validation'],
            img7: ['🔒 Authentification Google OAuth Fluide', 'Connexion dans le navigateur en 1 clic avec retour automatique'],
            img6: ['🔍 Détail de la Fenêtre de Contexte (Onglet Éditeur)', 'Arborescence des étapes, ventilation des tokens et export Markdown'],
            img8: ['📊 Tableau de Bord Bento d\'Analyse Approfondie (Plein Éditeur)', 'Audit de tout l\'historique, heatmap GitHub, grille des coûts par modèle et top conversations']
        },
        featuresTitle: '✨ Fonctionnalités Majeures',
        sectionAccountsTitle: '⚡ Sélecteur Multi-comptes et Quotas en Temps Réel',
        sectionAccountsText: `- **Comptes Illimités** — Suivez plusieurs comptes Google simultanément sans conflit.
- **Bascule Instantanée en 1 Clic** — Changez le compte actif de l'IDE directement depuis la barre latérale.
- **Jauges de Quotas en Temps Réel** — Barres colorées (🟢 >50%, 🟡 20-50%, 🔴 <20%) avec compte à rebours de réinitialisation précis.
- **Intégration Barre d'État** — Épinglez vos modèles favoris avec une étoile (★) pour un suivi constant.
- **Renouvellement Proactif des Jetons** — Rafraîchissement automatique des jetons d'accès évitant les erreurs 401.
- **Détails de l'Abonnement** — Affichage direct du palier (Ultra, Premium, Free) et des crédits d'utilisation.`,
        sectionI18nTitle: '🌍 100% Internationalisation et Réactivité Immédiate',
        sectionI18nText: `- **10 Langues Natives**: Anglais, Turc, Portugais, Espagnol, Allemand, Français, Japonais, Chinois Simplifié, Hindi et Russe.
- **Basculement Sans Rechargement** — Changer de langue dans l'onglet Paramètres traduit instantanément **100%** de l'interface (Sidebar, Tableau Bento, Inspection de Contexte et alertes).`,
        sectionTokensTitle: '🔑 Budget de Tokens et Intelligence de Contexte',
        sectionTokensText: `- **Graphique Donut des Personnalisations** — Empreinte token des outils MCP, règles, flux et compétences.
- **Jauge de Fenêtre de Contexte Active** — Comparaison en direct entre tokens consommés et limite maximale du modèle.
- **Inspecteur de Contexte de l'Espace de Travail** — Liens directs vers les fichiers \`.agent/\` et modes d'activation.`,
        sectionContextTitle: '🔍 Détail de la Fenêtre de Contexte (Onglet Éditeur Complet)',
        sectionContextText: `- Accessible en un clic via **"Voir Tout →"**.
- **Arborescence Hiérarchique** — Décomposition du System Prompt, des Outils, de MCP et des messages.
- **Aperçus Intégrés** — Examinez le contenu de chaque étape directement dans l'éditeur.
- **Badges Flamme (🔥)** — Repérez immédiatement les étapes les plus coûteuses en tokens.
- **Export Markdown** — Exportez facilement les métriques de contexte.`,
        sectionAnalyticsTitle: '📈 Statistiques Approfondies et Tableau de Bord Bento',
        sectionAnalyticsText: `- Accessible via **"Ouvrir le Tableau Complet →"**.
- **Agrégation de Tout l'Historique** — Analyse l'ensemble des conversations enregistrées dans Antigravity.
- **9 Métriques KPI** — Tokens d'entrée, de cache, de sortie, de réflexion, nombre d'appels et taux de cache.
- **Heatmap d'Activité Style GitHub** — Grille annuelle avec sélecteur d'année et pic d'utilisation.
- **Moteur Tarifaire LiteLLM** — Estimation précise des coûts de facturation API.`,
        sectionGuardTitle: '🛡️ Garde de Conversation (Conversation Guard)',
        sectionGuardText: `- **Détection Automatique des Conversations Perdues** — Compare les fichiers \`.pb\` avec l'index IDE 15s après le démarrage.
- **Réparation en 1 Clic** — Ferme AG en toute sécurité, reconstruit l'index et relance l'IDE sans perte de données.`,
        getStartedTitle: '🚀 Démarrage Rapide',
        installText: `1. Recherchez **NexusAG** dans le Marketplace d'extensions Antigravity et cliquez sur **Installer**.
2. Ou installez directement depuis le fichier \`.vsix\` :
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: 'Distribué sous **Licence MIT**. Développé avec ☕ par **[Alperen AKKAYA](https://github.com/AlperenAKKAYA99)**'
    },
    {
        code: 'ja',
        filename: 'README.ja.md',
        banner: 'assets/banners/banner_ja.png',
        versionBadge: 'バージョン',
        langBadge: '言語-10言語対応',
        privacyBadge: 'プライバシー-100%25ローカル',
        title: 'NexusAG',
        lead: '**NexusAG** は、**Google Antigravity IDE** のために設計された次世代のインテリジェント・コントロールパネルです。ワンクリックでのアカウント切り替え、複数 Google プロファイルのリアルタイム AI クォータ容量監視、コンテキストウィンドウのトークン詳細ツリー分析、ディスクからの消失会話履歴の自動復旧、そしてエディタ全画面ダッシュボードによる全期間トークン消費分析を提供します。',
        showcaseHeader: '📸 マルチアカウント切替盤 ＆ UI ギャラリー (UI Showcase)',
        imgs: {
            img1: ['⚡ マルチアカウント切替盤', 'ワンクリック切替、リアルタイム利用枠進捗＆リセットタイマー'],
            img3: ['🔑 トークンバジェット＆コンテキスト', 'カスタマイズドーナツ、アクティブセッション枠＆ルール'],
            img4: ['📈 利用統計（サイドバー）', 'セッショントークン合計、時間別アクティビティ＆月別コスト'],
            img5: ['🌐 設定＆10言語ハブ', '即時リアクティブ言語切替、ポーリング間隔＆復元スキャン'],
            img2: ['🔑 トークン一括追加モーダル', '検証機能付き OAuth リフレッシュトークンの一括登録'],
            img7: ['🔒 シームレスな Google OAuth 認証', '自動クローズ対応のワンクリック・ブラウザ認証フロー'],
            img6: ['🔍 コンテキストウィンドウ詳細（エディタタブ）', '階層化ステップツリー、トークンカテゴリ分類＆Markdown出力'],
            img8: ['📊 トークン詳細分析 Bento ダッシュボード（全画面エディタ）', '全履歴の会話監査、GitHub風活動ヒートマップ、モデル別コスト表＆会話ランキング']
        },
        featuresTitle: '✨ 主な機能と特徴',
        sectionAccountsTitle: '⚡ マルチアカウント切替盤とリアルタイム利用枠監視',
        sectionAccountsText: `- **無制限のアカウント登録** — 複数の Google アカウントを競合なく同時に監視できます。
- **ワンクリック即時切り替え** — メニューを開くことなく、サイドバーから直接アクティブアカウントを即座に切り替えます。
- **カラー別リアルタイムゲージ** — 残量に応じた色分け表示（🟢 >50%、🟡 20-50%、🔴 <20%）と正確なリセットカウントダウン。
- **ステータスバー連動** — お気に入りモデルに星（★）を付けることで、パネルを開かずにステータスバーで枠を常時確認可能。
- **プロアクティブなトークン更新** — バックグラウンドでアクセストークンを自動更新し、長時間の開発セッションでも認証切れを防止します。
- **プラン情報の可視化** — Ultra、Premium、Free などのプラン階層とクレジット残量を即時表示。`,
        sectionI18nTitle: '🌍 100% 完全多言語対応・即時リアクティブ切替',
        sectionI18nText: `- **10の主要言語をネイティブサポート**: 英語、トルコ語、ポルトガル語、スペイン語、ドイツ語、フランス語、日本語、簡体字中国語、ヒンディー語、ロシア語。
- **リロード不要のリアクティブ切替** — 設定タブで言語を選択すると、サイドバー、全画面 Bento ダッシュボード、コンテキスト詳細画面、ダイアログに至るまで **100% の UI が瞬時に切り替わります**。`,
        sectionTokensTitle: '🔑 トークンバジェット＆コンテキスト・インテリジェンス',
        sectionTokensText: `- **カスタマイズバジェット・ドーナツ** — MCP ツール、Rules、Workflows、Skills ごとの消費量を視覚化。
- **アクティブコンテキスト利用枠** — 使用中トークン数とモデルの上限値をリアルタイムで比較。
- **ワークスペースコンテキスト検査** — \`.agent/\` ディレクトリ内のルールへの直接ファイルリンクとトリガー状態を表示。`,
        sectionContextTitle: '🔍 コンテキストウィンドウ詳細分析（全画面エディタタブ）',
        sectionContextText: `- サイドバーの **"すべて見る →"** からワンクリックで展開。
- **階層化ステップツリー** — System Prompt、ツール呼び出し、MCP、チャット履歴ごとのトークン数と割合。
- **インライン・ステッププレビュー** — IDE を離れることなく、プロンプトやモデル応答、コマンド出力を直接プレビュー。
- **炎バッジ（🔥）** — コンテキストを最も圧迫している重いステップを瞬時に識別。
- **Markdown エクスポート** — ワンクリックでレポートをコピーまたはファイル保存。`,
        sectionAnalyticsTitle: '📈 トークン詳細分析＆ Bento ダッシュボード',
        sectionAnalyticsText: `- **"全画面ダッシュボードを開く →"** から起動。
- **全履歴スキャン** — Antigravity 上で行われた過去すべての会話からトークン消費を集計。
- **9つの主要 KPI 指標** — 入力、キャッシュ読み取り、出力、思考トークン、API コスト試算、キャッシュ率。
- **GitHub スタイル・アクティビティヒートマップ** — 365日間の活動グリッドとピーク日表示。
- **LiteLLM 動的プライシング** — 各モデルの最新単価に基づいた高精度な API 利用コスト算出。`,
        sectionGuardTitle: '🛡️ 会話履歴復元ガード（Conversation Guard）',
        sectionGuardText: `- **消失会話の自動検知** — 起動15秒後にディスク上の \`.pb\` ファイルとサイドバー索引を照合。
- **ワンクリック復旧** — 安全に AG を終了し、ディスクからインデックスを再構築して IDE を自動再起動します。`,
        getStartedTitle: '🚀 はじめ方',
        installText: `1. Antigravity 拡張機能マーケットプレイスで **NexusAG** を検索し、**インストール** をクリックします。
2. または \`.vsix\` ファイルから直接インストールします:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: '**MIT ライセンス**の下で公開されています。Made with ☕ by **[Alperen AKKAYA](https://github.com/AlperenAKKAYA99)**'
    },
    {
        code: 'zh-CN',
        filename: 'README.zh-CN.md',
        banner: 'assets/banners/banner_zh-CN.png',
        versionBadge: '版本',
        langBadge: '多语言-10种原生语言',
        privacyBadge: '隐私安全-100%25本地数据',
        title: 'NexusAG',
        lead: '**NexusAG** 是专为 **Google Antigravity IDE** 打造的新一代多账户智能控制中心。让开发者能够一键瞬时切换多账号，实时监控多个 Google 账户的 AI 配额与重置倒计时，深层解析上下文窗口 Token 消耗分级树，自动挽救并重建丢失的对话记录，并通过全尺寸 Bento 仪表盘对历史全部 Token 账单进行精细化成本核算。',
        showcaseHeader: '📸 多账户控制中心与 UI 界面展示 (UI Showcase)',
        imgs: {
            img1: ['⚡ 多账户控制中心', '一键瞬时切号、实时配额进度条与重置倒计时'],
            img3: ['🔑 Token 预算与上下文', '自定义项环形图、活跃会话用量与工作区规则'],
            img4: ['📈 侧边栏使用统计', '会话 Token 总量、每小时活跃趋势与月度费用明细'],
            img5: ['🌐 设置与 10 语言中心', '即时响应式语言切换、后台轮询频率与索引修复'],
            img2: ['🔑 令牌一键批量添加', '带格式校验的多行 OAuth Refresh Token 批量导入窗口'],
            img7: ['🔒 极速 Google OAuth 网页授权', '支持浏览器 1 键安全授权与自动跳回 IDE 闭环'],
            img6: ['🔍 上下文窗口深度解析（独立编辑标签页）', '多级分层步骤树、Token 分类占比色条与 Markdown 一键导出'],
            img8: ['📊 全尺寸 Bento Token 深度消耗大盘（全屏独立视图）', '全历史会话穿透审计、GitHub 风格贡献热力图、模型精细化单价表与高额会话榜单']
        },
        featuresTitle: '✨ 核心特性一览',
        sectionAccountsTitle: '⚡ 多账户极速切号与实时配额监控',
        sectionAccountsText: `- **支持无上限绑定** — 完美同时管理多个 Google 账户，互不干扰。
- **一键免登瞬时切换** — 无需重复登录，直接在侧边栏点击即可秒级切换 IDE 当前活跃账号。
- **动态配额容量进度条** — 颜色直观分区（🟢 >50%、🟡 20-50%、🔴 <20%），配备精准的重置倒计时。
- **状态栏无感常驻** — 点击星号（★）即可将最爱模型或配额钉在底栏，无需展开面板随时掌控。
- **前置令牌自动续期** — 后台自动续期 access_token，彻底告别长时间编码中的 401 认证中断。
- **订阅套餐与积分信息** — 快速查看账号所属层级（Ultra、Premium、Free）及 AI 积分余量。`,
        sectionI18nTitle: '🌍 100% 全量本地化与即时无刷新多语言响应',
        sectionI18nText: `- **原生内置 10 种国际主流语言**: 英语、土耳其语、巴西葡萄牙语、西班牙语、德语、法语、日语、简体中文、印地语和俄语。
- **秒级即时响应** — 在设置页切换语言时，**100%** 的界面元素（侧边栏、全尺寸 Bento 仪表盘、上下文树、对话框及系统提示）瞬间完成本地化，无需重新加载窗口。`,
        sectionTokensTitle: '🔑 Token 预算与上下文智能洞察',
        sectionTokensText: `- **自定义项环形图** — 直观呈现 MCP 工具、全局规则、工作流和 Skills 的 Token 占用。
- **实时活跃上下文用量** — 实时监控当前模型单次调用消耗与最大上限的百分比。
- **工作区规则检查器** — 直达 \`.agent/\` 规则文件，清晰呈现触发模式（\`always-on\`、\`model-decision\`、\`manual\`）。`,
        sectionContextTitle: '🔍 上下文窗口深度解析（全尺寸独立标签页）',
        sectionContextText: `- 在侧边栏点击 **"查看完整明细 →"** 一键打开。
- **多级分层树状图** — 完整拆解系统提示词、工具调用、MCP 与会话记录的精确 Token 与占比。
- **行内无跳出预览** — 直接在当前界面查看提示词明细、大模型回复、工具输入和命令输出。
- **火焰高耗预警（🔥）** — 自动标红最吃上下文的超大步骤。
- **一键导出 Markdown** — 方便存档与团队分享。`,
        sectionAnalyticsTitle: '📈 全局 Token 消耗深度分析与 Bento 仪表盘',
        sectionAnalyticsText: `- 点击侧边栏 **"打开全屏分析大盘 →"** 查看。
- **全历史周期回溯** — 深度检索汇总您在 Antigravity 中产生过的所有历史会话。
- **9 项核心指标** — 统计输入、缓存命中、输出、思考 Token、调用总频次、估算账单与缓存命中率。
- **GitHub 风格贡献热力图** — 完整支持 365 天历史网格，配备年度切换与峰值日高亮。
- **LiteLLM 动态定价引擎** — 精确结合最新官方 API 资费与自定义单价，账单计算精准到分。`,
        sectionGuardTitle: '🛡️ 会话守护与恢复（Conversation Guard）',
        sectionGuardText: `- **自动检测磁盘孤儿对话** — 开机 15 秒自动扫描本地磁盘 \`.pb\` 记录与侧边栏索引的比对差异。
- **一键自动化修复** — 优雅关闭 AG、从磁盘极速重建侧边栏索引并自动重拉 IDE，绝不损坏原有数据。`,
        getStartedTitle: '🚀 快速上手',
        installText: `1. 在 Antigravity 扩展商店搜索 **NexusAG**，点击 **安装**。
2. 或者直接通过 \`.vsix\` 安装包本地安装:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: '基于 **MIT 许可证** 开源发布。由 **[Alperen AKKAYA](https://github.com/AlperenAKKAYA99)** 倾情打造。'
    },
    {
        code: 'hi',
        filename: 'README.hi.md',
        banner: 'assets/banners/banner_hi.png',
        versionBadge: 'वर्ज़न',
        langBadge: 'भाषाएं-10%20मूल%20भाषाएं',
        privacyBadge: 'गोपनीयता-100%25%20स्थानीय',
        title: 'NexusAG',
        lead: '**NexusAG** **Google Antigravity IDE** के लिए डिज़ाइन किया गया अगली पीढ़ी का बुद्धिमान नियंत्रण कक्ष और इंटेलिजेंस सूट है। यह डेवलपर्स को 1-क्लिक में खाते बदलने, कई Google प्रोफाइल में रीयल-टाइम AI कोटा की निगरानी करने, कॉन्टेक्स्ट विंडो टोकन ब्रेकडाउन का विश्लेषण करने, डिस्क से खोई हुई बातचीत को पुनर्प्राप्त करने और पूरे इतिहास के टोकन उपयोग का विश्लेषण करने की अनुमति देता है।',
        showcaseHeader: '📸 मल्टी-अकाउंट स्विचबोर्ड और यूआई गैलरी (UI Showcase)',
        imgs: {
            img1: ['⚡ मल्टी-अकाउंट स्विचबोर्ड', '1-क्लिक खाता स्विचिंग, रीयल-टाइम कोटा प्रगति और रीसेट टाइमर'],
            img3: ['🔑 टोकन बजट और कॉन्टेक्स्ट', 'कस्टमाइज़ेशन डोनट, सक्रिय सत्र गेज और नियम'],
            img4: ['📈 उपयोग आंकड़े (साइडबार)', 'सत्र टोकन योग, प्रति घंटा गतिविधि और मासिक लागत'],
            img5: ['🌐 सेटिंग्स और 10-भाषा केंद्र', 'त्वरित प्रतिक्रियाशील भाषा चयनकर्ता, अंतराल और मरम्मत'],
            img2: ['🔑 टोकन द्वारा खाते जोड़ें', 'सत्यापन के साथ बैच OAuth रीफ़्रेश टोकन पेस्ट'],
            img7: ['🔒 निर्बाध Google OAuth प्रमाणीकरण', 'ऑटो-रिटर्न के साथ 1-क्लिक ब्राउज़र लॉगिन'],
            img6: ['🔍 कॉन्टेक्स्ट विंडो विवरण (संपादक टैब)', 'पदानुक्रमित स्टेप ट्री, टोकन श्रेणी विभाजन और मार्कडाउन निर्यात'],
            img8: ['📊 डीप टोकन एनालिटिक्स बेन्टो डैशबोर्ड (पूर्ण संपादक)', 'आजीवन बातचीत ऑडिट, GitHub-शैली हीटमैप, मॉडल लागत तालिका और शीर्ष चैट']
        },
        featuresTitle: '✨ मुख्य विशेषताएं',
        sectionAccountsTitle: '⚡ मल्टी-अकाउंट स्विचबोर्ड और रीयल-टाइम कोटा ट्रैकिंग',
        sectionAccountsText: `- **असीमित खाते** — बिना किसी रुकावट के एक साथ कई Google खातों की निगरानी करें।
- **1-क्लिक त्वरित स्विचिंग** — साइडबार से सीधे सक्रिय खाते को तुरंत बदलें।
- **रीयल-टाइम कोटा गेज** — रंग-कोडित क्षमता संकेतक (🟢 >50%, 🟡 20-50%, 🔴 <20%) और सटीक रीसेट टाइमर।
- **स्टेटस बार एकीकरण** — पसंदीदा मॉडल को स्टार (★) करें और बिना पैनल खोले स्थिति देखें।
- **सक्रिय टोकन नवीनीकरण** — स्वचालित बैकग्राउंड रीफ्रेश लंबे सत्रों के दौरान 401 त्रुटियों को रोकता है।`,
        sectionI18nTitle: '🌍 100% बहुभाषी समर्थन और त्वरित प्रतिक्रियाशील स्विचिंग',
        sectionI18nText: `- **10 मूल भाषाएं**: अंग्रेजी, तुर्की, पुर्तगाली, स्पेनिश, जर्मन, फ्रेंच, जापानी, चीनी, हिन्दी और रूसी।
- **बिना पुनः लोड किए त्वरित स्विचिंग** — सेटिंग्स में भाषा बदलने पर **100% इंटरफ़ेस तुरंत बदल जाता है**।`,
        sectionTokensTitle: '🔑 टोकन बजट और कॉन्टेक्स्ट इंटेलिजेंस',
        sectionTokensText: `- **कस्टमाइज़ेशन बजट डोनट** — MCP टूल्स, रूल्स, वर्कफ़्लो और स्किल्स का टोकन उपयोग देखें।
- **सक्रिय कॉन्टेक्स्ट गेज** — मॉडल की सीमा और उपयोग किए गए टोकन की तुलना रीयल-टाइम में करें।`,
        sectionContextTitle: '🔍 कॉन्टेक्स्ट विंडो ड्रिल-डाउन (पूर्ण संपादक टैब)',
        sectionContextText: `- **"सभी देखें →"** पर क्लिक करके सीधे पहुंचें।
- **पदानुक्रमित स्टेप ट्री** — सिस्टम प्रॉम्प्ट, टूल्स, MCP और चैट संदेशों का सटीक टोकन विभाजन।
- **इनलाइन स्टेप पूर्वावलोकन** — IDE छोड़े बिना प्रत्येक स्टेप का आउटपुट देखें।
- **फ्लेम बैज (🔥)** — सबसे भारी टोकन उपभोक्ताओं की तुरंत पहचान करें।`,
        sectionAnalyticsTitle: '📈 डीप टोकन एनालिटिक्स और बेन्टो डैशबोर्ड',
        sectionAnalyticsText: `- **"पूरा डैशबोर्ड खोलें →"** पर क्लिक करके देखें।
- **आजीवन उपयोग का सारांश** — Antigravity में आपकी सभी पिछली बातचीतों का विश्लेषण करता है।
- **9 प्रमुख KPI मेट्रिक्स** — इनपुट, कैश रीड, आउटपुट, रीजनिंग टोकन, लागत और कैश हिट दर।
- **GitHub स्टाइल हीटमैप** — 365 दिनों का गतिविधि ग्रिड।`,
        sectionGuardTitle: '🛡️ कन्वर्सेशन गार्ड (Conversation Guard)',
        sectionGuardText: `- **खोई हुई बातचीत का पता लगाना** — डिस्क पर मौजूद \`.pb\` फ़ाइलों की तुलना साइडबार इंडेक्स से करता है।
- **1-क्लिक मरम्मत** — सुरक्षित रूप से इंडेक्स को पुनर्निर्मित करता है और IDE को पुनः प्रारंभ करता है।`,
        getStartedTitle: '🚀 शुरुआत करें',
        installText: `1. Antigravity Extension Marketplace में **NexusAG** खोजें और **Install** पर क्लिक करें।
2. या सीधे \`.vsix\` फ़ाइल से इंस्टॉल करें:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: '**MIT लाइसेंस** के तहत वितरित। **[Alperen AKKAYA](https://github.com/AlperenAKKAYA99)** द्वारा ☕ के साथ विकसित।'
    },
    {
        code: 'ru',
        filename: 'README.ru.md',
        banner: 'assets/banners/banner_ru.png',
        versionBadge: 'версия',
        langBadge: 'языки-10%20нативных',
        privacyBadge: 'приватность-100%25%20локально',
        title: 'NexusAG',
        lead: '**NexusAG** — это панель управления нового поколения и интеллектуальный центр для **Google Antigravity IDE**. Расширение позволяет разработчикам переключать учетные записи в 1 клик, отслеживать лимиты AI в реальном времени для нескольких профилей Google, детально исследовать окно контекста, восстанавливать утерянные диалоги с диска и проводить глубокий финансовый аудит расходов на токены через полноэкранный дашборд.',
        showcaseHeader: '📸 Мульти-аккаунты и галерея интерфейса (UI Showcase)',
        imgs: {
            img1: ['⚡ Мульти-аккаунты', 'Переключение в 1 клик, прогресс квот и таймеры сброса'],
            img3: ['🔑 Бюджет токенов и контекст', 'Кольцевая диаграмма кастомизаций, активная сессия и правила'],
            img4: ['📈 Статистика использования (Боковая панель)', 'Итоги токенов сессии, почасовая активность и помесячные затраты'],
            img5: ['🌐 Настройки и 10 языков', 'Мгновенный переключатель языка, интервалы опроса и сканирование'],
            img2: ['🔑 Добавление аккаунтов по токену', 'Пакетный ввод OAuth refresh-токенов с валидацией'],
            img7: ['🔒 Бесшовная авторизация Google OAuth', 'Вход через браузер в 1 клик с автоматическим возвратом'],
            img6: ['🔍 Детализация окна контекста (Вкладка редактора)', 'Иерархическое дерево шагов, категории токенов и экспорт в Markdown'],
            img8: ['📊 Полноэкранный дашборд Bento глубокой аналитики токенов', 'Аудит диалогов за все время, тепловая карта GitHub, расчет затрат по моделям и топ диалогов']
        },
        featuresTitle: '✨ Ключевые возможности',
        sectionAccountsTitle: '⚡ Мульти-аккаунты и мониторинг квот в реальном времени',
        sectionAccountsText: `- **Неограниченное число аккаунтов** — Одновременное отслеживание нескольких аккаунтов Google без конфликтов.
- **Мгновенное переключение в 1 клик** — Меняйте активный профиль IDE прямо из боковой панели без выхода из системы.
- **Цветовая индикация емкости** — Наглядные индикаторы (🟢 >50%, 🟡 20-50%, 🔴 <20%) и точные таймеры сброса лимитов.
- **Интеграция со строкой состояния** — Закрепляйте модели звездочкой (★) для постоянного контроля в строке состояния.
- **Упреждающее обновление токенов** — Фоновое обновление access_token предотвращает ошибки авторизации 401.
- **Сведения о тарифе** — Отображение уровня подписки (Ultra, Premium, Free) и остатка кредитов.`,
        sectionI18nTitle: '🌍 100% Мультиязычность и мгновенное переключение',
        sectionI18nText: `- **10 встроенных языков**: английский, турецкий, португальский, испанский, немецкий, французский, японский, китайский, хинди и русский.
- **Мгновенный отклик без перезагрузки** — При выборе языка в настройках **100% интерфейса мгновенно переводится** (боковая панель, аналитический дашборд Bento, инспектор контекста и диалоговые окна).`,
        sectionTokensTitle: '🔑 Бюджет токенов и аналитика контекста',
        sectionTokensText: `- **Диаграмма кастомизаций** — Точный объем токенов для MCP Tools, Rules, Workflows и Skills.
- **Индикатор активного контекста** — Сравнение использованных токенов с максимальным лимитом модели в реальном времени.
- **Инспектор правил рабочей области** — Быстрый переход к файлам в \`.agent/\` с указанием режимов активации.`,
        sectionContextTitle: '🔍 Детализация окна контекста (Отдельная вкладка редактора)',
        sectionContextText: `- Открывается в 1 клик по кнопке **"Показать все →"**.
- **Иерархическое дерево** — Полная разбивка системного промпта, инструментов, MCP и истории сообщений с процентами.
- **Встроенный просмотр шагов** — Просматривайте промпты, ответы модели и выводы команд прямо в интерфейсе.
- **Значки пламени (🔥)** — Мгновенно подсвечивают самые ресурсоемкие шаги в контексте.
- **Экспорт в Markdown** — Копируйте отчеты о контексте или сохраняйте их в файл.`,
        sectionAnalyticsTitle: '📈 Глубокая аналитика токенов и дашборд Bento',
        sectionAnalyticsText: `- Открывается по кнопке **"Открыть полный дашборд →"**.
- **Анализ за все время** — Сканирует и суммирует использование токенов по всем диалогам за историю использования Antigravity.
- **9 ключевых метрик KPI** — Входные, кэшированные, выходные токены, токены рассуждений, общее число вызовов и коэффициент кэша.
- **Тепловая карта в стиле GitHub** — Сетка активности за 365 дней с возможностью выбора года.
- **Динамический расчет цен LiteLLM** — Точная оценка затрат на API по актуальным тарифам.`,
        sectionGuardTitle: '🛡️ Защита диалогов (Conversation Guard)',
        sectionGuardText: `- **Автоматический поиск утерянных диалогов** — Сравнивает локальные файлы \`.pb\` с индексом через 15 секунд после запуска.
- **Восстановление в 1 клик** — Безопасно закрывает AG, заново пересобирает индекс с диска и перезапускает IDE без потери данных.`,
        getStartedTitle: '🚀 С чего начать',
        installText: `1. Найдите **NexusAG** в Marketplace расширений Antigravity и нажмите **Установить**.
2. Или установите напрямую из файла \`.vsix\`:
\`\`\`bash
antigravity-ide.cmd --install-extension nexus-ag-1.1.0.vsix --force
\`\`\``,
        licenseText: 'Распространяется под **лицензией MIT**. Создано с ☕ автором **[Alperen AKKAYA](https://github.com/AlperenAKKAYA99)**'
    }
];

const QUICK_STARTS = {
    de: {
        title: '⚡ Schnellstart in 60 Sekunden',
        step1: '**Installieren** — Suchen Sie nach `NexusAG` im Antigravity Marketplace oder installieren Sie die `.vsix`-Datei.',
        step2: '**Konto hinzufügen** — Klicken Sie in der Seitenleiste auf `+` für Google OAuth oder nutzen Sie `🔑` zum Einfügen von Tokens.',
        step3: '**Überwachen & Wechseln** — Ihre Live-Quotenanzeigen, Reset-Countdowns und Analysen sind sofort aktiv!'
    },
    'pt-BR': {
        title: '⚡ Comece em 60 Segundos',
        step1: '**Instalar** — Busque por `NexusAG` no marketplace do Antigravity ou instale o pacote `.vsix`.',
        step2: '**Adicionar Conta** — Clique em `+` na barra lateral para login Google OAuth no navegador ou use `🔑` para colar tokens.',
        step3: '**Monitorar & Alternar** — Seus medidores de cota em tempo real, contagens regressivas e métricas estão imediatamente ativos!'
    },
    es: {
        title: '⚡ Primeros Pasos en 60 Segundos',
        step1: '**Instalar** — Busque `NexusAG` en el marketplace de extensiones de Antigravity o instale el archivo `.vsix`.',
        step2: '**Añadir Cuenta** — Haga clic en `+` en la barra lateral para autenticación Google OAuth en 1 clic o pulse `🔑` para pegar tokens.',
        step3: '**Monitorizar & Cambiar** — ¡Sus indicadores de cuota en vivo, temporizadores y analítica se activan al instante!'
    },
    fr: {
        title: '⚡ Démarrage Rapide en 60 Secondes',
        step1: '**Installer** — Recherchez `NexusAG` dans le marketplace Antigravity ou installez le package `.vsix`.',
        step2: '**Ajouter un Compte** — Cliquez sur `+` dans la barre latérale pour vous connecter via Google OAuth ou utilisez `🔑` pour coller des jetons.',
        step3: '**Surveiller & Basculer** — Vos jauges de quota en direct, comptes à rebours et analyses de tokens sont immédiatement opérationnels !'
    },
    ja: {
        title: '⚡ 60秒クイックスタート',
        step1: '**インストール** — Antigravity 拡張機能マーケットプレイスで `NexusAG` を検索するか、`.vsix` パッケージをインストールします。',
        step2: '**アカウント追加** — サイドバーの `+` アイコンをクリックして Google OAuth ログインするか、`🔑` でトークンを貼り付けます。',
        step3: '**監視と切り替え** — リアルタイムのクォータメーター、リセットタイマー、トークン分析が即座に有効化されます！'
    },
    'zh-CN': {
        title: '⚡ 60秒快速上手',
        step1: '**安装** — 在 Antigravity 扩展市场中搜索 `NexusAG` 或安装 `.vsix` 安装包。',
        step2: '**添加账户** — 点击侧边栏的 `+` 图标通过浏览器完成 Google OAuth 登录，或点击 `🔑` 批量粘贴令牌。',
        step3: '**监控与切换** — 实时配额仪表盘、重置倒计时和全生命周期 Token 分析即刻就绪！'
    },
    hi: {
        title: '⚡ 60 सेकंड में शुरुआत करें',
        step1: '**इंस्टॉल करें** — Antigravity एक्सटेंशन मार्केटप्लेस में `NexusAG` खोजें या `.vsix` पैकेज इंस्टॉल करें।',
        step2: '**खाता जोड़ें** — ब्राउज़र में 1-क्लिक Google OAuth लॉगिन के लिए साइडबार में `+` पर क्लिक करें या `🔑` से टोकन चिपकाएं।',
        step3: '**निगरानी और स्विच** — आपके लाइव कोटा गेज, रीसेट टाइमर और आजीवन टोकन विश्लेषण तुरंत सक्रिय हैं!'
    },
    ru: {
        title: '⚡ Быстрый старт за 60 секунд',
        step1: '**Установка** — Найдите `NexusAG` в Marketplace расширений Antigravity или установите пакет `.vsix`.',
        step2: '**Добавление аккаунта** — Нажмите иконку `+` на боковой панели для входа через Google OAuth или используйте `🔑` для вставки токенов.',
        step3: '**Мониторинг и переключение** — Ваши шкалы квот, таймеры сброса и пожизненная аналитика токенов сразу активны!'
    }
};

const SECURITY_SECTIONS = {
    de: {
        title: '🔒 Sicherheit & Datenschutz',
        bullets: `- **100% Lokale Daten** — Keine Konversationsdaten, Prompts oder Dateien verlassen jemals Ihren Rechner.
- **Verschlüsselung auf Betriebssystemebene** — OAuth-Tokens werden über die native VS Code \`SecretStorage\`-Schnittstelle sicher gespeichert (macOS Keychain, Windows Credential Manager, Linux Secret Service).
- **Ausschließlich Lokale Kommunikation** — Die Kommunikation mit Language Servern erfolgt ausschließlich über \`127.0.0.1\` Loopback IPC-Sockets.
- **Null (0) Runtime-Abhängigkeiten** — Saubere Lieferkette mit **0 externen npm-Paketen**. Alles ist in reinem TypeScript geschrieben.
- **Nur Offizielle API-Endpunkte** — Beschränkt auf offizielle Google OAuth- und Cloud Code Quota-APIs.
- **Geprüfte Sicherheit** — Vollständiger Sicherheitsprüfbericht: [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 kritische Schwachstellen, 0 Backdoors).
- **Open Source** — Jederzeit transparent und einsehbar unter der **MIT-Lizenz**.`
    },
    'pt-BR': {
        title: '🔒 Segurança e Privacidade',
        bullets: `- **100% Dados Locais** — Nenhum dado de conversa, prompt ou código sai do seu computador.
- **Criptografia no Nível do SO** — Tokens OAuth armazenados no \`SecretStorage\` nativo do VS Code (macOS Keychain, Windows Credential Manager, Linux Secret Service).
- **Comunicação Estritamente Local** — Toda comunicação com Language Servers é feita via sockets IPC \`127.0.0.1\`.
- **Zero (0) Dependências de Execução** — Cadeia de suprimentos limpa com **0 pacotes npm de runtime**. Tudo feito em TypeScript puro.
- **Apenas APIs Oficiais** — Comunicação restrita às APIs oficiais do Google OAuth e Cloud Code Quota.
- **Auditoria de Segurança** — Relatório completo: [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 vulnerabilidades críticas, 0 backdoors).
- **Código Aberto** — Totalmente transparente sob a **Licença MIT**.`
    },
    es: {
        title: '🔒 Seguridad y Privacidad',
        bullets: `- **100% Datos Locales** — Ningún dato de conversación, prompt o código sale jamás de su máquina.
- **Cifrado a Nivel de SO** — Tokens OAuth protegidos mediante \`SecretStorage\` de VS Code (macOS Keychain, Windows Credential Manager, Linux Secret Service).
- **Comunicación Estrictamente Local** — Todas las llamadas al Language Server se limitan a sockets IPC en \`127.0.0.1\`.
- **Cero (0) Dependencias de Runtime** — Cadena de suministro limpia con **0 dependencias npm externas**. Escrito en TypeScript puro.
- **Solo APIs Oficiales** — Conexiones limitadas exclusivamente a endpoints oficiales de Google OAuth y Cloud Code Quota.
- **Código Auditado** — Informe completo: [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 vulnerabilidades críticas, 0 backdoors).
- **Código Abierto** — Transparente y auditable bajo la **Licencia MIT**.`
    },
    fr: {
        title: '🔒 Sécurité et Confidentialité',
        bullets: `- **100% Données Locales** — Aucune donnée de conversation, aucun prompt ni fichier ne quitte votre machine.
- **Chiffrement au Niveau de l\'OS** — Jetons OAuth sécurisés dans le \`SecretStorage\` natif de VS Code (Trousseau macOS, Windows Credential Manager, Linux Secret Service).
- **Communication Exclusivement Locale** — Les échanges avec les serveurs de langage restent cantonnés à l\'IPC \`127.0.0.1\`.
- **Zéro (0) Dépendance à l\'Exécution** — Chaîne d\'approvisionnement sécurisée avec **0 package npm tiers**. Tout est conçu en TypeScript pur.
- **APIs Officielles Uniquement** — Requêtes limitées aux services Google OAuth et Cloud Code Quota officiels.
- **Audit de Sécurité** — Rapport détaillé : [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 vulnérabilité critique, 0 porte dérobée).
- **Open Source** — Entièrement transparent sous **Licence MIT**.`
    },
    ja: {
        title: '🔒 セキュリティとプライバシー',
        bullets: `- **100% ローカル完結** — 会話履歴、プロンプト、ソースコードが外部サーバーへ送信されることは一切ありません。
- **OS レベルの認証情報暗号化** — OAuth トークンは VS Code ネイティブの \`SecretStorage\`（macOS キーチェーン、Windows 資格情報マネージャー、Linux Secret Service）に暗号化保存されます。
- **完全ローカル通信** — Language Server との通信は \`127.0.0.1\` ループバック IPC ソケットのみに限定されます。
- **ランタイム依存ゼロ（0）** — サプライチェーン攻撃リスクを完全に排除するため、外部 npm パッケージへの実行時依存は **0** です。
- **公式 API のみ使用** — 公式 Google OAuth および Cloud Code Quota API エンドポイント以外への外部通信は行いません。
- **セキュリティ監査済み** — 包括的セキュリティ監査レポート：[CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md)（重大な脆弱性 0件、バックドア 0件）。
- **完全オープンソース** — **MIT ライセンス**の下、全コードが公開・検証可能です。`
    },
    'zh-CN': {
        title: '🔒 安全性与隐私保护',
        bullets: `- **100% 本地数据存储** — 绝不收集或上传任何会话记录、提示词、源码或敏感遥测数据。
- **操作系统级凭据加密** — 所有 OAuth 令牌均通过 VS Code 原生 \`SecretStorage\` 加密托管（macOS Keychain、Windows 凭据管理器、Linux Secret Service）。
- **严格本地环回通信** — 与 Language Server 的交互全部运行于 \`127.0.0.1\` 本地 IPC 套接字。
- **零（0）运行时依赖** — 彻底杜绝供应链投毒攻击隐患，运行时 **0 外部第三方 npm 依赖**，全量 TypeScript 原生实现。
- **仅限官方 API 端点** — 外部网络请求仅严格发往 Google 官方 OAuth 与 Cloud Code 配额服务。
- **通过专业安全审计** — 完整审计报告见 [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md)（0 个高危漏洞，0 个恶意后门）。
- **全面开源透明** — 在宽容的 **MIT 许可证**下开源，所有代码均可审查。`
    },
    hi: {
        title: '🔒 सुरक्षा और गोपनीयता',
        bullets: `- **100% स्थानीय डेटा** — कोई भी बातचीत डेटा, प्रॉम्प्ट या कोड कभी भी आपकी मशीन से बाहर नहीं जाता है।
- **OS-स्तरीय क्रेडेंशियल एन्क्रिप्शन** — OAuth टोकन VS Code के \`SecretStorage\` (macOS Keychain, Windows Credential Manager, Linux Secret Service) में सुरक्षित रहते हैं।
- **पूरी तरह से स्थानीय संचार** — Language Server के साथ संचार केवल \`127.0.0.1\` लूपबैक IPC पर होता है।
- **शून्य (0) रनटाइम निर्भरताएं** — शून्य बाहरी npm पैकेज, सप्लाई चेन जोखिम से पूर्ण सुरक्षा।
- **केवल आधिकारिक API** — केवल आधिकारिक Google OAuth और Cloud Code Quota API से कनेक्शन।
- **सुरक्षा ऑडिटेड** — विस्तृत सुरक्षा रिपोर्ट: [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 महत्वपूर्ण कमजोरियां, 0 बैकडोर)।
- **ओपन सोर्स** — **MIT लाइसेंस** के तहत पूरी तरह से पारदर्शी।`
    },
    ru: {
        title: '🔒 Безопасность и приватность',
        bullets: `- **100% Локальные данные** — Никакие диалоги, промпты или файлы никогда не покидают ваше устройство.
- **Шифрование на уровне ОС** — Токены OAuth защищены через встроенный \`SecretStorage\` VS Code (macOS Keychain, Windows Credential Manager, Linux Secret Service).
- **Строго локальное взаимодействие** — Связь с Language Server происходит исключительно через сокеты IPC на \`127.0.0.1\`.
- **Ноль (0) зависимостей времени выполнения** — Чистая цепочка поставок с **0 сторонних пакетов npm в runtime**. Написано на чистом TypeScript.
- **Только официальные API** — Запросы ограничены исключительно официальными API Google OAuth и Cloud Code Quota.
- **Пройден аудит безопасности** — Полный отчет: [CYBER_SECURITY_AUDIT_REPORT.md](CYBER_SECURITY_AUDIT_REPORT.md) (0 критических уязвимостей, 0 бэкдоров).
- **Открытый исходный код** — Полная прозрачность под **лицензией MIT**.`
    }
};

function buildReadmeContent(loc, isSubdir = false) {
    const pfx = isSubdir ? '../../' : '';
    const i = loc.imgs;
    const navbar = getNavbar(loc.code, isSubdir);
    const qs = QUICK_STARTS[loc.code];
    const sec = SECURITY_SECTIONS[loc.code];

    return `${navbar}

<p align="center">
  <img src="${pfx}${loc.banner}" alt="${loc.title}" width="100%"/>
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
      <img src="${pfx}assets/img1.png" alt="${i.img1[0]}" width="100%"/><br/>
      <sub><b>${i.img1[0]}</b><br/>${i.img1[1]}</sub>
    </td>
    <td align="center" width="25%" valign="top">
      <img src="${pfx}assets/img3.png" alt="${i.img3[0]}" width="100%"/><br/>
      <sub><b>${i.img3[0]}</b><br/>${i.img3[1]}</sub>
    </td>
    <td align="center" width="25%" valign="top">
      <img src="${pfx}assets/img4.png" alt="${i.img4[0]}" width="100%"/><br/>
      <sub><b>${i.img4[0]}</b><br/>${i.img4[1]}</sub>
    </td>
    <td align="center" width="25%" valign="top">
      <img src="${pfx}assets/img5.png" alt="${i.img5[0]}" width="100%"/><br/>
      <sub><b>${i.img5[0]}</b><br/>${i.img5[1]}</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="25%" valign="top">
      <img src="${pfx}assets/img2.png" alt="${i.img2[0]}" width="100%"/><br/>
      <sub><b>${i.img2[0]}</b><br/>${i.img2[1]}</sub>
    </td>
    <td align="center" width="25%" valign="top">
      <img src="${pfx}assets/img7.png" alt="${i.img7[0]}" width="100%"/><br/>
      <sub><b>${i.img7[0]}</b><br/>${i.img7[1]}</sub>
    </td>
    <td align="center" colspan="2" valign="top">
      <img src="${pfx}assets/img6.png" alt="${i.img6[0]}" width="100%"/><br/>
      <sub><b>${i.img6[0]}</b><br/>${i.img6[1]}</sub>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="4" valign="top">
      <img src="${pfx}assets/img8.png" alt="${i.img8[0]}" width="100%"/><br/>
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

## 🏗️ Architecture & Internal Mechanics

\`\`\`mermaid
graph TB
    subgraph Antigravity_IDE["Antigravity IDE Environment"]
        WLS["Workspace LS<br/><code>--workspace_id</code><br/>• Model Quotas<br/>• Customization Tokens<br/>• Workspace Rules"]
        GLS["Global LS<br/><code>(Shared)</code><br/>• Cascade Trajectories<br/>• Context Window Data<br/>• Live Event Streams"]
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

## ⌨️ Command Palette

| Command | Identifier | Description |
|---|---|---|
| **NexusAG: Refresh Quota** | \`ag.refreshQuota\` | Forces an immediate quota and token budget refresh from Google APIs. |
| **NexusAG: Add Account** | \`ag.addAccount\` | Opens browser window for 1-click Google OAuth authentication. |
| **NexusAG: Add Account via Token** | \`ag.addAccountByToken\` | Opens modal for batch importing OAuth refresh tokens. |
| **NexusAG: Remove Account** | \`ag.removeAccount\` | Removes a selected account from local storage and tracking. |
| **NexusAG: Open Usage Statistics** | \`ag.openUsageStats\` | Launches the full-editor deep analytics bento dashboard. |
| **NexusAG: Fix Missing Conversations** | \`ag.fixConversations\` | Scans disk storage and repairs unindexed \`.pb\` conversations. |

---

## ⚙️ Configuration Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| \`ag-switchboard.language\` | \`string\` | \`auto\` | Interface language (\`auto\`, \`en\`, \`tr\`, \`pt-BR\`, \`es\`, \`de\`, \`fr\`, \`ja\`, \`zh-CN\`, \`hi\`, \`ru\`). |
| \`ag-switchboard.refreshInterval\` | \`string\` | \`1m\` | Background polling frequency for quota updates (\`instant\`, \`30s\`, \`1m\`, \`2m\`, \`5m\`). |
| \`ag-switchboard.modelPricing\` | \`object\` | Defaults | Custom per-model rates per 1M tokens (\`input\`, \`output\`, \`cache\`). |
| \`ag-switchboard.switchWithFixConversations\` | \`boolean\` | \`true\` | Automatically synchronizes and repairs the conversation index on account switch. |
| \`ag-switchboard.diagnosticMode\` | \`boolean\` | \`false\` | Enables verbose diagnostic file logging for troubleshooting. |

---

## 📊 Project Stats

<div align="center">

| Metric | Specification |
|---|---|
| **Total Source Modules** | 60 TypeScript + 2 CSS files |
| **Codebase Volume** | ~19,200+ Lines of Code |
| **Runtime Dependencies** | **0** (Zero external dependencies) |
| **Build System** | esbuild (Sub-second webview bundling) |
| **Supported Locales** | 10 Native Languages (251 keys each, 100% parity) |
| **Security Audit** | Passed — 0 critical / high findings |
| **Supported Platforms** | macOS (Apple Silicon / Intel), Windows 10/11, Linux (x64/arm64) |

</div>

---

## 🛠️ Built With

- **[TypeScript](https://www.typescriptlang.org/)** — End-to-end static typing and enterprise resilience
- **[esbuild](https://esbuild.github.io/)** — Lightning-fast compilation and optimized asset packaging
- **[Font Awesome Pro](https://fontawesome.com/)** — Crisp, modern vector iconography
- **[LiteLLM Pricing Catalog](https://github.com/BerriAI/litellm)** — Accurate, community-maintained AI token pricing
- **Native VS Code API** — Deep integration with \`SecretStorage\`, \`WebviewViewProvider\`, and \`StatusBarItem\`

---

## ❓ Frequently Asked Questions (FAQ)

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
To eliminate supply-chain vulnerability vectors, minimize package bundle size, and guarantee maximum execution speed. All protocol handling—including Protobuf binary encoding and decoding—is custom-built in native TypeScript.
</details>

---

## 🤝 Contributing & Development

Contributions, bug reports, and feature suggestions are warmly welcomed!

1. Fork the repository: \`git clone https://github.com/AlperenAKKAYA99/NexusAG.git\`
2. Install development dependencies: \`npm install\`
3. Compile the extension & webviews: \`npm run compile\`
4. Launch Extension in Debug Mode (\`F5\` in VS Code / Antigravity IDE)
---

## 📋 Changelog Highlights

For the full release history, see [CHANGELOG.md](CHANGELOG.md).

- **v1.1.0 (Current)** — 10-language instant reactive localization, multi-banner asset generation, enhanced UI showcase, and unified branding.
- **v1.0.5** — Usage Stats deduplication via \`responseId\`, dynamic model auto-humanization, and quota 100% bugfix.
- **v1.0.4** — **Conversation Guard**, standalone detached repair worker, and pure-TypeScript Protobuf trajectory codec for orphaned conversation recovery.
- **v1.0.3** — Multi-window state isolation, USS event gating, and background polling resilience.
- **v1.0.2** — Cross-source pin matching (★), status bar quota integration, heatmap cost tooltips, and diagnostic logging harness.
- **v1.0.1** — Dual-LS architecture, full context window drill-down tab, and live event stream monitoring.
- **v1.0.0** — Initial public release: 1-click Google account switching, full-editor bento analytics, GitHub-style activity heatmap, and SecretStorage vault.

---

## 📄 License & Author

${loc.licenseText}

`;
}

console.log('Generating localized README files with img1-img8 showcase...');
const i18nDir = path.join(ROOT_DIR, 'docs', 'i18n');
if (!fs.existsSync(i18nDir)) {
    fs.mkdirSync(i18nDir, { recursive: true });
}

for (const loc of LOCALES) {
    const isSubdir = loc.code !== 'en';
    const filePath = isSubdir
        ? path.join(i18nDir, loc.filename)
        : path.join(ROOT_DIR, 'README.md');
    const content = buildReadmeContent(loc, isSubdir);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Created ${isSubdir ? 'docs/i18n/' + loc.filename : 'README.md'} (${loc.code})`);
}
console.log('All localized READMEs updated successfully!');

