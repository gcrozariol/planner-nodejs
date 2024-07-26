import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import nodemailer from 'nodemailer'
import { z } from 'zod'

import { getMailClient } from '../lib/mail'
import { prisma } from '../lib/prisma'

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
        }),
      },
    },
    async (req) => {
      const { destination, startsAt, endsAt, ownerName, ownerEmail } = req.body

      if (dayjs(startsAt).isBefore(new Date())) {
        throw new Error('Invalid trip start date.')
      }

      if (dayjs(endsAt).isBefore(startsAt)) {
        throw new Error('Invalid trip end date.')
      }

      const trip = await prisma.trips.create({
        data: {
          destination,
          startsAt,
          endsAt,
        },
      })

      const mail = await getMailClient()

      const message = await mail.sendMail({
        from: {
          name: 'Planner Crew',
          address: 'hi@planner.com',
        },
        to: {
          name: ownerName,
          address: ownerEmail,
        },
        subject: 'Send test email',
        html: `<p>Test email</p>`,
      })

      console.log(nodemailer.getTestMessageUrl(message))

      return {
        tripId: trip.id,
      }
    },
  )
}
