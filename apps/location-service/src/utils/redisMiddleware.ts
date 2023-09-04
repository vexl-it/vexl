import {type Context, type Next} from 'koa'
import Redis from 'ioredis'

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days
const REDIS_URL = String(process.env.REDIS_URL ?? '127.0.0.1:6379')
const REDIS_PREFIX = String(process.env.REDIS_PREFIX ?? ':')

console.info(`Connecting to Redis at ${REDIS_URL}`)

const redis = new Redis(REDIS_URL)

export default async function redisMiddleware(
  ctx: Context,
  next: Next
): Promise<void> {
  const cacheKey = `${REDIS_PREFIX}cache1:${ctx.url}`

  const cachedResponse = await redis.get(cacheKey).catch((error) => {
    console.error(
      'Error while saving to redis',
      {cacheKey, body: JSON.stringify(ctx.body)},
      error
    )
    return null
  })
  if (cachedResponse) {
    ctx.body = JSON.parse(cachedResponse)
    console.info('[SUGGEST]: Returning cached response')
    return
  }

  await next()
  if (ctx.body && ctx.response.status === 200) {
    void redis
      .set(cacheKey, JSON.stringify(ctx.body), 'EX', CACHE_TTL_SECONDS)
      .catch((error) => {
        console.error(
          'Error while saving to redis',
          {cacheKey, body: JSON.stringify(ctx.body)},
          error
        )
      })
  }
}
