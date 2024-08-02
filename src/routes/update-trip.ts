import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { ClientError } from '@/errors/client-error'

import { dayjs } from '@/lib/dayjs'
import { prisma } from '@/lib/prisma'

export async function updateTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/trips/:tripId',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          destination: z.string(),
          startsAt: z.coerce.date(),
          endsAt: z.coerce.date(),
        }),
      },
    },
    async (req) => {
      const { tripId } = req.params
      const { destination, startsAt, endsAt } = req.body

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      })

      if (!trip) {
        throw new ClientError('Trip not found')
      }

      if (dayjs(startsAt).isBefore(new Date())) {
        throw new ClientError('Invalid trip start date.')
      }

      if (dayjs(endsAt).isBefore(startsAt)) {
        throw new ClientError('Invalid trip end date.')
      }

      await prisma.trip.update({
        where: {
          id: tripId,
        },
        data: {
          destination,
          startsAt,
          endsAt,
        },
      })

      return {
        tripId: trip.id,
      }
    },
  )
}
