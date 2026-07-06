import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {sha256} from '@vexl-next/cryptography/src/operations/sha'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {ChatNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  AndroidNotificationPriority,
  dismissNotificationAsync,
  getPresentedNotificationsAsync,
  type Notification,
} from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {useCallback} from 'react'
import {
  type ChatMessageWithState,
  type InboxInState,
} from '../../state/chat/domain'
import {randomSeedFromChat} from '../RandomSeed'
import {translationAtom} from '../localization/I18nProvider'
import randomName from '../randomName'
import {useAppState} from '../useAppState'
import {SystemChatNotificationData} from './SystemNotificationData.brand'
import {displayLocalNotification} from './displayLocalNotification'
import {getChannelForMessages} from './notificationChannels'
import {dismissNseEnrichedNotificationsForChat} from './nseEnrichedNotifications'

async function getNotificationsForChat({
  inbox,
  sender,
}: {
  inbox: PublicKeyPemBase64
  sender: PublicKeyPemBase64
}): Promise<Notification[]> {
  const displayedNotifications = await getPresentedNotificationsAsync()

  return displayedNotifications.filter((notification) => {
    const notificationDataVerification = ChatNotificationData.parseUnkownOption(
      notification.request.content.data
    )
    if (notificationDataVerification._tag === 'None') {
      return false
    }
    const notificationData = notificationDataVerification.value

    return (
      notificationData.inbox === inbox && notificationData.sender === sender
    )
  })
}

export async function showChatNotification({
  newMessage,
  inbox,
}: {
  newMessage: ChatMessageWithState
  inbox: InboxInState
}): Promise<void> {
  if (
    (await getPresentedNotificationsAsync()).some(
      (one) => one.request.identifier === newMessage.message.uuid
    )
  ) {
    return
  }

  const type = newMessage.message.messageType
  const chat = inbox.chats.find(
    (one) => one.chat.otherSide.publicKey === newMessage.message.senderPublicKey
  )

  const userName =
    chat?.chat.otherSide.realLifeInfo?.userName ??
    (chat ? randomName(randomSeedFromChat(chat.chat)) : undefined)

  if (
    type === 'VERSION_UPDATE' ||
    type === 'FCM_CYPHER_UPDATE' ||
    type === 'OFFER_DELETED' ||
    type === 'MESSAGE_READ' ||
    // type === 'INBOX_DELETED' ||
    // type === 'CANCEL_REQUEST_MESSAGING' ||
    type === 'REQUIRES_NEWER_VERSION'
  ) {
    // DO not show notification in this case
    return
  }

  const {t} = getDefaultStore().get(translationAtom)

  const data = SystemChatNotificationData.encode(
    new SystemChatNotificationData({
      inbox: inbox.inbox.privateKey.publicKeyPemBase64,
      sender: newMessage.message.senderPublicKey,
    })
  )

  const channelId = await getChannelForMessages()

  // iOS threads notifications in the notification center by `threadIdentifier`.
  // We group per conversation (inbox + sender) to match the previous notifee
  // `threadId` behavior; all messaging requests share a single thread.
  // NOTE: notifee also rendered Android grouped/summary notifications. expo-
  // notifications has no equivalent, so Android grouping is intentionally not
  // reproduced here (tracked in https://github.com/vexl-it/vexl/issues/2515).
  const threadIdentifier =
    type === 'REQUEST_MESSAGING'
      ? 'request-group-id'
      : sha256(
          inbox.inbox.privateKey.publicKeyPemBase64 +
            newMessage.message.senderPublicKey
        )

  // The iOS notification service extension may have already presented an
  // enriched copy of the remote push for this conversation (the placeholder
  // cancellation deliberately skips enriched notifications - decision 7).
  // Replace it with the richer per-message local notification so the user
  // never sees the same message twice.
  await dismissNseEnrichedNotificationsForChat({
    inbox: inbox.inbox.privateKey.publicKeyPemBase64,
    sender: newMessage.message.senderPublicKey,
  })

  if (type === 'MESSAGE') {
    await displayLocalNotification({
      id: newMessage.message.uuid,
      channelId,
      content: {
        title:
          userName ?? t(`notifications.${type}.title`, {them: userName ?? ''}),
        body:
          newMessage.message.text ??
          t(`notifications.${type}.body`, {them: userName ?? ''}),
        data,
        priority: AndroidNotificationPriority.HIGH,
        threadIdentifier,
      },
    })
  } else {
    await displayLocalNotification({
      id: newMessage.message.uuid,
      channelId,
      content: {
        title: t(`notifications.${type}.title`, {them: userName ?? ''}),
        body: t(`notifications.${type}.body`, {them: userName ?? ''}),
        data,
        priority: AndroidNotificationPriority.HIGH,
        threadIdentifier,
      },
    })
  }
}

export async function hideNotificationsForChat(chat: Chat): Promise<void> {
  const notificationsForChat = await getNotificationsForChat({
    inbox: chat.inbox.privateKey.publicKeyPemBase64,
    sender: chat.otherSide.publicKey,
  })

  await Promise.all(
    notificationsForChat.map((one) =>
      dismissNotificationAsync(one.request.identifier)
    )
  )
}

export async function hideInactivityReminderNotifications(): Promise<void> {
  const displayedNotifications = await getPresentedNotificationsAsync()
  const inactivityReminderNotifications = displayedNotifications.filter(
    (one) => one.request.content.data?.type === 'INACTIVITY_REMINDER'
  )
  await Promise.all(
    inactivityReminderNotifications.map((one) =>
      dismissNotificationAsync(one.request.identifier)
    )
  )
}

export function useHideInnactivityReminderNotificationsOnResume(): void {
  useAppState(
    useCallback((state) => {
      if (state === 'active') void hideInactivityReminderNotifications()
    }, [])
  )
}
