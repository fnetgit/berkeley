import { NodeClock, SyncResult } from '../entities/clock.js';

export class BerkeleyAlgorithm {
  /**
   * Executa a sincronização de Berkeley.
   * @param server O nó servidor (time daemon).
   * @param clients Lista de nós clientes.
   * @param maxDriftMs Limite opcional para ignorar relógios com drift muito alto (outliers).
   */
  static synchronize(server: NodeClock, clients: NodeClock[], maxDriftMs: number = Infinity): SyncResult[] {
    const serverTime = server.currentTimeMs;
    const allNodes = [server, ...clients];

    // 1. Calcular diferenças observadas em relação ao relógio lógico do servidor.
    // Para clientes, quando a hora de envio é informada, ela vira a referência
    // do clock do servidor embutido na mensagem recebida pelo cliente.
    const diffsWithNodes = allNodes.map(node => {
      const referenceTime = node.isServer ? serverTime : (node.sentAtMs ?? serverTime);
      return {
        node,
        referenceTime,
        diff: node.currentTimeMs - referenceTime
      };
    });

    // 2. Filtrar outliers
    const validDiffs = diffsWithNodes.filter(item => Math.abs(item.diff) <= maxDriftMs);
    
    // 3. Calcular a média das diferenças válidas
    const sumDiffs = validDiffs.reduce((acc, item) => acc + item.diff, 0);
    const averageDiff = sumDiffs / validDiffs.length;

    const synchronizedTime = serverTime + averageDiff;

    // 4. Calcular ajustes individuais
    return allNodes.map(node => {
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
