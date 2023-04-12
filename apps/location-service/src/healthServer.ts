import Koa from 'koa'

const HEALTH_SERVER_PORT = process.env.HEALTH_SERVER_PORT ?? 3001
export default function startHealthServerIfPortIsSet(): void {
  const app = new Koa()
  app.use(async (ctx) => {
    ctx.response.status = 200
  })
  app.listen(HEALTH_SERVER_PORT, () => {
    console.log(`Health server started on port ${HEALTH_SERVER_PORT}`)
  })
}
