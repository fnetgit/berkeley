import { NodeClock, SyncResult } from '../entities/clock.js';
import { ClockSyncService } from './clock-sync-service.js';

export class BerkeleyClockSyncService implements ClockSyncService {
  constructor(private readonly maxDriftMs: number = Number.POSITIVE_INFINITY) {}

  synchronize(server: NodeClock, clients: NodeClock[]): SyncResult[] {
    const serverTime = server.currentTimeMs;
    const allNodes = [server, ...clients];

    const diffsWithNodes = allNodes.map((node) => {
      const referenceTime = node.isServer ? serverTime : (node.sentAtMs ?? serverTime);
      return {
        node,
        diff: node.currentTimeMs - referenceTime
      };
    });

    const validDiffs = diffsWithNodes.filter((item) => Math.abs(item.diff) <= this.maxDriftMs);

    if (validDiffs.length === 0) {
      throw new Error('No clocks available to calculate synchronization.');
    }

    const sumDiffs = validDiffs.reduce((acc, item) => acc + item.diff, 0);
    const averageDiff = sumDiffs / validDiffs.length;
    const synchronizedTime = serverTime + averageDiff;

    return allNodes.map((node) => {
      const adjustment = synchronizedTime - node.currentTimeMs;
      const sendTime = node.isServer ? undefined : node.sentAtMs;

      return {
        id: node.id,
        name: node.name,
        originalTimeMs: node.currentTimeMs,
        sendTimeMs: sendTime,
        adjustmentMs: adjustment,
        synchronizedTimeMs: synchronizedTime,
        synchronizedSendTimeMs: typeof sendTime === 'number' ? sendTime + adjustment : undefined,
        isServer: node.isServer
      };
    });
  }
}
