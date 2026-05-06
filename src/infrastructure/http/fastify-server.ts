import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { clockRoutes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = fastify({ logger: true });

// Registrar o plugin para servir arquivos estáticos do frontend
server.register(fastifyStatic, {
  root: path.join(__dirname, '../../../public'),
  prefix: '/', 
});

// Registrar rotas
server.register(clockRoutes, { prefix: '/api' });

const start = async () => {
  try {
    const port = 3000;
    await server.listen({ port, host: 'localhost' });
    console.log(`Servidor rodando em http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
