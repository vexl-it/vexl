import {Schema} from '@effect/schema'
import {RegionCodeE} from '@vexl-next/domain/src/utility/RegionCode.brand'

export const FeedbackFormId = Schema.NonEmptyString.pipe(
  Schema.brand('FeedbackFormId')
)
export type FeedbackFormId = Schema.Schema.Type<typeof FeedbackFormId>

export const FeedbackType = Schema.Literal('create', 'trade')
export type FeedbackType = Schema.Schema.Type<typeof FeedbackType>

export class SubmitFeedbackRequest extends Schema.Class<SubmitFeedbackRequest>(
  'SubmitFeedbackRequest'
)({
  formId: FeedbackFormId,
  type: FeedbackType,
  stars: Schema.optional(
    Schema.Int.pipe(Schema.lessThanOrEqualTo(5), Schema.greaterThanOrEqualTo(0))
  ),
  objections: Schema.optional(Schema.String),
  textComment: Schema.optional(Schema.String),
  countryCode: Schema.optional(RegionCodeE),
}) {}

export const SubmitFeedbackInput = Schema.Struct({
  body: SubmitFeedbackRequest,
})

export type SubmitFeedbackInput = Schema.Schema.Type<typeof SubmitFeedbackInput>
