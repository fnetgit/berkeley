import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { clockRoutes } from './routes.js';
import { SyncClocksUseCase } from '../../application/use-cases/sync-clocks-use-case.js';
import { BerkeleyClockSyncService } from '../../domain/services/berkeley-clock-sync-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildServer() {
  const server = fastify({ logger: true });
  const syncUseCase = new SyncClocksUseCase(new BerkeleyClockSyncService());

  server.register(fastifyStatic, {
    root: path.join(__dirname, '../../../public'),
    prefix: '/',
  });

  server.register(clockRoutes, {
    prefix: '/api',
    syncUseCase
  });

  return server;
}

const start = async () => {
  const server = buildServer();

  try {
    const port = 3000;
    await server.listen({ port, host: 'localhost' });
    console.log(`Servidor rodando em http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

if (process.argv[1] === __filename) {
  start();
}
