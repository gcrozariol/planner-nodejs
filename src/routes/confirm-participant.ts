import { env } from '@/env'
import { ClientError } from '@/errors/client-error'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function confirmParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/participants/:participantId/confirm',
    {
      schema: {
        params: z.object({
          participantId: z.string().uuid(),
        }),
      },
    },
    async (req, res) => {
      const { participantId } = req.params

      const participant = await prisma.participant.findUnique({
        where: {
          id: participantId,
        },
      })

      if (!participant) {
        throw new ClientError('Participant not found')
      }

      if (participant.isConfirmed) {
        return res.redirect(`${env.WEB_BASE_URL}/participants/${participantId}`)
      }

      await prisma.participant.update({
        where: {
          id: participantId,
        },
        data: {
          isConfirmed: true,
        },
      })

      return res.redirect(`${env.WEB_BASE_URL}/participants/${participantId}`)
    },
  )
}
