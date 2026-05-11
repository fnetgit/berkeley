import test from 'node:test';
import assert from 'node:assert/strict';
import { SyncClocksUseCase } from './sync-clocks-use-case.js';
import { NodeClock, SyncResult } from '../../domain/entities/clock.js';
import { ClockSyncService } from '../../domain/services/clock-sync-service.js';

class FakeClockSyncService implements ClockSyncService {
  synchronize(_server: NodeClock, _clients: NodeClock[]): SyncResult[] {
    return [
      {
        id: 'client-2',
        name: 'Cliente 2',
        originalTimeMs: 11_000,
        sendTimeMs: 15_000,
        adjustmentMs: 500,
        synchronizedTimeMs: 12_000,
        synchronizedSendTimeMs: 15_500,
        isServer: false
      },
      {
        id: 'client-1',
        name: 'Cliente 1',
        originalTimeMs: 10_000,
        sendTimeMs: 12_000,
        adjustmentMs: 2_000,
        synchronizedTimeMs: 12_000,
        synchronizedSendTimeMs: 14_000,
        isServer: false
      },
      {
        id: 'server',
        name: 'Servidor',
        originalTimeMs: 11_500,
        adjustmentMs: 500,
        synchronizedTimeMs: 12_000,
        isServer: true
      }
    ];
  }
}

test('SyncClocksUseCase sorts ranking before and after using synchronized payload', () => {
  const useCase = new SyncClocksUseCase(new FakeClockSyncService());
  const server = NodeClock.create({
    id: 'server',
    name: 'Servidor',
    currentTimeMs: 11_500,
    isServer: true
  });
  const clients = [
    NodeClock.create({
      id: 'client-1',
      name: 'Cliente 1',
      currentTimeMs: 10_000,
      sentAtMs: 12_000,
      isServer: false
    }),
    NodeClock.create({
      id: 'client-2',
      name: 'Cliente 2',
      currentTimeMs: 11_000,
      sentAtMs: 15_000,
      isServer: false
    })
  ];

  const response = useCase.execute(server, clients);

  assert.deepEqual(response.rankingBefore.map((item) => item.id), ['client-1', 'client-2', 'server']);
  assert.deepEqual(response.rankingAfter.map((item) => item.id), ['client-1', 'client-2', 'server']);
});
