export * from './oauth';
export * from './api';
export * from './system';

// UI Constants re-exported from shared
export {
    CTX_WARNING_PCT, CTX_CRITICAL_PCT,
    QUOTA_HEALTHY_PCT, QUOTA_WARN_PCT,
    USAGE_HIGH_PCT, USAGE_MEDIUM_PCT,
    CASCADE_LIST_LIMIT, CASCADE_TITLE_MAX_LEN,
    CASCADE_ENRICHED_LIMIT, CASCADE_ENRICHED_TITLE_MAX_LEN,
    HOURS_IN_DAY,
} from '../../shared/uiConstants';

// Platform-aware paths re-exported from shared
export { isMac, isLinux, isWindows, STATE_DB_PATH, LS_CERT_PATHS, LS_PROCESS_GREP } from '../../shared/agPaths';
