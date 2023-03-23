import Koa from 'koa'
import Router from 'koa-router'
import axios from 'axios'

import logger from 'koa-logger'
import json from 'koa-json'
import {LocationData, LocationResponse, SuggestQueryData} from './brands'

const app = new Koa()
const router = new Router()

const API_KEY = process.env.API_KEY ?? ''

async function queryMaps({
  phrase,
  count,
  lang,
}: SuggestQueryData): Promise<SuggestQueryData[]> {
  const {data} = await axios.get(
    'https://api.geoapify.com/v1/geocode/autocomplete',
    {
      params: {
        limit: count,
        text: phrase,
        language: lang,
        type: 'city',
        apiKey: API_KEY,
      },
    }
  )

  return data.features
    .map(({properties}: any) => {
      const parsed = LocationData.safeParse({
        suggestFirstRow: properties.address_line1 ?? '',
        suggestSecondRow: properties.address_line2 ?? '',
        municipality: properties.city ?? properties.municipality ?? '',
        region: properties.region ?? '',
        country: properties.country ?? '',
        latitude: properties.lat,
        longitude: properties.lon,
      })
      if (!parsed.success) {
        console.error(
          'Error parsing received data into LocationData',
          parsed.error,
          properties
        )
        return null
      }
      return parsed.data
    })
    .filter(Boolean)
}

router.get('/suggest', async (ctx, next) => {
  const query = SuggestQueryData.safeParse(ctx.query)
  if (!query.success) {
    ctx.response.status = 400
    ctx.response.body = query.error
    await next()
    return
  }

  if (query.data.phrase.trim().length === 0) {
    ctx.response.body = LocationResponse.safeParse({result: []})
    await next()
    return
  }

  const results = await queryMaps(query.data)
  const toReturn = LocationResponse.safeParse({
    result: results.map((one) => ({userData: one})),
  })

  if (toReturn.success) {
    ctx.response.body = toReturn.data
  } else {
    console.error('Error while preparing results', toReturn.error)
    ctx.response.status = 500
    ctx.response.body = {message: toReturn.error.message}
  }

  await next()
})

router.get('/health', async (ctx, next) => {
  ctx.response.status = 200
  await next()
})

// Middlewares
app.use(json())
app.use(logger())

// Routes
app.use(router.routes()).use(router.allowedMethods())

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})
