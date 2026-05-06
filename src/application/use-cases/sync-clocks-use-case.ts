import { NodeClock, SyncResult } from '../../domain/entities/clock.js';
import { BerkeleyAlgorithm } from '../../domain/services/berkeley-algorithm.js';

export interface SyncResponse {
  results: SyncResult[];
  rankingBefore: SyncResult[];
  rankingAfter: SyncResult[];
}

export class SyncClocksUseCase {
  execute(server: NodeClock, clients: NodeClock[]): SyncResponse {
    const results = BerkeleyAlgorithm.synchronize(server, clients);

    // Ranking antes: horas de envio em ordem crescente
    const rankingBefore = [...results].sort((a, b) => compareOptionalTimes(a.sendTimeMs, b.sendTimeMs));

    // Ranking depois: hora de envio somada ao ajuste aplicado
    const rankingAfter = [...results].sort((a, b) => compareOptionalTimes(a.synchronizedSendTimeMs, b.synchronizedSendTimeMs));

    return {
      results,
      rankingBefore,
      rankingAfter
    };
  }
}

function compareOptionalTimes(a?: number, b?: number): number {
  const left = typeof a === 'number' ? a : Number.POSITIVE_INFINITY;
  const right = typeof b === 'number' ? b : Number.POSITIVE_INFINITY;
  return left - right;
}
