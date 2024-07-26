import fastify from "fastify";

const app = fastify()

app.get('/', (res, req) => {
  return 'Hello World'
})

app.listen({ port: 3333 }).then(() => {
  console.log('🚀 Server running on port 3333.')
})