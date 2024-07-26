import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

import { prisma } from './lib/prisma'
import { createTrip } from './routes/create-trip'

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(createTrip)

app.get('/trips', async () => {
  const result = await prisma.trips.findMany()

  return {
    trips: result,
  }
})

app.listen({ port: 3333 }).then(() => {
  console.log('🚀 Server running on port 3333.')
})
