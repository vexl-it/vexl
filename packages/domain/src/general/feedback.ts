import {Effect, Schema} from 'effect'
import {generateUuid} from '../utility/Uuid.brand'

export const POSITIVE_STAR_RATING_THRESHOLD = 4

export const FeedbackFormId = Schema.String.check(Schema.isUUID()).pipe(
  Schema.brand('FeedbackFormId')
)
export type FeedbackFormId = typeof FeedbackFormId.Type

export function generateFeedbackFormId(): FeedbackFormId {
  return Schema.decodeSync(FeedbackFormId)(generateUuid())
}

export const ObjectionType = Schema.Literals([
  'APP',
  'PROCESS',
  'RESPONDING_TIME',
  'CANCELED_OFFER',
  'IMPOSSIBLE_TO_AGREE',
  'LEFT_THE_CHAT',
  'DID_NOT_SHOW_UP',
  'I_MET_NEW_FRIEND',
  'DEAL_WAS_SMOOTH',
  'IT_WAS_FAST',
])
export type ObjectionType = typeof ObjectionType.Type

export const objectionTypeNegativeOptions: ObjectionType[] = [
  'APP',
  'PROCESS',
  'RESPONDING_TIME',
  'CANCELED_OFFER',
  'IMPOSSIBLE_TO_AGREE',
  'LEFT_THE_CHAT',
  'DID_NOT_SHOW_UP',
]

export const objectionTypePositiveOptions: ObjectionType[] = [
  'APP',
  'PROCESS',
  'RESPONDING_TIME',
  'I_MET_NEW_FRIEND',
  'DEAL_WAS_SMOOTH',
  'IT_WAS_FAST',
]

export const FeedbackType = Schema.Literals(['CHAT_RATING', 'OFFER_RATING'])
export type FeedbackType = typeof FeedbackType.Type

export const FeedbackPage = Schema.Literals([
  'CHAT_RATING',
  'OFFER_RATING',
  'OBJECTIONS',
  'TEXT_COMMENT',
])
export type FeedbackPage = typeof FeedbackPage.Type

export const Feedback = Schema.Struct({
  formId: FeedbackFormId,
  type: FeedbackType,
  currentPage: FeedbackPage,
  stars: Schema.Number,
  objections: Schema.Array(ObjectionType),
  textComment: Schema.String,
  finished: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
})
export type Feedback = typeof Feedback.Type
