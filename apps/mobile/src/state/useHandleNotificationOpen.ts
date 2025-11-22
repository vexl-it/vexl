import notifee, {EventType, type Notification} from '@notifee/react-native'
import {
  ChatNotificationData,
  NewChatMessageNoticeNotificationData,
  OpenBrowserLinkNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {Effect, Either, Option, Schema} from 'effect'
import {atom, useSetAtom} from 'jotai'
import {useCallback, useEffect} from 'react'
import {Linking} from 'react-native'
import {
  isOnMessagesList,
  isOnSpecificChat,
  navigationRef,
} from '../utils/navigation'
import {ClubAdmissionInternalNotificationData} from '../utils/notifications/clubNotifications'
import {
  NEW_CONTACTS_TO_SYNC,
  NEW_OFFERS_IN_MARKETPLACE,
} from '../utils/notifications/notificationTypes'
import reportError from '../utils/reportError'
import {useAppState} from '../utils/useAppState'

const lastNotificationIdHandledAtom = atom<string | undefined>(undefined)

const reactOnNotificationOpenAtom = atom(
  null,
  (get, set, notification: Notification) =>
    Effect.gen(function* (_) {
      if (get(lastNotificationIdHandledAtom) === notification.id) return
      set(lastNotificationIdHandledAtom, notification.id)

      const knownNotificationDataO = Schema.decodeUnknownOption(
        Schema.Union(
          OpenBrowserLinkNotificationData,
          ClubAdmissionInternalNotificationData
        )
      )(notification.data)

      if (
        Option.isSome(knownNotificationDataO) &&
        Schema.is(OpenBrowserLinkNotificationData)(knownNotificationDataO.value)
      ) {
        void Linking.openURL(knownNotificationDataO.value.url)
      } else if (
        Option.isSome(knownNotificationDataO) &&
        Schema.is(ClubAdmissionInternalNotificationData)(
          knownNotificationDataO.value
        ) &&
        navigationRef.isReady()
      ) {
        navigationRef.navigate('ClubDetail', {
          clubUuid: knownNotificationDataO.value.clubUuid,
        })
      } else if (notification.data?.type === NEW_OFFERS_IN_MARKETPLACE) {
        navigationRef.navigate('InsideTabs', {screen: 'Marketplace'})
      } else if (notification.data?.type === NEW_CONTACTS_TO_SYNC) {
        navigationRef.navigate('SetContacts', {})
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
              if (!isOnMessagesList(navigationRef.getState())) {
                navigationRef.navigate('InsideTabs', {screen: 'Messages'})
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

              navigationRef.navigate('ChatDetail', keys)
              return 'ok'
            },
          })
        )
      }

      const newChatMessageNoticeNotificationO = Schema.decodeUnknownOption(
        NewChatMessageNoticeNotificationData
      )(notification.data)
      if (
        Option.isSome(newChatMessageNoticeNotificationO) &&
        navigationRef.isReady()
      ) {
        if (!isOnMessagesList(navigationRef.getState()))
          navigationRef.navigate('InsideTabs', {screen: 'Messages'})
      }
    })
)

export default function useHandleNotificationOpen(): void {
  const reactOnNotificationOpen = useSetAtom(reactOnNotificationOpenAtom)

  useAppState(
    useCallback(
      (appState) => {
        if (appState !== 'active') return
        void (async () => {
          const initialNotification = await notifee.getInitialNotification()
          if (initialNotification)
            await Effect.runPromise(
              reactOnNotificationOpen(initialNotification.notification)
            )
        })()
      },
      [reactOnNotificationOpen]
    )
  )
  useEffect(() => {
    return notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS && detail.notification)
        Effect.runFork(reactOnNotificationOpen(detail.notification))
    })
  }, [reactOnNotificationOpen])
}
