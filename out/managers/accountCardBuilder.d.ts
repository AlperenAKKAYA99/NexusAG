/**
 * AccountCardBuilder — Pure function module for constructing pre-processed account cards.
 * No state, no side effects, easily testable. Renderer does zero logic.
 */
import { AccountQuota, AccountCard, LocalQuotaData } from '../types';
export declare function buildAccountCards(localData: LocalQuotaData | null, trackedQuotas: AccountQuota[], activeEmailRaw: string, switchActive: boolean, selectedModels: string[], customLabels?: Record<string, string>): AccountCard[];
