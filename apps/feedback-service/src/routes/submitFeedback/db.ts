import {RegionCode} from '@vexl-next/domain/src/utility/RegionCode.brand'
import {
  FeedbackFormId,
  FeedbackType,
} from '@vexl-next/rest-api/src/services/feedback/contracts'
import {Context, Effect, Layer, Schema} from 'effect'
import {SqlClient, SqlResolver} from 'effect/unstable/sql'

const FeedbackInsert = Schema.Struct({
  formId: FeedbackFormId,
  type: FeedbackType,
  stars: Schema.optional(
    Schema.Int.pipe(
      Schema.check(Schema.isLessThanOrEqualTo(5)),
      Schema.check(Schema.isGreaterThanOrEqualTo(0))
    )
  ),
  objections: Schema.optional(Schema.String),
  textComment: Schema.optional(Schema.String),
  countryCode: Schema.optional(RegionCode),
})

const makeInsertFeedbackService = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const resolver = SqlResolver.void({
    Request: FeedbackInsert,
    execute: (requests) => {
      const requestsWithDate = requests.map((req) => ({
        ...req,
        lastUpdate: new Date(),
      }))

      return sql`
        INSERT INTO
          feedback_submit ${sql.insert(requestsWithDate)}
        ON CONFLICT (form_id) DO UPDATE
        SET
          stars = COALESCE(EXCLUDED.stars, feedback_submit.stars),
          objections = COALESCE(EXCLUDED.objections, feedback_submit.objections),
          text_comment = COALESCE(
            EXCLUDED.text_comment,
            feedback_submit.text_comment
          ),
          country_code = COALESCE(
            EXCLUDED.country_code,
            feedback_submit.country_code
          ),
          last_update = COALESCE(EXCLUDED.last_update, feedback_submit.last_update)
      `
    },
  })

  return SqlResolver.request(resolver)
})

export class FeedbackDbService extends Context.Service<
  FeedbackDbService,
  Effect.Success<typeof makeInsertFeedbackService>
>()('FeedbackDbService') {
  static readonly Live = Layer.effect(
    FeedbackDbService,
    makeInsertFeedbackService
  )
}
