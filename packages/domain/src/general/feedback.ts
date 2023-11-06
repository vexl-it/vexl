import {z} from 'zod'
import {generateUuid, Uuid} from '../utility/Uuid.brand'

export const POSITIVE_STAR_RATING_THRESHOLD = 4

export const FeedbackFormId = z.string().uuid().brand<'feedbackFormId'>()
export type FeedbackFormId = z.TypeOf<typeof FeedbackFormId>

export function generateFeedbackFormId(): FeedbackFormId {
  return FeedbackFormId.parse(Uuid.parse(generateUuid()))
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
export type ObjectionType = z.TypeOf<typeof ObjectionType>

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

export const FeedbackType = z.enum([
  'CHAT_RATING',
  'OFFER_RATING',
  'OBJECTIONS',
  'TEXT_COMMENT',
])
export type FeedbackType = z.TypeOf<typeof FeedbackType>

export const Feedback = z.object({
  formId: FeedbackFormId,
  type: FeedbackType,
  stars: z.number(),
  objections: z.array(ObjectionType),
  textComment: z.string(),
  finished: z.boolean().default(false),
})
export type Feedback = z.TypeOf<typeof Feedback>
