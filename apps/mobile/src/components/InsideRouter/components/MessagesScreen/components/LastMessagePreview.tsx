import {type Atom, useAtomValue} from 'jotai'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import React from 'react'
import {Text} from 'tamagui'

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

  const baseProps = {
    color: '$greyOnBlack',
    ff: unread ? '$body600' : '$body',
    fs: 14,
  } as const

  if (message.messageType === 'APPROVE_MESSAGING') {
    return (
      <Text {...baseProps} color={'$pastelGreen'}>
        {t(`messages.messagePreviews.${direction}.APPROVE_MESSAGING`, {
          them: name,
        })}
      </Text>
    )
  } else if (message.messageType === 'DISAPPROVE_MESSAGING') {
    return (
      <Text {...baseProps} color="$red">
        {t(`messages.messagePreviews.${direction}.DISAPPROVE_MESSAGING`, {
          them: name,
        })}
      </Text>
    )
  } else if (message.messageType === 'APPROVE_REVEAL') {
    return (
      <Text {...baseProps} color="$green">
        {t(`messages.messagePreviews.${direction}.APPROVE_REVEAL`, {
          them: name,
        })}
      </Text>
    )
  } else if (message.messageType === 'REQUEST_MESSAGING') {
    return (
      <Text {...baseProps} color="$main">
        {t(`messages.messagePreviews.${direction}.REQUEST_MESSAGING`, {
          them: name,
        })}
      </Text>
    )
  } else if (message.messageType === 'BLOCK_CHAT') {
    return (
      <Text {...baseProps} color="$red">
        {t(`messages.messagePreviews.${direction}.BLOCK_CHAT`, {them: name})}
      </Text>
    )
  } else if (message.messageType === 'DELETE_CHAT') {
    return (
      <Text {...baseProps} color="$red">
        {t(`messages.messagePreviews.${direction}.DELETE_CHAT`, {them: name})}
      </Text>
    )
  } else if (message.messageType === 'DISAPPROVE_REVEAL') {
    return (
      <Text {...baseProps} color="$red">
        {t(`messages.messagePreviews.${direction}.DISAPPROVE_REVEAL`, {
          them: name,
        })}
      </Text>
    )
  } else if (message.messageType === 'REQUEST_REVEAL') {
    return (
      <Text {...baseProps}>
        {t(`messages.messagePreviews.${direction}.REQUEST_REVEAL`, {
          them: name,
        })}
      </Text>
    )
  } else if (message.messageType === 'MESSAGE') {
    return (
      <Text {...baseProps}>
        {t(`messages.messagePreviews.${direction}.MESSAGE`, {
          message: message.text,
          them: name,
        })}
      </Text>
    )
  } else if (message.messageType === 'INBOX_DELETED') {
    return (
      <Text {...baseProps} color={'$red'}>
        {t(`messages.messagePreviews.${direction}.INBOX_DELETED`, {
          message: message.text,
          them: name,
        })}
      </Text>
    )
  } else if (message.messageType === 'OFFER_DELETED') {
    return (
      <Text {...baseProps}>
        {t(`messages.messagePreviews.${direction}.OFFER_DELETED`, {
          message: message.text,
          them: name,
        })}
      </Text>
    )
  } else {
    return <Text {...baseProps}>{message.text}</Text>
  }
}

export default MessagePreview
