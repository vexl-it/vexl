import {SqlClient} from '@effect/sql'
import {RegionCode} from '@vexl-next/domain/src/utility/RegionCode.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  FeedbackFormId,
  SubmitFeedbackRequest,
} from '@vexl-next/rest-api/src/services/feedback/contracts'
import {mockedReportMetric} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {setDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {
  type MockedContexts,
  runPromiseInMockedEnvironment,
} from './utils/runPromiseInMockedEnvironment'

const headers = Schema.decodeSync(CommonHeaders)({
  'user-agent': 'Vexl/2 (1.0.0) IOS',
  'vexl-app-meta': JSON.stringify({
    platform: 'IOS',
    versionCode: 2,
    semver: '1.0.0',
    appSource: 'test',
    language: 'en',
    isDeveloper: false,
    prefix: 420,
  }),
})

const submitFeedback = (
  feedback: Omit<SubmitFeedbackRequest, 'formId'> & {formId: string}
): Effect.Effect<void, unknown, MockedContexts> =>
  Effect.gen(function* (_) {
    const client = yield* _(NodeTestingApp)
    yield* _(setDummyAuthHeaders)
    yield* _(
      client.submitFeedback({
        payload: new SubmitFeedbackRequest({
          ...feedback,
          formId: Schema.decodeSync(FeedbackFormId)(feedback.formId),
        }),
        headers,
      })
    )
  })

describe('Feedback service test', () => {
  beforeEach(() => {
    mockedReportMetric.mockClear()
  })

  it('should submit feedback', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        yield* _(
          submitFeedback({
            formId: 'testFeedbackFormId',
            type: 'create',
            countryCode: Schema.decodeSync(RegionCode)('CZ'),
            objections: 'testObjections',
            stars: 5,
            textComment: 'testTextComment',
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        const insertedFeedbackInDb = yield* _(sql`
          SELECT
            *
          FROM
            feedback_submit
          WHERE
            form_id = ${'testFeedbackFormId'}
        `)

        expect(insertedFeedbackInDb).toHaveLength(1)
        expect(insertedFeedbackInDb[0].textComment).toEqual('testTextComment')
        expect(mockedReportMetric).not.toHaveBeenCalled()
      })
    )
  })

  it('reports TRADE_FEEDBACK_SUBMITTED once, when trade stars are first set', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const formId = 'tradeFeedbackFormId'
        yield* _(submitFeedback({formId, type: 'trade', objections: 'slow'}))
        yield* _(submitFeedback({formId, type: 'trade', stars: 4}))
        yield* _(submitFeedback({formId, type: 'trade', textComment: 'ok'}))
        yield* _(submitFeedback({formId, type: 'trade', stars: 1}))

        expect(mockedReportMetric).toHaveBeenCalledTimes(1)
        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'TRADE_FEEDBACK_SUBMITTED',
            type: 'Increment',
            value: 1,
            attributes: {
              appVersion: '1.0.0',
              appVersionCode: 2,
              appPlatform: 'IOS',
              appSource: 'test',
              clientCountryPrefix: 420,
              positive: true,
            },
          })
        )
      })
    )
  })

  it('reports a trade rating below 4 stars as not positive', async () => {
    await runPromiseInMockedEnvironment(
      submitFeedback({formId: 'lowStarsFormId', type: 'trade', stars: 3})
    )

    expect(mockedReportMetric).toHaveBeenCalledTimes(1)
    expect(mockedReportMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.objectContaining({positive: false}),
      })
    )
  })
})
