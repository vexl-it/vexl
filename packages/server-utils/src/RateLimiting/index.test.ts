import {
  HttpApi,
  HttpApiBuilder,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpClient,
  HttpClientRequest,
} from '@effect/platform'
import {NodeHttpServer} from '@effect/platform-node'
import {RateLimitedError} from '@vexl-next/domain/src/general/commonErrors'
import {MaxExpectedDailyCall} from '@vexl-next/rest-api/src/MaxExpectedDailyCountAnnotation'
import {RateLimitingMiddleware} from '@vexl-next/rest-api/src/rateLimititing'
import {Effect, Either, Layer} from 'effect/index'
import {RateLimitingService} from '.'
import {rateLimitPerIpMultiplierConfig} from '../commonConfigs'
import {expectErrorResponse} from '../tests/expectErrorResponse'
import {mockedRateLimitingLayer} from '../tests/mockedRateLimitingLayer'
import {rateLimitingMiddlewareLayer} from './rateLimitngMiddlewareLayer'

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

const ApiLive = HttpApiBuilder.api(TestApiSpecification).pipe(
  Layer.provide(
    HttpApiBuilder.group(TestApiSpecification, 'testGroup', (h) =>
      h.handle('testEndpoint', () => Effect.void)
    )
  ),
  Layer.provide(rateLimitingMiddlewareLayer(TestApiSpecification))
)

const TestServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(ApiLive),
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
      Effect.either
    )
  )
  expect(Either.right(result))
}

beforeEach(async () => {
  await runPromiseInMocked(
    Effect.gen(function* (_) {
      const rateLimiting = yield* _(RateLimitingService)
      yield* _(rateLimiting.clearRateLimitState)
    })
  )
})

describe('Rate Limiting Middleware', () => {
  it('allows requests under the rate limit', async () => {
    await runPromiseInMocked(
      Effect.gen(function* (_) {
        yield* _(Effect.log(yield* _(rateLimitPerIpMultiplierConfig)))

        const client = yield* _(Client)
        const result = yield* _(client.testEndpoint(), Effect.either)
        expect(Either.isRight(result))
      })
    )
  })

  it('Blocks requests over the rate limit', async () => {
    await runPromiseInMocked(
      Effect.gen(function* (_) {
        yield* _(Effect.log(yield* _(rateLimitPerIpMultiplierConfig)))

        const client = yield* _(Client)
        const callTestEither = Effect.either(client.testEndpoint())
        const results = yield* _(
          Effect.all([
            callTestEither,
            callTestEither,
            callTestEither,
            callTestEither, // Should fail
          ])
        )

        expect(Either.isRight(results[0]))
        expect(Either.isRight(results[1]))
        expect(Either.isRight(results[2]))
        expectErrorResponse(RateLimitedError)(results[3])
      })
    )
  })
})
