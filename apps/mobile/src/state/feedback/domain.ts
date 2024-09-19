import {Schema} from '@effect/schema'
import {Feedback, FeedbackE} from '@vexl-next/domain/src/general/feedback'
import {ChatId, ChatIdE} from '@vexl-next/domain/src/general/messaging'
import {z} from 'zod'

export const ChatToFeedbackItem = z
  .object({
    chatId: ChatId,
    feedback: Feedback,
  })
  .readonly()
export const ChatToFeedbackItemE = Schema.Struct({
  chatId: ChatIdE,
  feedback: FeedbackE,
})
export type ChatToFeedbackItem = Schema.Schema.Type<typeof ChatToFeedbackItemE>

export const ChatToFeedbackItems = z
  .object({
    chatsToFeedbacks: z.array(ChatToFeedbackItem),
  })
  .readonly()
export const ChatToFeedbackItemsE = Schema.Struct({
  chatsToFeedbacks: Schema.Array(ChatToFeedbackItemE),
})
