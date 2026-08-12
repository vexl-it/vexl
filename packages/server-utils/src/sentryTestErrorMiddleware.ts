import {
  HttpLayerRouter,
  HttpMiddleware,
  HttpServerRequest,
  HttpServerResponse,
} from '@effect/platform'
import {Effect, type Layer} from 'effect'

// A fresh Error per request — Sentry skips exception objects it has already
// captured, so a shared instance would report only the first request.
const reportTestErrorAndRespond = Effect.suspend(() =>
  Effect.zipRight(
    Effect.logError(
      'Sentry test error triggered',
      new Error('Sentry test error')
    ),
    Effect.succeed(HttpServerResponse.text('error reported', {status: 500}))
  )
)

/**
 * TEMPORARY — remove (revert the commit that added it) once Sentry delivery is
 * verified in all environments. Exposes GET /sentry-test-error on the main API
 * port: logs a test error through the real logger-to-Sentry path and responds
 * with 500. Note the endpoint is public and unauthenticated while it exists.
 */
export const sentryTestErrorMiddleware = HttpMiddleware.make((app) =>
  Effect.gen(function* (_) {
    const request = yield* _(HttpServerRequest.HttpServerRequest)
    if (request.method === 'GET' && request.url === '/sentry-test-error')
      return yield* _(reportTestErrorAndRespond)
    return yield* _(app)
  })
)

/** Same endpoint for HttpLayerRouter-based servers (notification-service). */
export const sentryTestErrorRouteLayer: Layer.Layer<
  never,
  never,
  HttpLayerRouter.HttpRouter
> = HttpLayerRouter.add('GET', '/sentry-test-error', reportTestErrorAndRespond)
