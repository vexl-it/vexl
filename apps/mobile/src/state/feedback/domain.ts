import {Feedback} from '@vexl-next/domain/src/general/feedback'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {Schema} from 'effect'

export const ChatToFeedbackItem = Schema.Struct({
  chatId: ChatId,
  feedback: Feedback,
})
export type ChatToFeedbackItem = typeof ChatToFeedbackItem.Type

export const ChatToFeedbackItems = Schema.Struct({
  chatsToFeedbacks: Schema.Array(ChatToFeedbackItem),
})
export type ChatToFeedbackItems = typeof ChatToFeedbackItems.Type
