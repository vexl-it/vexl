import notifee, {
  AndroidGroupAlertBehavior,
  type DisplayedNotification,
} from '@notifee/react-native'
import {type FirebaseMessagingTypes} from '@react-native-firebase/messaging'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {sha256} from '@vexl-next/cryptography/src/operations/sha'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {getDefaultStore} from 'jotai'
import {useCallback} from 'react'
import decodeNotificationPreviewAction from '../../state/chat/atoms/decodeChatNotificationPreviewActionAtom'
import {translationAtom} from '../localization/I18nProvider'
import notEmpty from '../notEmpty'
import reportError from '../reportError'
import {useAppState} from '../useAppState'
import {ChatNotificationData} from './ChatNotificationData'
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
    const notificationDataVerification = ChatNotificationData.safeParse(
      notification.notification.data
    )
    if (!notificationDataVerification.success) {
      return false
    }

    return notificationDataVerification.data.type === 'REQUEST_MESSAGING'
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
    const notificationDataVerification = ChatNotificationData.safeParse(
      notification.notification.data
    )
    if (!notificationDataVerification.success) {
      return false
    }
    const notificationData = notificationDataVerification.data

    return (
      notificationData.inbox === inbox && notificationData.sender === sender
    )
  })
}

export async function showChatNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  const notificationDataVerification = ChatNotificationData.safeParse(
    remoteMessage.data
  )
  if (!notificationDataVerification.success) {
    reportError(
      'warn',
      new Error('Unable to parse notification data for chat notification'),
      {remoteMessage}
    )
    return
  }

  const notificationData = notificationDataVerification.data
  if (notificationData.type === 'VERSION_UPDATE') {
    // DO not show notification in this case
    return
  }
  if (notificationData.type === 'CANCEL_REQUEST_MESSAGING') return // No message displayed in this case

  const {t} = getDefaultStore().get(translationAtom)

  const decodedPreview = await getDefaultStore().set(
    decodeNotificationPreviewAction,
    notificationData
  )()

  const groupId =
    notificationData.type === 'REQUEST_MESSAGING'
      ? REQUEST_GROUP_ID
      : generateGroupId(notificationData)

  await notifee.displayNotification({
    title:
      decodedPreview?.name ?? t(`notifications.${notificationData.type}.title`),
    body:
      decodedPreview?.text ?? t(`notifications.${notificationData.type}.body`),
    data: remoteMessage.data,
    android: {
      groupId,
      channelId: await getChannelForMessages(),
      pressAction: {
        id: 'default',
      },
    },
  })

  if (notificationData.type === 'REQUEST_MESSAGING') {
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
      data: remoteMessage.data,
      subtitle: t('notifications.groupNotificationChat.subtitle', {
        userName: decodedPreview?.name ?? '[unknown]',
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
