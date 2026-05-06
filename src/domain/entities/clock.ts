export interface NodeClock {
  id: string;
  name: string;
  currentTimeMs: number;
  isServer: boolean;
  sentAtMs?: number;
}

export interface SyncResult {
  id: string;
  name: string;
  originalTimeMs: number;
  sendTimeMs?: number;
  adjustmentMs: number;
  synchronizedTimeMs: number;
  synchronizedSendTimeMs?: number;
  isServer: boolean;
}
