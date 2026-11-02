import {type ChatMessage} from '@vexl-next/domain/src/general/messaging'

export function hasChatImage(
  message: Pick<ChatMessage, 'image' | 'imageAttachment'>
): boolean {
  return message.image !== undefined || message.imageAttachment !== undefined
}

export function isImageOnlyMessage(
  message: Pick<ChatMessage, 'text' | 'image' | 'imageAttachment'>
): boolean {
  return message.text.trim() === '' && hasChatImage(message)
}
