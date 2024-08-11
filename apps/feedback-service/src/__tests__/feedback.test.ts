import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {SqlClient} from '@effect/sql'
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

describe('Feedback service test', () => {
  it('should submit feedback', async () => {
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

        yield* _(
          client.submitFeedback(
            {body},
            HttpClientRequest.setHeaders(yield* _(createDummyAuthHeaders))
          )
        )

        const sql = yield* _(SqlClient.SqlClient)
        const insertedFeedbackInDb = yield* _(sql`
          SELECT
            *
          FROM
            feedback_submit
          WHERE
            form_id = ${body.formId}
        `)

        expect(insertedFeedbackInDb).toHaveLength(1)
        expect(insertedFeedbackInDb[0].textComment).toEqual(body.textComment)
      })
    )
  })

  it('should fail when submitting feedback without auth headers', async () => {
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
})
