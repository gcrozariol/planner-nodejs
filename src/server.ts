import cors from '@fastify/cors'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

import { errorHandler } from './error-handler'

import { confirmParticipant } from './routes/confirm-participant'
import { confirmTrip } from './routes/confirm-trip'
import { createActivity } from './routes/create-activity'
import { createLink } from './routes/create-link'
import { createTrip } from './routes/create-trip'
import { getActivities } from './routes/get-activities'
import { getLinks } from './routes/get-links'

const app = fastify()

app.register(cors, {
  origin: '*',
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

app.register(confirmParticipant)
app.register(confirmTrip)
app.register(createActivity)
app.register(createLink)
app.register(createTrip)
app.register(getActivities)
app.register(getLinks)

app.listen({ port: 3333 }).then(() => {
  console.log('🚀 Server running on port 3333.')
})
