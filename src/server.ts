import fastify from "fastify";
import { prisma } from "./lib/prisma";

const app = fastify()

app.post('/trips', async (req, res) => {
  const { destination } = req.body as any

  return await prisma.trips.create({
    data: {
      destination
    }
  })
})

app.get('/trips', async (req, res) => {
  const result = await prisma.trips.findMany()

  return {
    trips: result
  }
})

app.listen({ port: 3333 }).then(() => {
  console.log('🚀 Server running on port 3333.')
})