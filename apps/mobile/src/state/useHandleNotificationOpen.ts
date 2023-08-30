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
import focusChatByInboxKeyAndSenderKey from './chat/atoms/focusChatByInboxKeyAndSenderKey'
import reportError from '../utils/reportError'
import {isOnMessagesList, isOnSpecificChat} from '../utils/navigation'

const lastNotificationIdHandledAtom = atom<string | undefined>(undefined)

const MessageNotificationPayload = z.object({
  inbox: PublicKeyPemBase64,
  sender: PublicKeyPemBase64,
})

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
              focusChatByInboxKeyAndSenderKey({
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
