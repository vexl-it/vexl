import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {ChatNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  type AndroidConversationAvatar,
  type AndroidConversationData,
  type AndroidConversationMessage,
  androidNotificationGroupData,
  decodeAndroidConversationData,
  decodeAndroidNotificationGroupData,
} from '@vexl-next/expo-android-notification-presentation/src'
import {Array, Option, pipe} from 'effect'
import {
  AndroidNotificationPriority,
  dismissNotificationAsync,
  getPresentedNotificationsAsync,
  type Notification,
} from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {useCallback} from 'react'
import {Platform} from 'react-native'
import {getOtherSideData} from '../../state/chat/atoms/selectOtherSideDataAtom'
import {
  type ChatMessageWithState,
  type InboxInState,
} from '../../state/chat/domain'
import {createOpenChatLink} from '../deepLinks/createLinks'
import {translationAtom} from '../localization/I18nProvider'
import {useAppState} from '../useAppState'
import {conversationId, toAndroidAvatar} from './conversationShortcuts'
import {displayLocalNotification} from './displayLocalNotification'
import {getChatNotificationName} from './getChatNotificationName'
import {getChannelForMessages} from './notificationChannels'
import {SystemChatNotificationData} from './SystemNotificationData.brand'

// All messaging requests share one Android group / iOS thread; everything else
// is keyed per conversation (inbox + sender).
const REQUEST_GROUP_ID = 'request-group-id'

// Android's MessagingStyle retains this many messages.
const MAX_CONVERSATION_MESSAGES = 25

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

// One notification per conversation that lists its messages. Re-posting with
// the same id replaces the previous one; earlier messages are read back from
// its data so no app state is needed.
async function showAndroidConversationNotification({
  id,
  newMessage,
  senderName,
  avatar,
  url,
  text,
  data,
  channelId,
}: {
  id: string
  newMessage: ChatMessageWithState
  senderName: string
  avatar?: AndroidConversationAvatar
  url: string
  text: string
  data: Record<string, unknown>
  channelId: string
}): Promise<void> {
  const previousMessages = pipe(
    await getPresentedNotificationsAsync(),
    Array.findFirst((one) => one.request.identifier === id),
    Option.flatMap((one) =>
      decodeAndroidConversationData(one.request.content.data)
    ),
    Option.map((one) => one.androidConversation.messages),
    Option.getOrElse((): readonly AndroidConversationMessage[] => [])
  )
  if (
    Array.some(previousMessages, (one) => one.uuid === newMessage.message.uuid)
  )
    return

  const androidConversation: AndroidConversationData = {
    androidConversation: {
      senderName,
      avatar,
      url,
      messages: pipe(
        previousMessages,
        Array.append({
          uuid: newMessage.message.uuid,
          text,
          timestamp: newMessage.message.time,
        }),
        Array.takeRight(MAX_CONVERSATION_MESSAGES)
      ),
    },
  }

  await displayLocalNotification({
    id,
    channelId,
    content: {
      title: senderName,
      body: text,
      data: {...data, ...androidConversation},
      priority: AndroidNotificationPriority.HIGH,
    },
  })
}

export async function showChatNotification({
  newMessage,
  inbox,
}: {
  newMessage: ChatMessageWithState
  inbox: InboxInState
}): Promise<void> {
  const type = newMessage.message.messageType
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

  const chat = inbox.chats.find(
    (one) => one.chat.otherSide.publicKey === newMessage.message.senderPublicKey
  )
  const otherSide = chat ? getOtherSideData(chat.chat) : undefined
  const store = getDefaultStore()
  const userName = chat ? getChatNotificationName(store.get, chat) : undefined

  const {t} = store.get(translationAtom)
  const chatData = SystemChatNotificationData.encode(
    new SystemChatNotificationData({
      inbox: inbox.inbox.privateKey.publicKeyPemBase64,
      sender: newMessage.message.senderPublicKey,
    })
  )
  const channelId = await getChannelForMessages()
  const conversation = conversationId({
    inbox: inbox.inbox.privateKey.publicKeyPemBase64,
    sender: newMessage.message.senderPublicKey,
  })

  if (type === 'MESSAGE' && Platform.OS === 'android') {
    await showAndroidConversationNotification({
      id: conversation,
      newMessage,
      senderName: userName ?? t('notifications.MESSAGE.title', {them: ''}),
      avatar: otherSide ? toAndroidAvatar(otherSide.image) : undefined,
      url: createOpenChatLink({
        inbox: inbox.inbox.privateKey.publicKeyPemBase64,
        sender: newMessage.message.senderPublicKey,
      }),
      text:
        newMessage.message.text ??
        t('notifications.MESSAGE.body', {them: userName ?? ''}),
      data: chatData,
      channelId,
    })
    return
  }

  if (
    (await getPresentedNotificationsAsync()).some(
      (one) => one.request.identifier === newMessage.message.uuid
    )
  ) {
    return
  }

  // iOS threads notifications by `threadIdentifier`; on Android only requests
  // are grouped, by the data keys read by
  // @vexl-next/expo-android-notification-presentation.
  const isRequest = type === 'REQUEST_MESSAGING'
  const groupId = isRequest ? REQUEST_GROUP_ID : conversation
  const data = {
    ...chatData,
    ...(isRequest ? androidNotificationGroupData({groupId}) : {}),
  }

  const title =
    type === 'MESSAGE'
      ? (userName ?? t('notifications.MESSAGE.title', {them: ''}))
      : isRequest && chat?.chat.origin.type === 'myNote'
        ? t('notifications.REQUEST_MESSAGING.noteTitle', {them: userName ?? ''})
        : t(`notifications.${type}.title`, {them: userName ?? ''})
  const body =
    (type === 'MESSAGE' ? newMessage.message.text : undefined) ??
    t(`notifications.${type}.body`, {them: userName ?? ''})

  await displayLocalNotification({
    id: newMessage.message.uuid,
    channelId,
    content: {
      title,
      body,
      data,
      priority: AndroidNotificationPriority.HIGH,
      threadIdentifier: groupId,
    },
  })

  if (Platform.OS !== 'android' || !isRequest) return

  await displayLocalNotification({
    id: REQUEST_GROUP_ID,
    channelId,
    content: {
      title: t('notifications.groupNotificationRequest.title'),
      subtitle: t('notifications.groupNotificationRequest.subtitle'),
      data: androidNotificationGroupData({
        groupId: REQUEST_GROUP_ID,
        isSummary: true,
      }),
    },
  })
}

export async function hideNotificationsForChat(chat: Chat): Promise<void> {
  // Includes the conversation's Android notification, which carries the same
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
