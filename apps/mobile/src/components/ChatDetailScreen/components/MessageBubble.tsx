import {ChatBubble, type ChatBubbleHeader} from '@vexl-next/ui'
import {Array} from 'effect'
import React from 'react'
import {
  type ChatMessageWithState,
  type MessageReactions,
} from '../../../state/chat/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'

export const PRESSED_BUBBLE_SCALE = 0.96

function MessageBubble({
  message,
  reactions,
  onImagePressed,
}: {
  message: ChatMessageWithState
  reactions?: MessageReactions | undefined
  onImagePressed?: () => void
}): React.ReactElement {
  const {t} = useTranslation()
  const {messageType, image} = message.message
  const repliedToMessage =
    'repliedTo' in message.message ? message.message.repliedTo : undefined

  const header: ChatBubbleHeader | undefined = repliedToMessage
    ? {
        label: t('common.replyTo'),
        text: repliedToMessage.text,
        imageUri: repliedToMessage.image
          ? resolveLocalUri(repliedToMessage.image)
          : undefined,
      }
    : messageType === 'REQUEST_MESSAGING'
      ? {label: t('messages.requestedWith')}
      : messageType === 'DISAPPROVE_MESSAGING'
        ? {label: t('messages.declinedWith')}
        : undefined

  return (
    <ChatBubble
      text={message.message.text}
      isMine={message.state !== 'received'}
      header={header}
      imageUri={image ? resolveLocalUri(image) : undefined}
      onImagePress={onImagePressed}
      reactions={Array.filter(
        [reactions?.theirs, reactions?.mine],
        (one) => one !== undefined
      )}
    />
  )
}

export default MessageBubble
