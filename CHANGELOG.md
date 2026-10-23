# Changelog

All notable changes to **NexusAG** are documented here.

## [1.1.1] — 2026-10-23

### Added
- **Bulk Token Export (Copy Tokens)** — Export and copy multiple account OAuth refresh tokens to clipboard with one click in Plain (1 per line), Labeled (`# email`), or JSON format, with full round-trip compatibility in "Add via Token" modal.
- **Enhanced Token Extraction & Security** — Smart comment stripping, Google token signature regex extraction, optional clipboard auto-clearing timer (`clearClipboardSeconds`), and confirmation modal dialog for bulk operations.
- **Dedicated Command Palette Integration** — `ag.copyTokens` command with multi-select QuickPick and format selection.
- **10 Native Locales for Export UI** — 22 new localization keys with 100% parity across EN, TR, DE, ES, FR, HI, JA, PT-BR, RU, and ZH-CN.

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
- **Quota 100% display bug** — Restored `projectId` parameter in `retrieveUserQuota` API call. Without it, Google returned generic empty buckets showing 100% for all models.

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

