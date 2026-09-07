import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import {RateLimitedError} from '@vexl-next/domain/src/general/commonErrors'
import {MaxExpectedDailyCall} from '@vexl-next/rest-api/src/MaxExpectedDailyCountAnnotation'
import {RateLimitingMiddleware} from '@vexl-next/rest-api/src/rateLimititing'
import {Effect, Layer, pipe, Result} from 'effect'
import {HttpClient, HttpClientRequest, HttpRouter} from 'effect/unstable/http'
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
} from 'effect/unstable/httpapi'
import {RateLimitingService} from '.'
import {rateLimitPerIpMultiplierConfig} from '../commonConfigs'
import {expectErrorResponse} from '../tests/expectErrorResponse'
import {mockedRateLimitingLayer} from '../tests/mockedRateLimitingLayer'
import {rateLimitingMiddlewareLayer} from './rateLimitngMiddlewareLayer'
import {normalizePath} from './utils'

const TestEndpoint = HttpApiEndpoint.post(
  'testEndpoint',
  '/api/v1/test'
).annotate(MaxExpectedDailyCall, 3)

const TestGroup = HttpApiGroup.make('testGroup', {topLevel: true}).add(
  TestEndpoint
)
const TestApiSpecification = HttpApi.make('Test API')
  .add(TestGroup)
  .middleware(RateLimitingMiddleware)

const ApiLive = HttpApiBuilder.layer(TestApiSpecification).pipe(
  Layer.provide(
    HttpApiBuilder.group(TestApiSpecification, 'testGroup', (h) =>
      h.handle('testEndpoint', () => Effect.void)
    )
  ),
  Layer.provide(rateLimitingMiddlewareLayer(TestApiSpecification))
)

const TestServerLive = HttpRouter.serve(ApiLive).pipe(
  Layer.provideMerge(NodeHttpServer.layerTest)
)
const Client = HttpApiClient.make(TestApiSpecification, {
  transformClient: HttpClient.mapRequest(
    HttpClientRequest.setHeader('cf-connecting-ip', '0.0.0.0')
  ),
})

const runPromiseInMocked = async (
  e: Effect.Effect<void, unknown, HttpClient.HttpClient | RateLimitingService>
): Promise<void> => {
  const result = await Effect.runPromise(
    e.pipe(
      Effect.provide(
        TestServerLive.pipe(Layer.provideMerge(mockedRateLimitingLayer))
      ),
      Effect.result
    )
  )
  expect(Result.isSuccess(result)).toBe(true)
}

beforeEach(async () => {
  await runPromiseInMocked(
    Effect.gen(function* () {
      const rateLimiting = yield* RateLimitingService
      yield* rateLimiting.clearRateLimitState
    })
  )
})

describe('Rate Limiting Middleware', () => {
  it('uses the same route key for query string variants', () => {
    expect(normalizePath('/api/v1/test?nonce=1')).toEqual('/api/v1/test')
    expect(normalizePath('/api/v1/test?nonce=2#fragment')).toEqual(
      '/api/v1/test'
    )
  })

  it('allows requests under the rate limit', async () => {
    await runPromiseInMocked(
      Effect.gen(function* () {
        yield* Effect.log(yield* rateLimitPerIpMultiplierConfig)

        const client = yield* Client
        const result = yield* pipe(client.testEndpoint(), Effect.result)
        expect(Result.isSuccess(result)).toBe(true)
      })
    )
  })

  it('Blocks requests over the rate limit', async () => {
    await runPromiseInMocked(
      Effect.gen(function* () {
        yield* Effect.log(yield* rateLimitPerIpMultiplierConfig)

        const client = yield* Client
        const callTestEither = Effect.result(client.testEndpoint())
        const results = yield* Effect.all([
          callTestEither,
          callTestEither,
          callTestEither,
          callTestEither, // Should fail
        ])

        expect(Result.isSuccess(results[0])).toBe(true)
        expect(Result.isSuccess(results[1])).toBe(true)
        expect(Result.isSuccess(results[2])).toBe(true)
        expectErrorResponse(RateLimitedError)(results[3])
      })
    )
  })
})
