import {RegionCode} from '@vexl-next/domain/src/utility/RegionCode.brand'
import {Schema} from 'effect'

export const FeedbackFormId = Schema.NonEmptyString.pipe(
  Schema.brand('FeedbackFormId')
)
export type FeedbackFormId = Schema.Schema.Type<typeof FeedbackFormId>

export const FeedbackType = Schema.Literals(['create', 'trade'])
export type FeedbackType = Schema.Schema.Type<typeof FeedbackType>

export class SubmitFeedbackRequest extends Schema.Class<SubmitFeedbackRequest>(
  'SubmitFeedbackRequest'
)({
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
}) {}
