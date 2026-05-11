import { NodeClock, SyncResult } from '../entities/clock.js';
import { BerkeleyClockSyncService } from './berkeley-clock-sync-service.js';

export class BerkeleyAlgorithm {
  /**
   * Executa a sincronização de Berkeley.
  * @param server O nó servidor (time daemon).
  * @param clients Lista de nós clientes.
  * @param maxDriftMs Limite opcional para ignorar relógios com drift muito alto (outliers).
   */
  static synchronize(server: NodeClock, clients: NodeClock[], maxDriftMs: number = Infinity): SyncResult[] {
    return new BerkeleyClockSyncService(maxDriftMs).synchronize(server, clients);
  }
}
