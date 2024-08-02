import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import nodemailer from 'nodemailer'
import { z } from 'zod'

import { env } from '@/env'
import { ClientError } from '@/errors/client-error'
import { dayjs } from '@/lib/dayjs'
import { getMailClient } from '@/lib/mail'
import { prisma } from '@/lib/prisma'

export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/confirm',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (req, res) => {
      const { tripId } = req.params

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participants: {
            where: {
              isOwner: false,
            },
          },
        },
      })

      if (!trip) {
        throw new ClientError('Trip not found')
      }

      if (trip.isConfirmed) {
        return res.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
      }

      await prisma.trip.update({
        where: {
          id: tripId,
        },
        data: {
          isConfirmed: true,
        },
      })

      const formattedStartDate = dayjs(trip.startsAt).format('LL')
      const formattedEndDate = dayjs(trip.endsAt).format('LL')

      const mail = await getMailClient()

      await Promise.all(
        trip.participants.map(async (participant) => {
          const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`

          const message = await mail.sendMail({
            from: {
              name: 'Planner Team',
              address: 'hi@planner.com',
            },
            to: {
              name: participant.name ?? '',
              address: participant.email,
            },
            subject: `Confirm your trip to ${trip.destination}`,
            html: `
              <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                <p>You are invited to a trip to <strong>${trip.destination}</strong> from <strong>${formattedStartDate}</strong> to <strong>${formattedEndDate}</strong>.</p>
                <p></p>
                <p>To confirm your trip, click the link below:</p>
                <p></p>
                <p>
                  <a href="${confirmationLink}">Confirm trip</a>
                </p>
                <p></p>
                <p>If you don't know what this email is about, just ignore this email.</p>
              </div>
          `.trim(),
          })

          console.log(nodemailer.getTestMessageUrl(message))
        }),
      )

      return res.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
    },
  )
}
