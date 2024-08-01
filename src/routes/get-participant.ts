import { ClientError } from '@/errors/client-error'
import { prisma } from '@/lib/prisma'

import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function getParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/participants/:participantId',
    {
      schema: {
        params: z.object({
          participantId: z.string().uuid(),
        }),
      },
    },
    async (req) => {
      const { participantId } = req.params

      const participant = await prisma.participant.findUnique({
        where: {
          id: participantId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isConfirmed: true,
        },
      })

      if (!participant) {
        throw new ClientError('Participant not found')
      }

      return {
        participant,
      }
    },
  )
}
