import {type ChatMessage} from '@vexl-next/domain/src/general/messaging'

type ChatImageFields = Pick<
  ChatMessage,
  'image' | 'imageAttachment' | 'imageUnavailable'
>

export function hasChatImage(message: ChatImageFields): boolean {
  return (
    message.image !== undefined ||
    message.imageAttachment !== undefined ||
    !!message.imageUnavailable
  )
}

export function isImageOnlyMessage(
  message: ChatImageFields & Pick<ChatMessage, 'text'>
): boolean {
  return message.text.trim() === '' && hasChatImage(message)
}
