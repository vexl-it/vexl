import {SqlClient} from '@effect/sql'
import {RegionCode} from '@vexl-next/domain/src/utility/RegionCode.brand'
import {
  FeedbackFormId,
  FeedbackType,
} from '@vexl-next/rest-api/src/services/feedback/contracts'
import {setDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

describe('Feedback service test', () => {
  it('should submit feedback', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const body = {
          formId: Schema.decodeSync(FeedbackFormId)('testFeedbackFormId'),
          type: Schema.decodeSync(FeedbackType)('create'),
          countryCode: Schema.decodeSync(RegionCode)('CZ'),
          objections: 'testObjections',
          stars: 5,
          textComment: 'testTextComment',
        } as const

        yield* _(setDummyAuthHeaders)
        yield* _(client.submitFeedback({payload: body}))

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
})
