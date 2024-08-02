import { ClientError } from '@/errors/client-error'
import { dayjs } from '@/lib/dayjs'
import { prisma } from '@/lib/prisma'

import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function getActivities(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/activities',
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
          activities: {
            orderBy: {
              occursAt: 'asc',
            },
          },
        },
      })

      if (!trip) {
        throw new ClientError('Trip not found')
      }

      const differenceInDaysBetweenTripStartAndEnd = dayjs(trip.endsAt).diff(
        trip.startsAt,
        'days',
      )

      const activities = Array.from({
        length: differenceInDaysBetweenTripStartAndEnd + 1,
      }).map((_, i) => {
        const date = dayjs(trip.startsAt).add(i, 'days')

        return {
          date: date.toDate(),
          activities: trip.activities.filter((activity) => {
            return dayjs(activity.occursAt).isSame(date, 'day')
          }),
        }
      })

      return {
        activities,
      }
    },
  )
}
