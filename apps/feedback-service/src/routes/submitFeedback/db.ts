import {SqlClient, SqlResolver} from '@effect/sql'
import {RegionCodeE} from '@vexl-next/domain/src/utility/RegionCode.brand'
import {
  FeedbackFormId,
  FeedbackType,
} from '@vexl-next/rest-api/src/services/feedback/contracts'
import {Context, Effect, Layer, Schema} from 'effect'

const FeedbackInsert = Schema.Struct({
  formId: FeedbackFormId,
  type: FeedbackType,
  stars: Schema.optional(
    Schema.Int.pipe(Schema.lessThanOrEqualTo(5), Schema.greaterThanOrEqualTo(0))
  ),
  objections: Schema.optional(Schema.String),
  textComment: Schema.optional(Schema.String),
  countryCode: Schema.optional(RegionCodeE),
})

const makeInsertFeedbackService = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  const resolver = yield* _(
    SqlResolver.void('upsertFeedback', {
      Request: FeedbackInsert,
      execute: (requests) => {
        const requestsWithDate = requests.map((req) => ({
          ...req,
          lastUpdate: new Date(),
        }))

        return sql`
          INSERT INTO
            feedback_submit ${sql.insert(requestsWithDate)}
          ON CONFLICT (form_id) DO
          UPDATE
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
  )

  return resolver.execute
})

export class FeedbackDbService extends Context.Tag('FeedbackDbService')<
  FeedbackDbService,
  Effect.Effect.Success<typeof makeInsertFeedbackService>
>() {
  static readonly Live = Layer.effect(
    FeedbackDbService,
    makeInsertFeedbackService
  )
}
