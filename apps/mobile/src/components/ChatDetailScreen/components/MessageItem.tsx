import React from 'react'
import {type Atom, useAtomValue} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import BigIconMessage from './BigIconMessage'
import UserAvatar from '../../UserAvatar'
import TextMessage from './TextMessage'
import {Stack, Text} from 'tamagui'
import Image from '../../Image'
import BlockIconSvg from '../../../images/blockIconSvg'
import IdentityRevealMessageItem from './IdentityRevealMessageItem'
import ContactRevealMessageItem from './ContactRevealMessageItem'
import UserFeedback from '../../UserFeedback'
import VexlBotMessageItem from './VexlbotMessageItem'
import formatChatTime from '../utils/formatChatTime'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {type VexlBotMessageData} from './VexlbotMessageItem/domain'
import {type DateTime} from 'luxon'
import MessageIncompatibleItem from './MessageIncompatibleItem'

export type MessagesListItem =
  | {
      type: 'time'
      time: DateTime
      key: string
    }
  | {
      type: 'message'
      time: DateTime
      message: ChatMessageWithState
      isLatest: boolean
      key: string
    }
  | {
      type: 'space'
      key: string
    }
  | {
      type: 'originInfo'
      key: string
    }
  | {
      type: 'vexlBot'
      key: string
      data: VexlBotMessageData
    }

function MessageItem({
  itemAtom,
}: {
  itemAtom: Atom<MessagesListItem>
}): JSX.Element | null {
  const item = useAtomValue(itemAtom)
  const {chatFeedbackAtom, otherSideDataAtom} = useMolecule(chatMolecule)
  const {t} = useTranslation()
  const {userName, image} = useAtomValue(otherSideDataAtom)

  if (item.type === 'message') {
    if (item.message.state === 'receivedButRequiresNewerVersion') {
      return <MessageIncompatibleItem message={item.message.message} />
    }

    if (
      item.message.state === 'received' &&
      item.message.message.messageType === 'INBOX_DELETED'
    ) {
      return (
        <BigIconMessage
          isLatest={item.isLatest}
          smallerText={t('messages.messagePreviews.incoming.INBOX_DELETED', {
            them: userName,
          })}
          icon={
            <Stack
              width={80}
              height={80}
              backgroundColor={'$darkRed'}
              alignItems="center"
              justifyContent={'center'}
              borderRadius={'$7'}
            >
              <Image width={35} height={35} source={BlockIconSvg} />
            </Stack>
          }
        />
      )
    }

    const direction =
      item.message.state === 'received' ? 'incoming' : 'outgoing'

    if (item.message.message.messageType === 'DELETE_CHAT') {
      return (
        <>
          <BigIconMessage
            isLatest={direction !== 'incoming' && item.isLatest}
            smallerText={t(
              `messages.messagePreviews.${direction}.DELETE_CHAT`,
              {
                them: userName,
              }
            )}
            icon={
              <UserAvatar
                height={80}
                width={80}
                userImage={image}
                grayScale={true}
              />
            }
          />
          {direction === 'incoming' && (
            <UserFeedback
              autoCloseWhenFinished
              feedbackAtom={chatFeedbackAtom}
            />
          )}
        </>
      )
    }

    if (item.message.message.messageType === 'BLOCK_CHAT')
      return (
        <BigIconMessage
          isLatest={item.isLatest}
          smallerText={t(`messages.messagePreviews.${direction}.BLOCK_CHAT`, {
            them: userName,
          })}
          icon={
            <UserAvatar
              height={80}
              width={80}
              userImage={image}
              grayScale={true}
            />
          }
        />
      )

    if (item.message.message.messageType === 'INBOX_DELETED')
      return (
        <BigIconMessage
          isLatest={item.isLatest}
          smallerText={t(
            `messages.messagePreviews.${direction}.INBOX_DELETED`,
            {
              them: userName,
            }
          )}
          icon={
            <UserAvatar
              height={80}
              width={80}
              userImage={image}
              grayScale={true}
            />
          }
        />
      )

    if (
      item.message.message.messageType === 'REQUEST_REVEAL' ||
      item.message.message.messageType === 'APPROVE_REVEAL' ||
      item.message.message.messageType === 'DISAPPROVE_REVEAL'
    ) {
      return (
        <IdentityRevealMessageItem
          message={item.message}
          isLatest={item.isLatest}
          direction={direction}
        />
      )
    }

    if (
      item.message.message.messageType === 'REQUEST_CONTACT_REVEAL' ||
      item.message.message.messageType === 'APPROVE_CONTACT_REVEAL' ||
      item.message.message.messageType === 'DISAPPROVE_CONTACT_REVEAL'
    ) {
      return (
        <ContactRevealMessageItem
          message={item.message}
          isLatest={item.isLatest}
          direction={direction}
        />
      )
    }

    if (item.message.message.messageType === 'TRADE_CHECKLIST_UPDATE') {
      return null
    }

    return <TextMessage messageAtom={itemAtom} />
  }

  if (item.type === 'vexlBot') {
    return <VexlBotMessageItem data={item.data} />
  }

  if (item.type === 'time')
    return (
      <Stack ai={'center'}>
        <Text color="$greyOnBlack">{formatChatTime(item.time)}</Text>
      </Stack>
    )
  if (item.type === 'space') return <Stack h={'$3'} />
  return null
}

export default React.memo(MessageItem)
