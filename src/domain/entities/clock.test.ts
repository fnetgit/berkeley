import test from 'node:test';
import assert from 'node:assert/strict';
import { ClockValidationError, NodeClock } from './clock.js';

test('NodeClock creates a valid client clock', () => {
  const clock = NodeClock.create({
    id: 'client-1',
    name: 'Cliente 1',
    currentTimeMs: 10_000,
    sentAtMs: 12_000,
    isServer: false
  });

  assert.equal(clock.id, 'client-1');
  assert.equal(clock.sentAtMs, 12_000);
});

test('NodeClock rejects client send time earlier than local time', () => {
  assert.throws(
    () => NodeClock.create({
      id: 'client-1',
      name: 'Cliente 1',
      currentTimeMs: 15_000,
      sentAtMs: 12_000,
      isServer: false
    }),
    ClockValidationError
  );
});

test('NodeClock rejects sentAtMs on server clocks', () => {
  assert.throws(
    () => NodeClock.create({
      id: 'server',
      name: 'Servidor',
      currentTimeMs: 15_000,
      sentAtMs: 16_000,
      isServer: true
    }),
    ClockValidationError
  );
});
