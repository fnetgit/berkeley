import test from 'node:test';
import assert from 'node:assert/strict';
import { NodeClock } from '../entities/clock.js';
import { BerkeleyClockSyncService } from './berkeley-clock-sync-service.js';

test('BerkeleyClockSyncService synchronizes server and clients using average drift', () => {
  const service = new BerkeleyClockSyncService();
  const server = NodeClock.create({
    id: 'server',
    name: 'Servidor',
    currentTimeMs: 10_000,
    isServer: true
  });
  const clients = [
    NodeClock.create({
      id: 'client-1',
      name: 'Cliente 1',
      currentTimeMs: 13_000,
      sentAtMs: 14_000,
      isServer: false
    }),
    NodeClock.create({
      id: 'client-2',
      name: 'Cliente 2',
      currentTimeMs: 11_000,
      sentAtMs: 12_000,
      isServer: false
    })
  ];

  const results = service.synchronize(server, clients);

  assert.equal(results.length, 3);
  assert.equal(results[0]?.synchronizedTimeMs, 9_333.333333333334);
  assert.equal(results[1]?.adjustmentMs, -3_666.666666666666);
  assert.equal(results[2]?.synchronizedSendTimeMs, 10_333.333333333334);
});

test('BerkeleyClockSyncService throws when all clocks are filtered as outliers', () => {
  const service = new BerkeleyClockSyncService(-1);
  const server = NodeClock.create({
    id: 'server',
    name: 'Servidor',
    currentTimeMs: 10_000,
    isServer: true
  });
  const clients = [
    NodeClock.create({
      id: 'client-1',
      name: 'Cliente 1',
      currentTimeMs: 13_000,
      sentAtMs: 14_000,
      isServer: false
    })
  ];

  assert.throws(() => service.synchronize(server, clients), /No clocks available/);
});
