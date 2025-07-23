import notifee from '@notifee/react-native'
import {type NavigationState} from '@react-navigation/native'
import {type NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {effectToTask} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, Option} from 'effect/index'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import {isOnSpecificChat} from '../../utils/navigation'
import {showChatNotification} from '../../utils/notifications/chatNotifications'
import reportError, {reportErrorE} from '../../utils/reportError'
import {fetchAndStoreMessagesForInboxAtom} from '../chat/atoms/fetchNewMessagesActionAtom'
import {unreadChatsCountAtom} from '../chat/atoms/unreadChatsCountAtom'
import {loadSession} from '../session/loadSession'
import {getKeyHolderForNotificationCypherActionAtom} from './fcmCypherToKeyHolderAtom'

const processChatNotificationActionAtom = atom(
  null,
  (
    get,
    set,
    notification: NewChatMessageNoticeNotificationData,
    navigation: NavigationState<any> | undefined = undefined
  ): T.Task<boolean> => {
    console.info('📩 Refreshing inbox')

    const inbox = set(
      getKeyHolderForNotificationCypherActionAtom,
      notification.targetCypher
    )
    if (!inbox) {
      reportError(
        'warn',
        new Error(
          'Error decrypting notification FCM - unable to find private key for cypher'
        )
      )
      return T.of(false)
    }

    return pipe(
      loadSession(),
      T.chainFirst(() => {
        if (Option.isSome(notification.trackingId))
          return effectToTask(
            get(apiAtom)
              .notification.reportNotificationProcessed({
                trackingId: notification.trackingId.value,
              })
              .pipe(
                Effect.tapError((e) =>
                  reportErrorE(
                    'warn',
                    new Error('Error while sending notification processed'),
                    {
                      e,
                    }
                  )
                ),
                Effect.forkDaemon
              )
          )
        return T.of(null)
      }),
      TE.fromTask,
      TE.filterOrElseW(
        (v) => v,
        () => {
          console.info('📳 No session in storage. Skipping refreshing inbox')
          reportError(
            'warn',
            new Error(
              'Got notification but no session in storage. Skipping refreshing inbox'
            )
          )
          return 'noSession' as const
        }
      ),
      TE.chainTaskK(() =>
        set(fetchAndStoreMessagesForInboxAtom, {key: inbox.publicKeyPemBase64})
      ),
      TE.map((updates) => {
        if (!updates) return false
        const {newMessages, updatedInbox: inbox} = updates
        if (newMessages.length === 0) return false

        newMessages.forEach((newMessage) => {
          if (
            isOnSpecificChat({
              otherSideKey: newMessage.message.senderPublicKey,
              inboxKey: inbox.inbox.privateKey.publicKeyPemBase64,
            })
          )
            return
          void showChatNotification({
            newMessage,
            inbox,
            cypher: notification.targetCypher,
          })
        })

        notifee.setBadgeCount(get(unreadChatsCountAtom)).catch((e: unknown) => {
          reportError('warn', new Error('Unable to set badge count'), {e})
        })
        return true
      }),
      TE.getOrElseW(() => T.of(false))
    )
  }
)

export default processChatNotificationActionAtom
