import {Effect, Option} from 'effect'
import {reportError} from '../http'
import {redisDelete, redisGet, redisSetWithTtl} from '../redis'

const TARGET_TTL_SECONDS = 24 * 60 * 60

const targetKey = (slug: string): string => `backoffice:short-link:${slug}`

// A broken cache must never break a redirect: errors are reported and
// treated as a miss.
const reportAndIgnore = (error: unknown): Effect.Effect<void> =>
  Effect.sync(() => {
    reportError(error)
  })

export const getCachedShortLinkTarget = (
  slug: string
): Effect.Effect<Option.Option<string>> =>
  redisGet(targetKey(slug)).pipe(
    Effect.map(Option.fromNullable),
    Effect.catchAll((error) =>
      reportAndIgnore(error).pipe(Effect.as(Option.none()))
    )
  )

export const cacheShortLinkTarget = (
  slug: string,
  targetUrl: string
): Effect.Effect<void> =>
  redisSetWithTtl(targetKey(slug), targetUrl, TARGET_TTL_SECONDS).pipe(
    Effect.catchAll(reportAndIgnore)
  )

export const invalidateShortLinkTarget = (slug: string): Effect.Effect<void> =>
  redisDelete(targetKey(slug)).pipe(Effect.catchAll(reportAndIgnore))
