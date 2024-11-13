import {Headers, HttpServerRequest, HttpServerResponse} from '@effect/platform'
import {Array, Effect, Option, String, pipe, type Config} from 'effect'
import {type ApiEndpoint, type Handler} from 'effect-http'
import {makeRaw} from 'effect-http/Handler'

export const makeRedirectHandler = <A extends ApiEndpoint.ApiEndpoint.Any>(
  endpoint: A,
  redirectUrlBase: Config.Config<string>,
  redirectCode: 301 | 302 | 307 | 308 = 301
): Handler.Handler<A, never, HttpServerRequest.HttpServerRequest> =>
  makeRaw(
    endpoint,
    Effect.gen(function* (_) {
      const {url} = yield* _(HttpServerRequest.HttpServerRequest)
      const toRedirectToBase = yield* _(redirectUrlBase)

      const queryParams = pipe(
        url,
        String.match(/\?(.+)/),
        Option.flatMap(Array.head),
        Option.getOrElse(() => '')
      )

      const toRedirectTo = `${toRedirectToBase}${queryParams}`
      yield* _(Effect.logInfo(`Redirecting ${url} to ${toRedirectTo}`))

      return yield* _(
        HttpServerResponse.empty({
          status: redirectCode,
          headers: Headers.fromInput({'Location': toRedirectTo}),
        })
      )
    }).pipe(
      Effect.catchTag('ConfigError', () =>
        Effect.zipRight(
          Effect.logError('Error redirecting'),
          HttpServerResponse.text('Internal Server Error', {status: 500})
        )
      )
    )
  )
