import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {sha256} from '@vexl-next/cryptography/src/operations/sha'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {ChatNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  androidNotificationGroupData,
  decodeAndroidNotificationGroupData,
} from '@vexl-next/expo-android-notification-groups/src'
import {Option} from 'effect'
import {
  AndroidNotificationPriority,
  dismissNotificationAsync,
  getPresentedNotificationsAsync,
  type Notification,
} from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {useCallback} from 'react'
import {Platform} from 'react-native'
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

// All messaging requests share one group; everything else is grouped per
// conversation (inbox + sender).
const REQUEST_GROUP_ID = 'request-group-id'

function chatGroupId({
  inbox,
  sender,
}: {
  inbox: PublicKeyPemBase64
  sender: PublicKeyPemBase64
}): string {
  return sha256(inbox + sender)
}

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

// Android keeps a group summary around after the app cancels its children, so
// once the group is empty the summary has to be dismissed explicitly.
async function dismissAndroidGroupSummaryIfEmpty(
  groupId: string
): Promise<void> {
  if (Platform.OS !== 'android') return

  const hasChildren = (await getPresentedNotificationsAsync()).some((one) =>
    Option.exists(
      decodeAndroidNotificationGroupData(one.request.content.data),
      (group) => group.androidGroupId === groupId && !group.androidGroupSummary
    )
  )
  if (!hasChildren) await dismissNotificationAsync(groupId)
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
  const chatData = SystemChatNotificationData.encode(
    new SystemChatNotificationData({
      inbox: inbox.inbox.privateKey.publicKeyPemBase64,
      sender: newMessage.message.senderPublicKey,
    })
  )

  const channelId = await getChannelForMessages()

  // iOS threads notifications by `threadIdentifier`; Android groups them by
  // the data keys read by @vexl-next/expo-android-notification-groups.
  const groupId =
    type === 'REQUEST_MESSAGING'
      ? REQUEST_GROUP_ID
      : chatGroupId({
          inbox: inbox.inbox.privateKey.publicKeyPemBase64,
          sender: newMessage.message.senderPublicKey,
        })
  const data = {...chatData, ...androidNotificationGroupData({groupId})}

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
        threadIdentifier: groupId,
      },
    })
  } else {
    const notificationTitle =
      type === 'REQUEST_MESSAGING' && chat?.chat.origin.type === 'myNote'
        ? t(`notifications.${type}.noteTitle`, {
            them: userName ?? '',
          })
        : t(`notifications.${type}.title`, {them: userName ?? ''})

    await displayLocalNotification({
      id: newMessage.message.uuid,
      channelId,
      content: {
        title: notificationTitle,
        body: t(`notifications.${type}.body`, {them: userName ?? ''}),
        data,
        priority: AndroidNotificationPriority.HIGH,
        threadIdentifier: groupId,
      },
    })
  }

  if (Platform.OS !== 'android') return

  const summaryData = androidNotificationGroupData({groupId, isSummary: true})
  await displayLocalNotification({
    id: groupId,
    channelId,
    content:
      type === 'REQUEST_MESSAGING'
        ? {
            title: t('notifications.groupNotificationRequest.title'),
            subtitle: t('notifications.groupNotificationRequest.subtitle'),
            data: summaryData,
          }
        : {
            subtitle: t('notifications.groupNotificationChat.subtitle', {
              userName: userName ?? '[unknown]',
            }),
            data: {...chatData, ...summaryData},
          },
  })
}

export async function hideNotificationsForChat(chat: Chat): Promise<void> {
  // Includes the conversation's Android group summary, which carries the same
  // chat data so tapping it opens the chat.
  const notificationsForChat = await getNotificationsForChat({
    inbox: chat.inbox.privateKey.publicKeyPemBase64,
    sender: chat.otherSide.publicKey,
  })

  await Promise.all(
    notificationsForChat.map((one) =>
      dismissNotificationAsync(one.request.identifier)
    )
  )

  await dismissAndroidGroupSummaryIfEmpty(REQUEST_GROUP_ID)
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
