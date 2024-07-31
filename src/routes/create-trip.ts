import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import nodemailer from 'nodemailer'
import { z } from 'zod'

import { dayjs } from '@/lib/dayjs'
import { getMailClient } from '@/lib/mail'
import { prisma } from '@/lib/prisma'

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips',
    {
      schema: {
        body: z.object({
          destination: z.string(),
          startsAt: z.coerce.date(),
          endsAt: z.coerce.date(),
          ownerName: z.string(),
          ownerEmail: z.string().email(),
          emailsToInvite: z.array(z.string().email()),
        }),
      },
    },
    async (req) => {
      const {
        destination,
        startsAt,
        endsAt,
        ownerName,
        ownerEmail,
        emailsToInvite,
      } = req.body

      if (dayjs(startsAt).isBefore(new Date())) {
        throw new Error('Invalid trip start date.')
      }

      if (dayjs(endsAt).isBefore(startsAt)) {
        throw new Error('Invalid trip end date.')
      }

      const trip = await prisma.trip.create({
        data: {
          destination,
          startsAt,
          endsAt,
          participants: {
            createMany: {
              data: [
                {
                  name: ownerName,
                  email: ownerEmail,
                  isOwner: true,
                  isConfirmed: true,
                },
                ...emailsToInvite.map((email) => {
                  return {
                    email,
                  }
                }),
              ],
            },
          },
        },
      })

      const formattedStartDate = dayjs(startsAt).format('LL')
      const formattedEndDate = dayjs(endsAt).format('LL')

      const confirmationLink = `localhost:3333/trips/${trip.id}/confirm`

      const mail = await getMailClient()

      const message = await mail.sendMail({
        from: {
          name: 'Planner Team',
          address: 'hi@planner.com',
        },
        to: {
          name: ownerName,
          address: ownerEmail,
        },
        subject: `Confirm your trip to ${destination}`,
        html: `
          <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
            <p>You requested a trip to <strong>${destination}</strong> from <strong>${formattedStartDate}</strong> to <strong>${formattedEndDate}</strong>.</p>
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
        tripId: trip.id,
      }
    },
  )
}
