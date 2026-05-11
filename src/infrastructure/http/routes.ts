import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SyncClocksUseCase } from '../../application/use-cases/sync-clocks-use-case.js';
import { ClockValidationError, NodeClock } from '../../domain/entities/clock.js';

const clockSchema = z.object({
  id: z.string(),
  name: z.string(),
  currentTimeMs: z.number(),
  isServer: z.boolean(),
  sentAtMs: z.number().optional()
});

const syncRequestSchema = z.object({
  server: clockSchema,
  clients: z.array(clockSchema)
});

export interface ClockRoutesDependencies {
  syncUseCase: SyncClocksUseCase;
}

export async function clockRoutes(
  fastify: FastifyInstance,
  { syncUseCase }: ClockRoutesDependencies
) {

  fastify.post('/sync', async (request, reply) => {
    const parseResult = syncRequestSchema.safeParse(request.body);
    
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parseResult.error.format() });
    }

    try {
      const server = NodeClock.create(parseResult.data.server);
      const clients = parseResult.data.clients.map((client) => NodeClock.create(client));
      const result = syncUseCase.execute(server, clients);

      return result;
    } catch (error) {
      if (error instanceof ClockValidationError) {
        return reply.status(400).send({ error: 'Dados inválidos', details: error.message });
      }

      throw error;
    }
  });
}
