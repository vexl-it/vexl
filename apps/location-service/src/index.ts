import Koa from 'koa'
import Router from 'koa-router'
import json from 'koa-json'

import {LocationResponse, SuggestQueryData} from './brands.js'
import startHealthServer from './healthServer.js'
import {querySuggest} from './geoapify.js'

const app = new Koa()
const router = new Router()

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

  const results = await querySuggest(query.data)
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

// Middlewares
app.use(json())
// logging
app.use(async (ctx, next) => {
  console.info(`--> Received request: ${ctx.request.method} ${ctx.request.url}`)
  await next()
  console.info(
    `<-- Sending response: ${ctx.request.method} ${ctx.request.url} ${ctx.response.status}`,
    ctx.response.body.result.map((one: any) => one.userData)
  )
})

// Routes
app.use(router.routes()).use(router.allowedMethods())

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
  startHealthServer()
})
