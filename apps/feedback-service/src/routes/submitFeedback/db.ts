import {SqlClient, SqlSchema} from '@effect/sql'
import {RegionCode} from '@vexl-next/domain/src/utility/RegionCode.brand'
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
  countryCode: Schema.optional(RegionCode),
})

const UpsertFeedbackResult = Schema.Struct({
  previousStars: Schema.NullOr(Schema.Int),
})

const makeUpsertFeedbackService = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  return SqlSchema.single({
    Request: FeedbackInsert,
    Result: UpsertFeedbackResult,
    execute: (feedback) => sql`
      WITH
        previous AS (
          SELECT
            stars
          FROM
            feedback_submit
          WHERE
            form_id = ${feedback.formId}
        )
      INSERT INTO
        feedback_submit ${sql.insert({...feedback, lastUpdate: new Date()})}
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
      RETURNING
        (
          SELECT
            stars
          FROM
            previous
        ) AS previous_stars
    `,
  })
})

export class FeedbackDbService extends Context.Tag('FeedbackDbService')<
  FeedbackDbService,
  Effect.Effect.Success<typeof makeUpsertFeedbackService>
>() {
  static readonly Live = Layer.effect(
    FeedbackDbService,
    makeUpsertFeedbackService
  )
}
