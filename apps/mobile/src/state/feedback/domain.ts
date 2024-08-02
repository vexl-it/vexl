import {Feedback} from '@vexl-next/domain/src/general/feedback'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {z} from 'zod'

export const ChatToFeedbackItem = z
  .object({
    chatId: ChatId,
    feedback: Feedback,
  })
  .readonly()
export type ChatToFeedbackItem = z.TypeOf<typeof ChatToFeedbackItem>

export const ChatToFeedbackItems = z
  .object({
    chatsToFeedbacks: z.array(ChatToFeedbackItem),
  })
  .readonly()
