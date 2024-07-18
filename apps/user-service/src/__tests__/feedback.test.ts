import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {RegionCodeE} from '@vexl-next/domain/src/utility/RegionCode.brand'
import {FeedbackFormId} from '@vexl-next/rest-api/src/services/user/specification'
import {createDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect} from 'effect'
import {insertFeedbackMock} from './utils/mockedFeedbackDbService'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {
  disposeRuntime,
  runPromiseInMockedEnvironment,
  startRuntime,
} from './utils/runPromiseInMockedEnvironment'

beforeAll(startRuntime)
afterAll(disposeRuntime)

describe('Feedback', () => {
  it('should submit a feedback', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const body = {
          formId: Schema.decodeSync(FeedbackFormId)('aha'),
          type: 'create',
          countryCode: Schema.decodeSync(RegionCodeE)('CZ'),
          objections: 'noOb',
          stars: 5,
          textComment: 'comment',
        } as const

        yield* _(
          client.submitFeedback(
            {
              body,
            },
            HttpClientRequest.setHeaders(yield* _(createDummyAuthHeaders))
          )
        )
        expect(insertFeedbackMock).toHaveBeenCalledWith(body)
        expect(true).toBe(true)
      })
    )
  })
  it('should fail when submitting feedback without auth headers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const body = {
          formId: Schema.decodeSync(FeedbackFormId)('aha'),
          type: 'create',
          countryCode: Schema.decodeSync(RegionCodeE)('CZ'),
          objections: 'noOb',
          stars: 5,
          textComment: 'comment',
        } as const

        const response = yield* _(
          client.submitFeedback({
            body,
          }),
          Effect.either
        )

        expect(response._tag).toEqual('Left')
        if (response._tag === 'Left') {
          expect(response.left._tag).toEqual('ClientError')
        }
      })
    )
  })
})
