import { env } from '@/env'
import { ClientError } from '@/errors/client-error'
import { getMailClient } from '@/lib/mail'
import { prisma } from '@/lib/prisma'

import dayjs from 'dayjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import nodemailer from 'nodemailer'
import z from 'zod'

export async function createInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/invites',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params
      const { email } = request.body

      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
      })

      if (!trip) {
        throw new ClientError('Trip not found')
      }

      const participant = await prisma.participant.create({
        data: {
          email,
          tripId,
        },
      })

      const formattedStartDate = dayjs(trip.startsAt).format('LL')
      const formattedEndDate = dayjs(trip.endsAt).format('LL')

      const confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm`

      const mail = await getMailClient()

      const message = await mail.sendMail({
        from: {
          name: 'Planner Team',
          address: 'hi@planner.com',
        },
        to: participant.email,
        subject: `Confirm your trip to ${trip.destination}`,
        html: `
          <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
            <p>You requested a trip to <strong>${trip.destination}</strong> from <strong>${formattedStartDate}</strong> to <strong>${formattedEndDate}</strong>.</p>
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

      return {
        participantId: participant.id,
      }
    },
  )
}
