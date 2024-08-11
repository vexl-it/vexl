import {Schema} from '@effect/schema'
import {RegionCodeE} from '@vexl-next/domain/src/utility/RegionCode.brand'
import {Api} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'

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

export const SubmitFeedbackEndpoint = Api.post(
  'submitFeedback',
  '/api/v1/feedback/submit'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(SubmitFeedbackRequest)
)

export const FeedbackApiSpecification = Api.make({
  title: 'Feedback service',
}).pipe(Api.addEndpoint(SubmitFeedbackEndpoint))
