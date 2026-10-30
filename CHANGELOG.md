# Changelog

All notable changes to **NexusAG** are documented here.

## [1.3.4] — 2026-10-30

### Added
- **Custom Account Labeling & Aliasing (`ag.accountLabels`)** — Users can assign custom aliases to connected accounts (e.g., `Work Account #1`, `Personal`, `Client Project Alpha`). The custom label is displayed prominently as the main card title, with the underlying email address preserved as a subtle, readable subtitle.
- **Dedicated Account Rename Button & Command** — Added a `[✏️]` button in the account action drawer and registered the `ag.setAccountLabel` command in the Command Palette for quick keyboard-driven renames.
- **3-Dot Model Status Trio & Multi-Model Health Matrix (`.acct-dot-stack`)** — Replaced the misleading single status dot with a vertical 3-dot micro matrix representing Antigravity's model families:
  - **Top Dot (Claude Family):** Opus 4.6 / Sonnet 4.6 / Sonnet 5.5 reasoning quota.
  - **Middle Dot (Argon / GPT-OSS 120B):** Advanced open-source or preview tier (renders as neutral grey `⚪` when Argon is disabled/unavailable, preventing false alerts).
  - **Bottom Dot (Gemini Family):** Gemini 3.8 Flash / Pro daily fast coding quota.
  - **Interactive Hover Tooltip:** Displays instant quota breakdown across all three tiers at a glance (e.g., `Claude: 50% | GPT-OSS: 50% | Gemini: 97%`).
- **Collapsed Multi-Model Header Summary** — When no model is pinned with the star (`★`) button, the collapsed account card header now displays a clean, multi-family health breakdown (`Claude 50% · Gemini 97% · GPT 50%`) instead of a single bottleneck.
- **10-Language Parity (257 translation keys)** — Added all new translation keys across English, Turkish, German, Spanish, French, Hindi, Japanese, Portuguese, Russian, and Simplified Chinese with 100% test coverage.

### Fixed
- **Eliminated False "0% Bottleneck" Red Alert on Active Accounts (`Gemini 4 Argon`)** — Fixed an issue where Antigravity's unreleased or disabled models (`disabled: true`, `tagTitle: "Unavailable"`, empty `quotaInfo: {}`) were treated as having 0% quota, causing active accounts to turn red (`🔴 Gemini 4 Argon · 0%`). NexusAG now filters out disabled/unavailable models from both card listings and bottleneck calculations.
- **Eliminated Internal Google Cloud API Noise on Tracked Accounts** — Filtered out internal Pa test/debug counters (`Chat_20706`, `Chat_23310`), multimodal backend sub-buckets (`*-image`), and obsolete model generations (`gemini-2.5-*`) from remote tracked accounts.
- **Fixed Frozen `dashboard.allTime` Button Translation** — Resolved a timing issue where the range selector button rendered before i18n dictionaries arrived via IPC, leaving raw `dashboard.allTime` text in the DOM. Range buttons are now reactively re-translated on load and language switches.
- **Resolved `AraOca` Month Header Collision in Heatmap** — Fixed GitHub-style contribution calendar where the previous year's padding week (December) overlapped with January on 12px columns, creating `AraOca`. The calendar now omits prior-year padding labels and enforces a minimum 2-week spacing between month names.
- **Localized Contribution Peak Date** — Replaced hardcoded English month names (`Oct 11`) with locale-aware date formatting (`11 Eki` in Turkish, `11 Oct` in English).

## [1.3.3] — 2026-10-30

### Fixed
- **Suppressed Recurring "Security Notice & Data Use" Modal** — Permanently eliminated the repeated "Security Notice & Data Use" / terms of service & interactions data consent prompt (`Screen 7` onboarding modal) that appeared every time the user switched accounts.
- **Dual-Layer Terms & Telemetry Consent Pre-Synchronization (`suppressTermsNotice`)** — Simultaneously synchronizes live in-memory `ExtHostStorage` (`google.google-antigravity`) and persistent SQLite state (`ItemTable` in `state.vscdb`) for both `agy.onboarding.lastLoginUsername` and `jetski.onboarding.lastLoginUsername`, plus `antigravity.accountTelemetryEnabled` and `antigravityOnboarding: true`. Screen 7 is now bypassed automatically on every account switch and on IDE launch.

## [1.3.2] — 2026-10-30

### Added
- **Direct 1-Click Account Switching for Antigravity ≥ 2.27 (`agy --hub`)** — Replaced the repeated browser login requirement with instant direct credential injection into OS Keyring (`gemini:antigravity`), fallback stores (`~/.gemini/gemini-oauth.json`, `~/.gemini/oauth_creds.json`), USS, and SQLite state, followed by automatic Hub recycling via `AntigravityServerManager`. Switching accounts now takes ~1.5 seconds directly within the IDE without opening external browser windows.
- **Configurable Confirmation Prompt (`ag-switchboard.confirmSwitch`)** — Made switch confirmation dialog optional (defaults to `false` in Hub mode for immediate 1-click switching).

### Changed
- **Guided Browser Sign-In as Resilient Fallback** — Preserved native browser login as a graceful fallback only when stored tokens are missing or revoked, ensuring users are never locked out.

## [1.3.0] — 2026-10-30

### Added
- **AuthBackend Strategy Architecture (`src/services/auth/`)** — Clean separation between Antigravity ≥ 2.27 (`AgyHubBackend`) and pre-2.27 (`LegacyUssBackend`) authentication and account switching flows.
- **Guided Native Sign-In for `agy --hub`** — When switching accounts on Antigravity 2.27+, NexusAG performs a fast 4-second programmatic probe first; if the isolated Hub retains its session, NexusAG restores USS truth, copies the target email to the clipboard, opens `antigravity.openSettings`, and automatically detects completion of the native sign-in via live Hub polling.
- **SQLite Conversation Storage & Multi-Brain Discovery** — Detects Antigravity 2.27's `~/.gemini/antigravity` directory structure, `.done` migration markers, and SQLite (`conversation_summaries.db` / `*.db`) conversation storage while preserving historical `~/.gemini/antigravity-ide/brain` scanning for Usage Statistics and conversation titles.

### Fixed
- **Active Account Badge Mismatch (K12)** — `EmailResolver` and `buildAccountCards` now treat the current window's `agy --hub` (`GetUserStatus`) as the primary source of truth, eliminating false-positive "ACTIVE" badges when USS or `state.vscdb` holds a different email.
- **Eliminated Pointless IDE Restarts on Antigravity 2.27+** — Disabled legacy `.pb` Conversation Guard index rebuilds and IDE restart prompts when `agy --hub` SQLite storage is active.
- **Direct HTTP for `agy --hub` Endpoints** — `callLSEndpoint()` now connects via plain HTTP (`127.0.0.1`) first for `agy --hub` endpoints instead of failing a TLS handshake on every call.
- **Cascade Server Discovery with Null Workspace Server** — Fixed `ServerDiscoveryService.discoverCascadeServer()` returning `null` on Antigravity 2.27+ when `QuotaManager` resolves a cascade server without a pre-supplied workspace server.

## [1.2.2] — 2026-10-30

### Fixed
- **Restart fallback for Antigravity 2.27.0** — When the running Language Server accepts `RegisterGdmUser` but retains the previous identity, the account switch now offers a full Antigravity restart instead of a window reload.
- **Auth persistence without conversation files** — The restart worker now persists the selected account before conversation discovery, so missing `.pb` files do not skip account credentials.
- **Restart safety** — If account credentials cannot be persisted after shutdown, the worker cancels the account-switch relaunch rather than reopening with stale credentials.

## [1.2.1] — 2026-10-30

### Fixed
- **Workspace-scoped Hub selection** — `agy --hub` endpoints now match all active workspace folders, including quoted paths with spaces. When workspace-scoped candidates cannot be matched unambiguously, NexusAG no longer sends account-switch requests to another Antigravity window's Hub.
- **Verified-before-restart flow** — Account switching must be confirmed by the Language Server before the optional conversation repair/relaunch begins.
- **Auth refresh command detection** — Candidate IDE auth-refresh commands are executed only when registered by the current Antigravity version.
- **Confirmed account identity** — The no-reload switch no longer writes the target account into USS/SQLite before the Language Server confirms it, and an unconfirmed switch no longer marks the target card active.

## [1.2.0] — 2026-10-28

### Fixed
- **Antigravity 2.27.0 Compatibility** — Full adaptation to the new `agy --hub` language server architecture. NexusAG now discovers and connects to the AGY Hub binary (`agy.exe --hub`) instead of the deprecated `language_server_win` process.
- **LS Process Discovery Rewrite** — `serverDiscovery.ts` completely rewritten: detects `agy.exe --hub` processes, reads `--hub-port` for direct port resolution (no `netstat` scan needed), and matches workspaces via `--add-dir` filesystem paths.
- **Dual-Architecture Support** — Backward compatible with both Antigravity ≥ 2.27.0 (`agy --hub`) and pre-2.27.0 (`language_server_win`). Legacy discovery is used as automatic fallback.
- **Account Switch Auth Refresh** — `handleAuthRefresh` command replaced with multi-candidate command executor that tries multiple command names for cross-version compatibility.
- **HTTPS/HTTP Fallback** — `callLSEndpoint()` now falls back to HTTP when HTTPS fails, supporting the agy hub's unified port architecture.
- **LS Endpoint Discovery** — `findLSEndpoints()` updated to extract `--hub-port` from agy processes and fall back to `--https_server_port` for legacy LS.

### Added
- **Gemini 3.8 Flash Pricing** — Added pricing tiers for Gemini 3.8 Flash (High/Medium/Low) models introduced with Antigravity 2.27.0.
- **Gemini 3.8 Flash Model Names** — `MODEL_DISPLAY_NAMES` expanded with `gemini-3.8-flash-high`, `gemini-3.8-flash-medium`, `gemini-3.8-flash-low`.

### Changed
- **Process Grep Pattern** — `LS_PROCESS_GREP` now targets `agy` (new hub binary) with `LS_PROCESS_GREP_LEGACY` for backward compatibility with `language_server_*`.
- **Workspace Matching** — Workspace isolation now compares `--add-dir` filesystem paths (new) or `--workspace_id` UUIDs (legacy) to match the correct LS instance.
- **Cascade Server Discovery** — Simplified for the new architecture where each IDE window spawns a single `agy --hub` instance handling both workspace and cascade operations.
- **Pricing Matcher** — Version-aware matching now distinguishes Gemini 3.8, 3.x, and 2.5 model families.

## [1.1.0] — 2026-10-21

### Added
- **10 Native Locales** — Instant reactive localization supporting English, Türkçe, Português, Español, Deutsch, Français, 日本語, 简体中文, हिन्दी, and Русский.
- **Zero-Reload Switching** — Instant UI translation across sidebar, bento dashboard, and context inspector.
- **Multi-Banner Asset Pipeline** — Automated headless Chromium banner generation for 10 languages.
- **Enhanced Showcase & Documentation** — Professional UI showcase gallery, Mermaid architecture diagrams, and comprehensive security documentation.

## [1.0.5] — 2026-05-04

### Fixed
- **Usage Stats duplicate counting** — Deduplicates model responses by stable `responseId` when Antigravity exposes the same usage telemetry through both generator metadata and trajectory steps.
- **Usage Stats total token semantics** — Total Tokens now consistently includes input, cache read, cache write, output, and reasoning tokens across sidebar KPIs, full dashboard cards, model totals, and conversation totals.
- **Usage Stats cache rebuild** — Bumped the disk cache schema to v2 so old fingerprint-based caches are discarded and rebuilt with response-aware entries.
- **Usage Stats refresh lifecycle** — The full Usage Statistics editor panel now receives refresh pushes from quota refreshes instead of staying stale until reopened.
- **Usage Stats monthly filters** — Monthly summaries use bounded date filtering and pure aggregation so switching ranges does not mutate cached totals.
- **Footer build number placement** — Build tags render in the footer build badge instead of drifting into the updated timestamp.
- **Quota 100% display bug** — Restored `projectId` parameter in `retrieveUserQuota` API call. Without it, Google returned generic empty buckets showing 100% for all models. (via [#3](https://github.com/AlperenAKKAYA99/NexusAG/pull/3) by [@ameenalasady](https://github.com/ameenalasady))

### Changed
- **Usage Stats entry preference** — When the same response appears in multiple local sources, generator metadata is preferred over step snapshots because it carries the canonical token accounting.
- **Model whitelist removed** — All models returned by the API are now displayed, not just hardcoded ones. Unknown model IDs are auto-humanized (`gemini-3.1-pro-high` → `Gemini 3.1 Pro (High)`). The old `MODEL_WHITELIST` is now `MODEL_DISPLAY_NAMES` — a cosmetic override map, not a filter.

## [1.0.4] — 2026-05-01

### Added
- **Conversation Guard** — Detects conversations that exist on disk (`.pb` files) but are missing from the sidebar index. Shows an expandable warning banner with conversation titles and dates, with a one-click fix that rebuilds the index.
- **Detached fix worker** — Index rebuild runs as a standalone Node.js process after AG quits, then auto-relaunches the IDE with the same workspace. Handles WAL checkpoint, backup, and cross-platform app discovery (macOS, Linux, Windows).
- **Protobuf codec** — Pure TypeScript varint encoder/decoder, field stripper, and entry builder. Shared between extension host and detached worker with zero external dependencies.
- **Title resolver** — Multi-source title extraction (LS trajectory → brain markdown → transcript log → date-based fallback). Filters generic auto-titles like "New Conversation".
- **Cross-platform path SSOT** — `agPaths.ts` centralizes all platform-specific filesystem paths (state DB, conversations dir, cert paths, LS binary name) for macOS/Linux/Windows.
- **`ag.fixConversations` command** — Command palette entry + footer wrench button for manual fix trigger.

### Changed
- **Constants refactor** — Platform paths and process detection patterns moved from `constants.ts` to `shared/agPaths.ts` (vscode-free, worker-safe).

## [1.0.3] — 2026-04-28

### Fixed
- **Cross-window state contamination** — Multiple IDE windows no longer overwrite each other's active conversation. Each window uses `workspaceState` for per-workspace cascade persistence.
- **Focus-gain listener bug** — Removed listener that could pick up stale cascade IDs from other windows' USS entries on alt-tab.
- **Disposable leak** — `topic.onDidChange()` subscriptions are now properly registered for disposal.
- **Boot poll snapshot inconsistency** — Boot polling now uses `readCascadeDiff()` to keep the internal snapshot in sync with runtime.
- **trajectorySummaries fallback persistence** — Fallback cascade assignment now writes to `workspaceState`.
- **Log severity** — Error conditions upgraded from `log.info()` to `log.warn()`.

### Changed
- **Quota API endpoint** — Migrated to `retrieveUserQuota` gRPC-transcoded endpoint with strict model whitelist.
- **USS event gating** — `onDidChange` events are only processed when `vscode.window.state.focused` is true.

## [1.0.2] — 2026-04-24

### Added
- **Cross-source pin matching** — Pinned models persist correctly across local/tracked accounts via host-side label map.
- **Host-managed quota polling** — Quota refresh via `setInterval`, ensuring data stays fresh regardless of sidebar visibility.
- **Cost per token in daily grid** — Heatmap cells show estimated cost alongside token counts.
- **Diagnostic logging harness** — DIAG-level logging with file sink for field debugging.
- **Build tag tracking** — Footer shows incremental build identifiers.

### Changed
- **Account card builder refactor** — Pure-function card builder module with zero side effects.
- **Anti-magic constants** — All UI thresholds, timeouts, and API URLs extracted to named constants.

## [1.0.1] — 2026-04-14

### Added
- **Dual-LS Architecture** — Automatic discovery of Workspace LS + Global LS.
- **1-Click Account Switch** — Seamless Google profile switching without window reload.
- **Context Window Detail** — Full editor panel with raw token breakdown and hierarchical step tree.
- **Active Context sidebar** — Donut chart with category-colored stacked bar.
- **Export Markdown** — One-click conversation export.
- **LiveStream Watcher** — Real-time context window updates during model execution.
- **RPC Direct Client** — JSON-over-HTTP calls to local LS.
- **Reasoning tokens** — Tracks reasoning tokens alongside input/cache/output.
- **Monthly cost breakdown**, **Weekly pattern**, **Top conversations**.
- **Server Discovery rewrite** — PID-based process scanning with `lsof` port resolution.
- **Account Switch Hardening** — LS Readiness Gate, Gate-Once-Pass-Down endpoint reuse.
- **Proactive Token Renewal** — Automatic access_token refresh before expiry.

## [1.0.0] — 2026-03-20

### Added
- **Initial Release** — Official launch of **NexusAG** for Google Antigravity IDE.
- **Multi-Account Switchboard** — Instant 1-click account switching with OS-level `SecretStorage` encryption.
- **Deep Token Analytics Dashboard** — Full-editor bento grid, 9 KPI metrics, and 365-day GitHub-style activity heatmap with local disk caching.
- **Usage Stats Sidebar** — Compact session token totals, hourly activity charts, and monthly expenditure breakdowns.
- **Modular Webview Engine** — High-performance bundling with esbuild, sticky layout, and branded radar initialization screen.
- **LiteLLM Dynamic Pricing** — Integrated API pricing catalog for real-time cost estimations.
