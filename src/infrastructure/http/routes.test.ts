import test from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from './fastify-server.js';

test('POST /api/sync returns synchronized rankings from the API', async (t) => {
  const server = buildServer();

  t.after(async () => {
    await server.close();
  });

  const response = await server.inject({
    method: 'POST',
    url: '/api/sync',
    payload: {
      server: {
        id: 'server',
        name: 'Servidor',
        currentTimeMs: 10_000,
        isServer: true
      },
      clients: [
        {
          id: 'client-1',
          name: 'Cliente 1',
          currentTimeMs: 11_000,
          sentAtMs: 12_000,
          isServer: false
        },
        {
          id: 'client-2',
          name: 'Cliente 2',
          currentTimeMs: 13_000,
          sentAtMs: 14_000,
          isServer: false
        }
      ]
    }
  });

  assert.equal(response.statusCode, 200);

  const body = response.json();
  assert.deepEqual(body.rankingBefore.map((item: { id: string }) => item.id), ['client-1', 'client-2', 'server']);
  assert.deepEqual(body.rankingAfter.map((item: { id: string }) => item.id), ['client-1', 'client-2', 'server']);
});

test('POST /api/sync rejects domain-invalid clocks', async (t) => {
  const server = buildServer();

  t.after(async () => {
    await server.close();
  });

  const response = await server.inject({
    method: 'POST',
    url: '/api/sync',
    payload: {
      server: {
        id: 'server',
        name: 'Servidor',
        currentTimeMs: 10_000,
        isServer: true
      },
      clients: [
        {
          id: 'client-1',
          name: 'Cliente 1',
          currentTimeMs: 15_000,
          sentAtMs: 12_000,
          isServer: false
        }
      ]
    }
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.body, /sentAtMs/);
});
