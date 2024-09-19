import {Schema} from '@effect/schema'
import {Brand} from 'effect'
import {z} from 'zod'
import {generateUuid} from '../utility/Uuid.brand'

export const POSITIVE_STAR_RATING_THRESHOLD = 4

export const FeedbackFormId = z
  .string()
  .uuid()
  .transform((v) => {
    return Brand.nominal<typeof v & Brand.Brand<'FeedbackFormId'>>()(v)
  })
export const FeedbackFormIdE = Schema.String.pipe(
  Schema.brand('FeedbackFormId')
)
export type FeedbackFormId = Schema.Schema.Type<typeof FeedbackFormIdE>

export function generateFeedbackFormId(): FeedbackFormId {
  return Schema.decodeSync(FeedbackFormIdE)(generateUuid())
}

export const ObjectionType = z.enum([
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
export const ObjectionTypeE = Schema.Literal(
  'APP',
  'PROCESS',
  'RESPONDING_TIME',
  'CANCELED_OFFER',
  'IMPOSSIBLE_TO_AGREE',
  'LEFT_THE_CHAT',
  'DID_NOT_SHOW_UP',
  'I_MET_NEW_FRIEND',
  'DEAL_WAS_SMOOTH',
  'IT_WAS_FAST'
)
export type ObjectionType = Schema.Schema.Type<typeof ObjectionTypeE>

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

export const FeedbackType = z.enum(['CHAT_RATING', 'OFFER_RATING'])
export const FeedbackTypeE = Schema.Literal('CHAT_RATING', 'OFFER_RATING')
export type FeedbackType = Schema.Schema.Type<typeof FeedbackTypeE>

export const FeedbackPage = z.enum([
  'CHAT_RATING',
  'OFFER_RATING',
  'OBJECTIONS',
  'TEXT_COMMENT',
])
export const FeedbackPageE = Schema.Literal(
  'CHAT_RATING',
  'OFFER_RATING',
  'OBJECTIONS',
  'TEXT_COMMENT'
)
export type FeedbackPage = Schema.Schema.Type<typeof FeedbackPageE>

export const Feedback = z
  .object({
    formId: FeedbackFormId,
    type: FeedbackType,
    currentPage: FeedbackPage,
    stars: z.number(),
    objections: z.array(ObjectionType),
    textComment: z.string(),
    finished: z.boolean().default(false),
  })
  .readonly()
export const FeedbackE = Schema.Struct({
  formId: FeedbackFormIdE,
  type: FeedbackTypeE,
  currentPage: FeedbackPageE,
  stars: Schema.Number,
  objections: Schema.Array(ObjectionTypeE),
  textComment: Schema.String,
  finished: Schema.optionalWith(Schema.Boolean, {default: () => false}),
})
export type Feedback = Schema.Schema.Type<typeof FeedbackE>
