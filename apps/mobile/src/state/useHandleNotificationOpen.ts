import {
  ChatNotificationData,
  NewChatMessageNoticeNotificationData,
  OpenBrowserLinkNotificationData,
  VexlProductNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {Effect, Either, Option, Schema} from 'effect'
import * as Notifications from 'expo-notifications'
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
  MARKETPLACE_READY,
  NEW_CONTACTS_TO_SYNC,
  NEW_OFFERS_IN_MARKETPLACE,
} from '../utils/notifications/notificationTypes'
import {TradeReminderNotificationData} from '../utils/notifications/tradeReminderNotificationData'
import reportError from '../utils/reportError'
import {useAppState} from '../utils/useAppState'

const lastHandledExpoNotificationDateAtom = atom<number | undefined>(undefined)

const reactOnNotificationOpenAtom = atom(
  null,
  (get, set, response: Notifications.NotificationResponse) =>
    Effect.gen(function* (_) {
      const notificationDate = response.notification.date

      // Prevent re-navigation on app resume.
      // Notifications.getLastNotificationResponse() returns the last opened
      // notification every time until the app is killed.
      if (get(lastHandledExpoNotificationDateAtom) === notificationDate) return
      set(lastHandledExpoNotificationDateAtom, notificationDate)

      const data = response.notification.request.content.data

      const vexlProductNotificationO = Schema.decodeUnknownOption(
        VexlProductNotificationData
      )(data)

      if (Option.isSome(vexlProductNotificationO) && navigationRef.isReady()) {
        navigationRef.navigate('Notifications')
        return
      }

      const knownNotificationDataO = Schema.decodeUnknownOption(
        Schema.Union(
          OpenBrowserLinkNotificationData,
          ClubAdmissionInternalNotificationData,
          TradeReminderNotificationData
        )
      )(data)

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
      } else if (
        Option.isSome(knownNotificationDataO) &&
        Schema.is(TradeReminderNotificationData)(
          knownNotificationDataO.value
        ) &&
        navigationRef.isReady()
      ) {
        const tradeReminderData = knownNotificationDataO.value

        console.log('[TradeReminder] Notification pressed, opening chat', {
          inbox: tradeReminderData.inbox,
          sender: tradeReminderData.sender,
        })

        const keys = {
          otherSideKey: tradeReminderData.sender,
          inboxKey: tradeReminderData.inbox,
        }

        if (isOnSpecificChat(keys)) {
          console.log(
            '[TradeReminder] Already on this chat, no navigation needed'
          )
        } else {
          console.log('[TradeReminder] Navigating to ChatDetail', keys)
          navigationRef.navigate('ChatDetail', keys)
        }
      } else if (
        data?.type === NEW_OFFERS_IN_MARKETPLACE ||
        data?.type === MARKETPLACE_READY
      ) {
        navigationRef.navigate('InsideTabs', {screen: 'Marketplace'})
      } else if (data?.type === NEW_CONTACTS_TO_SYNC) {
        navigationRef.navigate('ContactPreferences', {})
      } else if (data?.inbox && data?.sender) {
        Schema.decodeUnknownEither(ChatNotificationData)(data).pipe(
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
      )(data)
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
          const lastResponse = Notifications.getLastNotificationResponse()

          if (lastResponse) {
            await Effect.runPromise(reactOnNotificationOpen(lastResponse))
          }
        })()
      },
      [reactOnNotificationOpen]
    )
  )

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        Effect.runFork(reactOnNotificationOpen(response))
      }
    )
    return (): void => {
      subscription.remove()
    }
  }, [reactOnNotificationOpen])
}
