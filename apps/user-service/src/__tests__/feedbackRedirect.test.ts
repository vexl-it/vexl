import {HttpClient, HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {RegionCodeE} from '@vexl-next/domain/src/utility/RegionCode.brand'
import {
  FeedbackFormId,
  FeedbackType,
} from '@vexl-next/rest-api/src/services/feedback/specification'
import {createDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect, Either} from 'effect'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {
  disposeRuntime,
  runPromiseInMockedEnvironment,
  startRuntime,
} from './utils/runPromiseInMockedEnvironment'

beforeAll(startRuntime)
afterAll(disposeRuntime)

describe('Feedback redirect', () => {
  it('should fail without auth headers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const body = {
          formId: Schema.decodeSync(FeedbackFormId)('testFeedbackFormId'),
          type: Schema.decodeSync(FeedbackType)('create'),
          countryCode: Schema.decodeSync(RegionCodeE)('CZ'),
          objections: 'testObjections',
          stars: 5,
          textComment: 'testTextComment',
        } as const

        const resp = yield* _(client.submitFeedback({body}), Effect.either)

        expect(Either.isLeft(resp)).toBe(true)
        if (resp._tag === 'Left') {
          expect(resp.left._tag).toEqual('ClientError')
        }
      })
    )
  })

  it('Returns 308 redirect', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const body = {
          formId: Schema.decodeSync(FeedbackFormId)('testFeedbackFormId'),
          type: Schema.decodeSync(FeedbackType)('create'),
          countryCode: Schema.decodeSync(RegionCodeE)('CZ'),
          objections: 'testObjections',
          stars: 5,
          textComment: 'testTextComment',
        } as const

        const response = yield* _(
          client.submitFeedback(
            {body},
            HttpClientRequest.setHeaders(yield* _(createDummyAuthHeaders))
          ),
          Effect.either
        ).pipe(HttpClient.withFetchOptions({redirect: 'manual'}))

        expect(Either.isLeft(response)).toBe(true)
        if (Either.isLeft(response)) {
          const res = response.left
          expect((res as any).status).toEqual(308)
        }
      })
    )
  })
})