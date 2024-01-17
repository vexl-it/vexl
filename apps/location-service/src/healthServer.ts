import {Hono} from 'hono'
import {serve} from '@hono/node-server'
import env from './environment'

export default function startHealthServerIfPortIsSet(): void {
  if (!env.HEALTH_SERVER_PORT) {
    console.log('HEALTH_SERVER_PORT not set. Not starting health server.')
    return
  }

  const app = new Hono()

  app.get('/health', (c) => {
    return c.text('ok', 200)
  })
  serve(
    {
      fetch: app.fetch,
      port: env.HEALTH_SERVER_PORT,
    },
    (addressInfo) => {
      console.log('⚡️ Location service health server running', addressInfo)
    }
  )
}
