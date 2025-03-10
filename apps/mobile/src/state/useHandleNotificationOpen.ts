import notifee, {EventType, type Notification} from '@notifee/react-native'
import {useNavigation} from '@react-navigation/native'
import {
  ChatNotificationData,
  NewChatMessageNoticeNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {Either, Option, Schema} from 'effect'
import {atom, useStore} from 'jotai'
import {useCallback, useEffect} from 'react'
import {isOnMessagesList, isOnSpecificChat} from '../utils/navigation'
import {
  NEW_CONTACTS_TO_SYNC,
  NEW_OFFERS_IN_MARKETPLACE,
} from '../utils/notifications/notificationTypes'
import reportError from '../utils/reportError'
import {useAppState} from '../utils/useAppState'

const lastNotificationIdHandledAtom = atom<string | undefined>(undefined)

function useReactOnNotificationOpen(): (notification: Notification) => void {
  const store = useStore()
  const navigation = useNavigation()

  return useCallback(
    (notification) => {
      if (store.get(lastNotificationIdHandledAtom) === notification.id) return
      store.set(lastNotificationIdHandledAtom, notification.id)

      if (notification.data?.type === NEW_OFFERS_IN_MARKETPLACE) {
        navigation.navigate('InsideTabs', {screen: 'Marketplace'})
      } else if (notification.data?.type === NEW_CONTACTS_TO_SYNC) {
        navigation.navigate('SetContacts', {})
      } else if (notification.data?.inbox && notification.data?.sender) {
        Schema.decodeUnknownEither(ChatNotificationData)(
          notification.data
        ).pipe(
          Either.match({
            onLeft: (l) => {
              reportError(
                'error',
                new Error('Error while opening chat from notification'),
                {l}
              )

              // as fallback navigate to messages list.
              if (!isOnMessagesList(navigation.getState())) {
                navigation.navigate('InsideTabs', {screen: 'Messages'})
              }
            },
            onRight: (payload) => {
              const keys = {
                otherSideKey: payload.sender,
                inboxKey: payload.inbox,
              }

              if (isOnSpecificChat(keys))
                // no need to navigate. We are already on the chat.
                return 'ok'

              navigation.navigate('ChatDetail', keys)
              return 'ok'
            },
          })
        )
      }

      const newChatMessageNoticeNotificationO = Schema.decodeUnknownOption(
        NewChatMessageNoticeNotificationData
      )(notification.data)
      if (Option.isSome(newChatMessageNoticeNotificationO)) {
        if (!isOnMessagesList(navigation.getState()))
          navigation.navigate('InsideTabs', {screen: 'Messages'})
      }
    },
    [navigation, store]
  )
}

export default function useHandleNotificationOpen(): void {
  const reactOnNotificationOpen = useReactOnNotificationOpen()

  useAppState(
    useCallback(
      (appState) => {
        if (appState !== 'active') return
        void (async () => {
          const initialNotification = await notifee.getInitialNotification()
          if (initialNotification)
            reactOnNotificationOpen(initialNotification.notification)
        })()
      },
      [reactOnNotificationOpen]
    )
  )
  useEffect(() => {
    return notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS && detail.notification)
        reactOnNotificationOpen(detail.notification)
    })
  }, [reactOnNotificationOpen])
}
