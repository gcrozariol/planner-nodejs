import { ClientError } from '@/errors/client-error'
import { prisma } from '@/lib/prisma'

import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function getParticipants(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/participants',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (req) => {
      const { tripId } = req.params

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              isConfirmed: true,
            },
          },
        },
      })

      if (!trip) {
        throw new ClientError('Trip not found')
      }

      return {
        participants: trip.participants,
      }
    },
  )
}
