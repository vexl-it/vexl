import {DotTypingIndicator, Typography} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, type Atom} from 'jotai'
import React, {useMemo} from 'react'
import {Stack, XStack} from 'tamagui'
import BlockIconSvg from '../../../images/blockIconSvg'
import {createIsOtherSideTypingAtom} from '../../../state/chat/atoms/typingIndication'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import UserAvatar from '../../UserAvatar'
import UserFeedback from '../../UserFeedback'
import {chatMolecule} from '../atoms'
import {type MessagesListItem} from '../utils/buildMessagesListData'
import formatChatTime from '../utils/formatChatTime'
import BigIconMessage from './BigIconMessage'
import ContactRevealMessageItem from './ContactRevealMessageItem'
import {DisapproveMessagingMessage} from './DisapproveMessagingMessage'
import IdentityRevealMessageItem from './IdentityRevealMessageItem'
import MessageIncompatibleItem from './MessageIncompatibleItem'
import TextMessage from './TextMessage'
import VexlBotMessageItem from './VexlbotMessageItem'
import TradeChecklistAmountView from './VexlbotMessageItem/components/TradeChecklistAmountView'
import TradeChecklistDateAndTimeView from './VexlbotMessageItem/components/TradeChecklistDateAndTimeView'
import TradeChecklistMeetingLocationView from './VexlbotMessageItem/components/TradeChecklistMeetingLocationView'
import TradeChecklistNetworkView from './VexlbotMessageItem/components/TradeChecklistNetworkView'
import {VexlBotRequestHelp} from './VexlBotRequestHelp'

export type {MessagesListItem} from '../utils/buildMessagesListData'

function TypingIndication(): React.ReactElement | null {
  const {chatIdAtom} = useMolecule(chatMolecule)
  const chatId = useAtomValue(chatIdAtom)

  const isTyping = useAtomValue(
    useMemo(() => createIsOtherSideTypingAtom(chatId), [chatId])
  )

  if (!isTyping) return null

  return (
    <XStack
      alignSelf="flex-start"
      mx="$5"
      mt="$2"
      padding="$5"
      flex={1}
      alignItems="stretch"
      borderRadius="$6"
      backgroundColor="$backgroundTertiary"
    >
      <DotTypingIndicator />
    </XStack>
  )
}

function MessageItem({
  itemAtom,
}: {
  itemAtom: Atom<MessagesListItem>
}): React.ReactElement | null {
  const item = useAtomValue(itemAtom)
  const {
    chatFeedbackAtom,
    otherSideDataAtom,
    otherSideSupportsTradingChecklistAtom,
  } = useMolecule(chatMolecule)
  const {t} = useTranslation()
  const {userName, image, fullPhoneNumber} = useAtomValue(otherSideDataAtom)
  const otherSideSupportsTradingChecklist = useAtomValue(
    otherSideSupportsTradingChecklistAtom
  )

  if (item.type === 'typingIndicator') {
    return <TypingIndication />
  }

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
          smallerText={t('messages.messagePreviews.incoming.INBOX_DELETED', {
            them: userName,
          })}
          icon={
            <Stack
              width={80}
              height={80}
              backgroundColor="$darkRed"
              alignItems="center"
              justifyContent="center"
              borderRadius="$4"
            >
              <Image width={35} height={35} source={BlockIconSvg} />
            </Stack>
          }
        />
      )
    }

    const direction =
      item.message.state === 'received' ? 'incoming' : 'outgoing'

    if (item.message.message.messageType === 'DISAPPROVE_MESSAGING') {
      return <DisapproveMessagingMessage itemAtom={itemAtom} />
    }

    if (item.message.message.messageType === 'DELETE_CHAT') {
      return (
        <>
          <BigIconMessage
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
      item.message.message.messageType === 'DISAPPROVE_REVEAL' ||
      (item.message.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
        item.message.message.tradeChecklistUpdate?.identity &&
        !fullPhoneNumber)
    ) {
      return (
        <IdentityRevealMessageItem
          message={item.message}
          isLatest={item.isLatest}
        />
      )
    }

    if (
      item.message.message.messageType === 'REQUEST_CONTACT_REVEAL' ||
      item.message.message.messageType === 'APPROVE_CONTACT_REVEAL' ||
      item.message.message.messageType === 'DISAPPROVE_CONTACT_REVEAL' ||
      (item.message.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
        item.message.message.tradeChecklistUpdate?.contact)
    ) {
      return <ContactRevealMessageItem message={item.message} />
    }

    if (
      item.message.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
      otherSideSupportsTradingChecklist
    ) {
      if (item.message.message.tradeChecklistUpdate?.dateAndTime) {
        return <TradeChecklistDateAndTimeView message={item.message} />
      }
      if (item.message.message.tradeChecklistUpdate?.location) {
        return <TradeChecklistMeetingLocationView message={item.message} />
      }
      if (item.message.message.tradeChecklistUpdate?.amount) {
        return <TradeChecklistAmountView message={item.message} />
      }
      if (item.message.message.tradeChecklistUpdate?.network) {
        return <TradeChecklistNetworkView message={item.message} />
      }
      return null
    }

    if (item.message.message.messageType === 'APPROVE_MESSAGING') {
      return <VexlBotRequestHelp message={item.message} />
    }

    return (
      <>
        <TextMessage messageAtom={itemAtom} />
        {!!item.isLatest && <VexlBotRequestHelp message={item.message} />}
      </>
    )
  }

  if (item.type === 'vexlBot') {
    return (
      <>
        <VexlBotMessageItem data={item.data} />
      </>
    )
  }

  if (item.type === 'time')
    return (
      <Stack alignItems="center" my="$5">
        <Typography color="$foregroundTertiary" variant="micro">
          {formatChatTime(item.time)}
        </Typography>
      </Stack>
    )
  if (item.type === 'space') return <Stack h="$5" />
  return null
}

export default React.memo(MessageItem)
