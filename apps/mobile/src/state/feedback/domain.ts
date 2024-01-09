import {z} from 'zod'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {Feedback} from '@vexl-next/domain/src/general/feedback'

export const ChatToFeedbackItem = z.object({
  chatId: ChatId,
  feedback: Feedback,
})
export type ChatToFeedbackItem = z.TypeOf<typeof ChatToFeedbackItem>

export const ChatToFeedbackItems = z.object({
  chatsToFeedbacks: z.array(ChatToFeedbackItem),
})
