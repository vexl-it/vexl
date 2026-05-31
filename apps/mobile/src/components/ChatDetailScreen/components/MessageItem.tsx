import {DotTypingIndicator, Rejected, Typography, useTheme} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, type Atom} from 'jotai'
import React, {useMemo} from 'react'
import {Stack, XStack} from 'tamagui'
import {createIsOtherSideTypingAtom} from '../../../state/chat/atoms/typingIndication'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import UserAvatar from '../../UserAvatar'
import {chatMolecule} from '../atoms'
import {type MessagesListItem} from '../utils/buildMessagesListData'
import formatChatTime from '../utils/formatChatTime'
import {BigImageMessage} from './BigImageMessage'
import ContactRevealMessageItem from './ContactRevealMessageItem'
import {DisapproveMessagingMessage} from './DisapproveMessagingMessage'
import IdentityRevealMessageItem from './IdentityRevealMessageItem'
import {LastMessageTime} from './LastMessageTime'
import MessageIncompatibleItem from './MessageIncompatibleItem'
import {OtherSideLeftVexlBot} from './OtherSideLeftVexlBot'
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
  const locale = useAtomValue(formattingLocaleAtom)
  const theme = useTheme()
  const {
    chatAtom,
    otherSideDataAtom,
    otherSideSupportsTradingChecklistAtom,
    chatStateAtom,
  } = useMolecule(chatMolecule)
  const {t} = useTranslation()
  const chatState = useAtomValue(chatStateAtom)
  const chat = useAtomValue(chatAtom)
  const {image} = useAtomValue(otherSideDataAtom)
  const otherSideSupportsTradingChecklist = useAtomValue(
    otherSideSupportsTradingChecklistAtom
  )
  const otherSideName =
    chat.otherSide.realLifeInfo?.userName ?? t('common.otherSide')

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
        <BigImageMessage
          title={t('messages.messagePreviews.incoming.INBOX_DELETED', {
            them: t('common.otherSide'),
          })}
          image={
            <Stack
              width={80}
              height={80}
              backgroundColor="$redBackground"
              alignItems="center"
              justifyContent="center"
              borderRadius="$4"
            >
              <Rejected size={35} color={theme.redForeground.get()} />
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
          <BigImageMessage
            title={t(`messages.messagePreviews.${direction}.DELETE_CHAT`, {
              them: otherSideName,
            })}
            description={
              chatState === 'requestedByMe' || chatState === 'requestedByThem'
                ? t('messages.youHaveChattedWithThisPartyBefore')
                : undefined
            }
            image={
              <UserAvatar
                height={56}
                width={56}
                userImage={image}
                grayScale={true}
              />
            }
          />
          {direction === 'incoming' && <OtherSideLeftVexlBot />}
        </>
      )
    }

    if (item.message.message.messageType === 'BLOCK_CHAT')
      return (
        <>
          <BigImageMessage
            title={t(`messages.messagePreviews.${direction}.BLOCK_CHAT`, {
              them: t('common.otherSide'),
            })}
            image={
              <UserAvatar
                height={56}
                width={56}
                userImage={image}
                grayScale={true}
              />
            }
          />
          <LastMessageTime message={item.message} />
        </>
      )

    if (item.message.message.messageType === 'INBOX_DELETED')
      return (
        <>
          <BigImageMessage
            title={t(`messages.messagePreviews.${direction}.INBOX_DELETED`, {
              them: t('common.otherSide'),
            })}
            image={
              <UserAvatar
                height={80}
                width={80}
                userImage={image}
                grayScale={true}
              />
            }
          />
          <LastMessageTime message={item.message} />
        </>
      )

    if (
      item.message.message.messageType === 'REQUEST_REVEAL' ||
      item.message.message.messageType === 'APPROVE_REVEAL' ||
      item.message.message.messageType === 'DISAPPROVE_REVEAL' ||
      (item.message.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
        item.message.message.tradeChecklistUpdate?.identity)
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
      return (
        <>
          <VexlBotRequestHelp message={item.message} />
          {!!item.isLatest && <LastMessageTime message={item.message} />}
        </>
      )
    }

    if (item.message.message.messageType === 'CANCEL_REQUEST_MESSAGING') {
      return (
        <>
          <BigImageMessage
            title={t('messages.otherPartyCanceled')}
            image={
              <UserAvatar
                height={56}
                width={56}
                userImage={image}
                grayScale={true}
              />
            }
          />
          <LastMessageTime message={item.message} />
        </>
      )
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
          {formatChatTime(item.time, locale)}
        </Typography>
      </Stack>
    )
  if (item.type === 'space') return <Stack h="$5" />
  return null
}

export default React.memo(MessageItem)
