import './sourcemapSupport'
// import {registerSetryMiddleware} from './utils/sentry'

import {serve} from '@hono/node-server'
import {zValidator} from '@hono/zod-validator'
import {Hono} from 'hono'
import googleGeocode from './apis/googleGeocode'
import {querySuggest} from './apis/googleSuggest.js'
import {GeocodeQueryData, SuggestQueryData} from './brands.js'
import startHealthServerIfPortIsSet from './healthServer'

const app = new Hono()

// registerSetryMiddleware(app)

app.use('*', async (c, next) => {
  const start = Date.now()
  console.info(`--> Received request: ${c.req.method} ${c.req.url}`)
  await next()
  console.info(
    `<-- Sending response: ${c.req.method} ${c.req.url} ${c.res.status} ${
      Date.now() - start
    } ms`
  )
})

app.get('/suggest', zValidator('query', SuggestQueryData), async (c, next) => {
  const query = c.req.valid('query')
  const results = await querySuggest(query)

  return c.json(results)
})

app.get('/geocode', zValidator('query', GeocodeQueryData), async (c) => {
  const query = c.req.valid('query')
  const result = await googleGeocode(query)

  if (result === null) return c.json({error: 'No results found'}, 404)

  return c.json(result)
})

app.get('/sentry-test', () => {
  throw new Error('Sentry test')
})

const PORT = Number(process.env.PORT ?? 3000)
serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (addressInfo) => {
    console.log('⚡️ Location service running', addressInfo)
    startHealthServerIfPortIsSet()
  }
)
