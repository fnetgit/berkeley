declare module '../../public/script.js' {
  export function parseTimeToMs(timeStr: string, fieldLabel: string): number;
  export function msToTimeString(ms: number): string;
  export function formatAdjustment(ms: number): string;
  export function formatRankingTime(ms?: number | null): string;
  export function getUserFacingErrorMessage(error: unknown): string;
  export function renderSyncResults(view: {
    resultsSection: { classList: { remove(className: string): void } };
    globalClockValue: { textContent: string };
    heroClockValue?: { textContent: string } | null;
    statClientsCount: { textContent: string };
    statFirstSend: { textContent: string };
    statLastAdjustedSend: { textContent: string };
    tableAdjustments: { innerHTML: string };
    tableRankingBefore: { innerHTML: string };
    tableRankingAfter: { innerHTML: string };
  }, data: {
    results: Array<Record<string, unknown>>;
    rankingBefore?: Array<Record<string, unknown>>;
    rankingAfter?: Array<Record<string, unknown>>;
  }): void;
}
