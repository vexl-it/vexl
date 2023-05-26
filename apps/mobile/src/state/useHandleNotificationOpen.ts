import {useCallback, useEffect} from 'react'
import notifee, {EventType, type Notification} from '@notifee/react-native'
import {useAppState} from '../utils/useAppState'
import {atom, useStore} from 'jotai'
import {useNavigation} from '@react-navigation/native'
import {pipe} from 'fp-ts/function'
import {z} from 'zod'
import * as E from 'fp-ts/Either'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {safeParse} from '../utils/fpUtils'
import selectChatByInboxKeyAndSenderKey from './chat/atoms/selectChatByInboxKeyAndSenderKey'
import reportError from '../utils/reportError'
import {type NavigationState} from 'react-native-tab-view'
import {type ChatId} from '@vexl-next/domain/dist/general/messaging'

const lastNotificationIdHandledAtom = atom<string | undefined>(undefined)

const MessageNotificationPayload = z.object({
  inbox: PublicKeyPemBase64,
  sender: PublicKeyPemBase64,
})

// TODO how to type this properly?
function getActiveRoute(route: NavigationState<any>): any {
  if (
    !route.routes ||
    route.routes.length === 0 ||
    route.index >= route.routes.length
  ) {
    return route
  }

  const childActiveRoute = route.routes[route.index] as NavigationState<any>
  return getActiveRoute(childActiveRoute)
}

function isOnSpecificChat(
  state: NavigationState<any>,
  chatId: ChatId
): boolean {
  const activeRoute = getActiveRoute(state)
  return (
    activeRoute.name === 'ChatDetail' && activeRoute.params?.chatId === chatId
  )
}

function isOnMessagesList(state: NavigationState<any>): boolean {
  const activeRoute = getActiveRoute(state)
  return activeRoute.name === 'Messages'
}

function useReactOnNotificationOpen(): (notification: Notification) => void {
  const store = useStore()
  const navigation = useNavigation()

  return useCallback(
    (notification) => {
      if (store.get(lastNotificationIdHandledAtom) === notification.id) return
      store.set(lastNotificationIdHandledAtom, notification.id)

      if (notification.data?.inbox && notification.data?.sender) {
        pipe(
          notification.data,
          safeParse(MessageNotificationPayload),
          E.chainNullableK({_tag: 'chatNotFound'})((payload) =>
            store.get(
              selectChatByInboxKeyAndSenderKey({
                inboxKey: payload.inbox,
                senderKey: payload.sender,
              })
            )
          ),
          E.match(
            (l) => {
              if (l._tag !== 'chatNotFound')
                // This is to be expected
                reportError(
                  'error',
                  'Error while opening chat from notification',
                  l
                )

              // as fallback navigate to messages list.
              if (!isOnMessagesList(navigation.getState())) {
                navigation.navigate('InsideTabs', {screen: 'Messages'})
              }
            },
            (payload) => {
              if (isOnSpecificChat(navigation.getState(), payload.chat.id))
                return 'ok'
              navigation.navigate('ChatDetail', {
                inboxKey: payload.chat.inbox.privateKey.publicKeyPemBase64,
                chatId: payload.chat.id,
              })

              return 'ok'
            }
          )
        )
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
