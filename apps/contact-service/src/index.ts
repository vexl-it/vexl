import './sourcemapSupport'
import Koa from 'koa'
import Router from 'koa-router'
import json from 'koa-json'

import startHealthServer from './healthServer.js'

const app = new Koa()
const router = new Router()

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
