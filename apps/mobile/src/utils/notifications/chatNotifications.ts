import notifee, {
  AndroidGroupAlertBehavior,
  AndroidImportance,
  type DisplayedNotification,
} from '@notifee/react-native'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {sha256} from '@vexl-next/cryptography/src/operations/sha'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {ChatNotificationData} from '@vexl-next/domain/src/general/notifications'
import {getDefaultStore} from 'jotai'
import {useCallback} from 'react'
import {Platform} from 'react-native'
import {
  type ChatMessageWithState,
  type InboxInState,
} from '../../state/chat/domain'
import {randomSeedFromChat} from '../RandomSeed'
import {translationAtom} from '../localization/I18nProvider'
import notEmpty from '../notEmpty'
import randomName from '../randomName'
import {useAppState} from '../useAppState'
import {SystemChatNotificationData} from './SystemNotificationData.brand'
import {cancelNewChatNotifications} from './cancelNewChatNotifications'
import {getChannelForMessages} from './notificationChannels'

function generateGroupId(chat: {
  inbox: PublicKeyPemBase64
  sender: PublicKeyPemBase64
}): string {
  return sha256(chat.inbox + chat.sender)
}

const REQUEST_GROUP_ID = 'request-group-id'

async function getRequestNotifications(): Promise<DisplayedNotification[]> {
  const displayedNotifications = await notifee.getDisplayedNotifications()
  return displayedNotifications.filter((notification) => {
    const notificationDataVerification = ChatNotificationData.parseUnkownOption(
      notification.notification.data
    )
    if (notificationDataVerification._tag === 'None') {
      return false
    }

    return notificationDataVerification.value.type === 'REQUEST_MESSAGING'
  })
}

async function getNotificationsForChat({
  inbox,
  sender,
}: {
  inbox: PublicKeyPemBase64
  sender: PublicKeyPemBase64
}): Promise<DisplayedNotification[]> {
  const displayedNotifications = await notifee.getDisplayedNotifications()

  return displayedNotifications.filter((notification) => {
    const notificationDataVerification = ChatNotificationData.parseUnkownOption(
      notification.notification.data
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
  await cancelNewChatNotifications()

  if (
    (await notifee.getDisplayedNotifications()).some(
      (one) => one.id === newMessage.message.uuid
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
    // type === 'INBOX_DELETED' ||
    // type === 'CANCEL_REQUEST_MESSAGING' ||
    type === 'REQUIRES_NEWER_VERSION'
  ) {
    // DO not show notification in this case
    return
  }

  const {t} = getDefaultStore().get(translationAtom)

  const groupId =
    type === 'REQUEST_MESSAGING'
      ? REQUEST_GROUP_ID
      : generateGroupId({
          inbox: inbox.inbox.privateKey.publicKeyPemBase64,
          sender: newMessage.message.senderPublicKey,
        })

  if (type === 'MESSAGE') {
    await notifee.displayNotification({
      id: newMessage.message.uuid,
      title:
        userName ?? t(`notifications.${type}.title`, {them: userName ?? ''}),
      body:
        newMessage.message.text ??
        t(`notifications.${type}.body`, {them: userName ?? ''}),
      data: SystemChatNotificationData.encode(
        new SystemChatNotificationData({
          inbox: inbox.inbox.privateKey.publicKeyPemBase64,
          sender: newMessage.message.senderPublicKey,
        })
      ),
      ios: {
        threadId: groupId,
      },
      android: {
        groupId,
        importance: AndroidImportance.HIGH,
        lightUpScreen: true,
        groupAlertBehavior: AndroidGroupAlertBehavior.CHILDREN,
        channelId: await getChannelForMessages(),
        pressAction: {
          id: 'default',
        },
      },
    })
  } else {
    await notifee.displayNotification({
      id: newMessage.message.uuid,
      title: t(`notifications.${type}.title`, {them: userName ?? ''}),
      body: t(`notifications.${type}.body`, {them: userName ?? ''}),
      data: SystemChatNotificationData.encode(
        new SystemChatNotificationData({
          inbox: inbox.inbox.privateKey.publicKeyPemBase64,
          sender: newMessage.message.senderPublicKey,
        })
      ),
      ios: {
        threadId: groupId,
      },
      android: {
        groupId,
        groupAlertBehavior: AndroidGroupAlertBehavior.CHILDREN,
        lightUpScreen: true,
        importance: AndroidImportance.HIGH,
        channelId: await getChannelForMessages(),
        pressAction: {
          id: 'default',
        },
      },
    })
  }

  if (Platform.OS === 'android') {
    if (type === 'REQUEST_MESSAGING') {
      await notifee.displayNotification({
        id: groupId,
        title: t('notifications.groupNotificationRequest.title'),
        subtitle: t('notifications.groupNotificationRequest.subtitle'),
        android: {
          groupAlertBehavior: AndroidGroupAlertBehavior.CHILDREN,
          channelId: await getChannelForMessages(),
          groupId,
          groupSummary: true,
          pressAction: {
            id: 'default',
          },
        },
      })
    } else {
      await notifee.displayNotification({
        id: groupId,
        data: SystemChatNotificationData.encode(
          new SystemChatNotificationData({
            inbox: inbox.inbox.privateKey.publicKeyPemBase64,
            sender: newMessage.message.senderPublicKey,
          })
        ),
        subtitle: t('notifications.groupNotificationChat.subtitle', {
          userName: userName ?? '[unknown]',
        }),
        android: {
          groupAlertBehavior: AndroidGroupAlertBehavior.CHILDREN,
          channelId: await getChannelForMessages(),
          groupId,
          groupSummary: true,
          pressAction: {
            id: 'default',
          },
        },
      })
    }
  }
}

export async function hideNotificationsForChat(chat: Chat): Promise<void> {
  const notificationsForChat = await getNotificationsForChat({
    inbox: chat.inbox.privateKey.publicKeyPemBase64,
    sender: chat.otherSide.publicKey,
  })

  await notifee.cancelDisplayedNotifications([
    ...notificationsForChat.map((one) => one.id).filter(notEmpty),
    generateGroupId({
      inbox: chat.inbox.privateKey.publicKeyPemBase64,
      sender: chat.otherSide.publicKey,
    }),
  ])

  const haveRequestNotifications = (await getRequestNotifications()).length > 0
  if (!haveRequestNotifications) {
    await notifee.cancelDisplayedNotifications([REQUEST_GROUP_ID])
  }
}

export async function hideInactivityReminderNotifications(): Promise<void> {
  const displayedNotifications = await notifee.getDisplayedNotifications()
  const inactivityReminderNotifications = displayedNotifications.filter(
    (one) => one.notification?.data?.type === 'INACTIVITY_REMINDER'
  )
  await notifee.cancelDisplayedNotifications(
    inactivityReminderNotifications.map((one) => one.id).filter(notEmpty)
  )
}

export function useHideInnactivityReminderNotificationsOnResume(): void {
  useAppState(
    useCallback((state) => {
      if (state === 'active') void hideInactivityReminderNotifications()
    }, [])
  )
}
