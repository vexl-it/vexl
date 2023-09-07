import {type Atom, useAtomValue} from 'jotai'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import React from 'react'
import {styled, Text} from 'tamagui'

const BaseText = styled(Text, {
  color: '$greyOnBlack',
  fs: 14,
  ff: '$body600',
})

function MessagePreview({
  lastMessageAtom,
  unread,
  name,
}: {
  lastMessageAtom: Atom<ChatMessageWithState>
  unread: boolean
  name: string
}): JSX.Element | null {
  const {t} = useTranslation()

  const messageWithState = useAtomValue(lastMessageAtom)

  const {message, state} = messageWithState

  const direction = state === 'received' ? 'incoming' : 'outgoing'

  if (message.messageType === 'APPROVE_MESSAGING') {
    return (
      <BaseText color={'$pastelGreen'}>
        {t(`messages.messagePreviews.${direction}.APPROVE_MESSAGING`, {
          them: name,
        })}
      </BaseText>
    )
  } else if (message.messageType === 'DISAPPROVE_MESSAGING') {
    return (
      <BaseText color="$red">
        {t(`messages.messagePreviews.${direction}.DISAPPROVE_MESSAGING`, {
          them: name,
        })}
      </BaseText>
    )
  } else if (message.messageType === 'APPROVE_REVEAL') {
    return (
      <BaseText color="$green">
        {t(`messages.messagePreviews.${direction}.APPROVE_REVEAL`, {
          them: name,
        })}
      </BaseText>
    )
  } else if (message.messageType === 'REQUEST_MESSAGING') {
    return (
      <BaseText color="$main">
        {t(`messages.messagePreviews.${direction}.REQUEST_MESSAGING`, {
          them: name,
        })}
      </BaseText>
    )
  } else if (message.messageType === 'BLOCK_CHAT') {
    return (
      <BaseText color="$red">
        {t(`messages.messagePreviews.${direction}.BLOCK_CHAT`, {them: name})}
      </BaseText>
    )
  } else if (message.messageType === 'DELETE_CHAT') {
    return (
      <BaseText color="$red">
        {t(`messages.messagePreviews.${direction}.DELETE_CHAT`, {them: name})}
      </BaseText>
    )
  } else if (message.messageType === 'DISAPPROVE_REVEAL') {
    return (
      <BaseText color="$red">
        {t(`messages.messagePreviews.${direction}.DISAPPROVE_REVEAL`, {
          them: name,
        })}
      </BaseText>
    )
  } else if (message.messageType === 'CANCEL_REQUEST_MESSAGING') {
    return (
      <BaseText color="$red">
        {t(`messages.messagePreviews.${direction}.CANCEL_REQUEST_MESSAGING`, {
          them: name,
        })}
      </BaseText>
    )
  } else if (message.messageType === 'REQUEST_REVEAL') {
    return (
      <BaseText>
        {t(`messages.messagePreviews.${direction}.REQUEST_REVEAL`, {
          them: name,
        })}
      </BaseText>
    )
  } else if (message.messageType === 'MESSAGE') {
    if (message.text.trim() === '' && message.image !== undefined) {
      return (
        <BaseText fontStyle={'italic'}>
          {t(`messages.messagePreviews.${direction}.ONLY_IMAGE`, {
            message: message.text,
            them: name,
          })}
        </BaseText>
      )
    }
    return (
      <BaseText ff={unread ? '$body600' : '$body'}>
        {t(`messages.messagePreviews.${direction}.MESSAGE`, {
          message: message.text,
          them: name,
        })}
      </BaseText>
    )
  } else if (message.messageType === 'INBOX_DELETED') {
    return (
      <BaseText color={'$red'}>
        {t(`messages.messagePreviews.${direction}.INBOX_DELETED`, {
          message: message.text,
          them: name,
        })}
      </BaseText>
    )
  } else if (message.messageType === 'REQUEST_CONTACT_REVEAL') {
    return (
      <BaseText>
        {t(`messages.messagePreviews.${direction}.REQUEST_CONTACT_REVEAL`, {
          them: name,
        })}
      </BaseText>
    )
  } else if (message.messageType === 'APPROVE_CONTACT_REVEAL') {
    return (
      <BaseText>
        {t(`messages.messagePreviews.${direction}.APPROVE_CONTACT_REVEAL`, {
          them: name,
        })}
      </BaseText>
    )
  } else if (message.messageType === 'DISAPPROVE_CONTACT_REVEAL') {
    return (
      <BaseText>
        {t(`messages.messagePreviews.${direction}.DISAPPROVE_CONTACT_REVEAL`, {
          them: name,
        })}
      </BaseText>
    )
  } else {
    return <BaseText>{message.text}</BaseText>
  }
}

export default MessagePreview
