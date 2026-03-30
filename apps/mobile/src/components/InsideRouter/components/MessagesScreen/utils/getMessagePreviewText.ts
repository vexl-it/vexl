import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import {type TFunction} from '../../../../../utils/localization/I18nProvider'

export function getMessagePreviewText({
  messageWithState,
  name,
  t,
}: {
  messageWithState: ChatMessageWithState
  name: string
  t: TFunction
}): {text: string; color?: string} {
  const {message, state} = messageWithState
  const direction = state === 'received' ? 'incoming' : 'outgoing'

  if (message.messageType === 'APPROVE_MESSAGING') {
    return {
      text: t(`messages.messagePreviews.${direction}.APPROVE_MESSAGING`, {
        them: name,
      }),
      color: '$green',
    }
  }
  if (message.messageType === 'DISAPPROVE_MESSAGING') {
    return {
      text: t(`messages.messagePreviews.${direction}.DISAPPROVE_MESSAGING`, {
        them: name,
      }),
      color: '$red',
    }
  }
  if (
    message.messageType === 'APPROVE_REVEAL' ||
    (message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
      message.tradeChecklistUpdate?.identity?.status === 'APPROVE_REVEAL')
  ) {
    return {
      text: t(`messages.messagePreviews.${direction}.APPROVE_REVEAL`, {
        them: name,
      }),
      color: '$green',
    }
  }
  if (message.messageType === 'REQUEST_MESSAGING') {
    return {
      text: t(`messages.messagePreviews.${direction}.REQUEST_MESSAGING`, {
        them: name,
      }),
      color: '$main',
    }
  }
  if (message.messageType === 'BLOCK_CHAT') {
    return {
      text: t(`messages.messagePreviews.${direction}.BLOCK_CHAT`, {them: name}),
      color: '$red',
    }
  }
  if (message.messageType === 'DELETE_CHAT') {
    return {
      text: t(`messages.messagePreviews.${direction}.DELETE_CHAT`, {
        them: name,
      }),
      color: '$red',
    }
  }
  if (
    message.messageType === 'DISAPPROVE_REVEAL' ||
    (message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
      message.tradeChecklistUpdate?.identity?.status === 'DISAPPROVE_REVEAL')
  ) {
    return {
      text: t(`messages.messagePreviews.${direction}.DISAPPROVE_REVEAL`, {
        them: name,
      }),
      color: '$red',
    }
  }
  if (message.messageType === 'CANCEL_REQUEST_MESSAGING') {
    return {
      text: t(
        `messages.messagePreviews.${direction}.CANCEL_REQUEST_MESSAGING`,
        {
          them: name,
        }
      ),
      color: '$red',
    }
  }
  if (
    message.messageType === 'REQUEST_REVEAL' ||
    (message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
      message.tradeChecklistUpdate?.identity?.status === 'REQUEST_REVEAL')
  ) {
    return {
      text: t(`messages.messagePreviews.${direction}.REQUEST_REVEAL`, {
        them: name,
      }),
    }
  }
  if (message.messageType === 'VERSION_UPDATE') {
    return {text: t(`messages.textMessageTypes.VERSION_UPDATE`)}
  }
  if (message.messageType === 'MESSAGE') {
    if (message.text.trim() === '' && message.image !== undefined) {
      return {
        text: t(`messages.messagePreviews.${direction}.ONLY_IMAGE`, {
          message: message.text,
          them: name,
        }),
      }
    }

    return {
      text: t(`messages.messagePreviews.${direction}.MESSAGE`, {
        message: message.text,
        them: name,
      }),
    }
  }
  if (message.messageType === 'INBOX_DELETED') {
    return {
      text: t(`messages.messagePreviews.${direction}.INBOX_DELETED`, {
        message: message.text,
        them: name,
      }),
      color: '$red',
    }
  }
  if (
    message.messageType === 'REQUEST_CONTACT_REVEAL' ||
    (message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
      message.tradeChecklistUpdate?.contact?.status === 'REQUEST_REVEAL')
  ) {
    return {
      text: t(`messages.messagePreviews.${direction}.REQUEST_CONTACT_REVEAL`, {
        them: name,
      }),
    }
  }
  if (
    message.messageType === 'APPROVE_CONTACT_REVEAL' ||
    (message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
      message.tradeChecklistUpdate?.contact?.status === 'APPROVE_REVEAL')
  ) {
    return {
      text: t(`messages.messagePreviews.${direction}.APPROVE_CONTACT_REVEAL`, {
        them: name,
      }),
    }
  }
  if (
    message.messageType === 'DISAPPROVE_CONTACT_REVEAL' ||
    (message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
      message.tradeChecklistUpdate?.contact?.status === 'DISAPPROVE_REVEAL')
  ) {
    return {
      text: t(
        `messages.messagePreviews.${direction}.DISAPPROVE_CONTACT_REVEAL`,
        {
          them: name,
        }
      ),
    }
  }
  if (message.messageType === 'TRADE_CHECKLIST_UPDATE') {
    return {
      text: t(`messages.messagePreviews.${direction}.TRADE_CHECKLIST_UPDATE`, {
        them: name,
      }),
    }
  }
  if (message.messageType === 'REQUIRES_NEWER_VERSION') {
    return {text: t(`messages.incompatible.title`)}
  }

  return {text: message.text}
}
