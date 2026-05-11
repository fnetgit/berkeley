import { NodeClock, SyncResult } from '../entities/clock.js';

export interface ClockSyncService {
  synchronize(server: NodeClock, clients: NodeClock[]): SyncResult[];
}
