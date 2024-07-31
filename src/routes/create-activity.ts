import { ClientError } from '@/errors/client-error'
import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function createActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/activities',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          occursAt: z.coerce.date(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params
      const { title, occursAt } = request.body

      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
      })

      if (!trip) {
        throw new ClientError('Trip not found')
      }

      if (dayjs(occursAt).isBefore(trip.startsAt)) {
        throw new ClientError('Invalid activity date.')
      }

      if (dayjs(occursAt).isAfter(trip.endsAt)) {
        throw new ClientError('Invalid activity date.')
      }

      const activity = await prisma.activity.create({
        data: {
          title,
          occursAt,
          tripId,
        },
      })

      return { activityId: activity.id }
    },
  )
}
