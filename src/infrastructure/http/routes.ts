import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SyncClocksUseCase } from '../../application/use-cases/sync-clocks-use-case.js';

const clockSchema = z.object({
  id: z.string(),
  name: z.string(),
  currentTimeMs: z.number(),
  isServer: z.boolean(),
  sentAtMs: z.number().optional()
}).superRefine((clock, ctx) => {
  if (!clock.isServer && typeof clock.sentAtMs === 'number' && clock.sentAtMs < clock.currentTimeMs) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Hora de envio não pode ser menor que a hora local.',
      path: ['sentAtMs']
    });
  }
});

const syncRequestSchema = z.object({
  server: clockSchema,
  clients: z.array(clockSchema)
});

export async function clockRoutes(fastify: FastifyInstance) {
  const syncUseCase = new SyncClocksUseCase();

  fastify.post('/sync', async (request, reply) => {
    const parseResult = syncRequestSchema.safeParse(request.body);
    
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parseResult.error.format() });
    }

    const { server, clients } = parseResult.data;
    const result = syncUseCase.execute(server, clients);

    return result;
  });
}
