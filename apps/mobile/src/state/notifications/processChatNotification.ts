import notifee from '@notifee/react-native'
import {type NavigationState} from '@react-navigation/native'
import {type ChatNotificationData} from '@vexl-next/domain/src/general/notifications'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {isOnSpecificChat} from '../../utils/navigation'
import {showChatNotification} from '../../utils/notifications/chatNotifications'
import reportError from '../../utils/reportError'
import {fetchAndStoreMessagesForInboxAtom} from '../chat/atoms/fetchNewMessagesActionAtom'
import {unreadChatsCountAtom} from '../chat/atoms/unreadChatsCountAtom'
import {loadSession} from '../session/loadSession'

const processChatNotificationActionAtom = atom(
  null,
  (
    get,
    set,
    notification: ChatNotificationData,
    navigation: NavigationState<any> | undefined = undefined
  ): T.Task<boolean> => {
    console.info('📳 Refreshing inbox')

    return pipe(
      loadSession(),
      TE.fromTask,
      TE.filterOrElseW(
        (v) => v,
        () => {
          console.info('📳 No session in storage. Skipping refreshing inbox')
          return 'noSession' as const
        }
      ),
      TE.chainTaskK(() =>
        set(fetchAndStoreMessagesForInboxAtom, {key: notification.inbox})
      ),
      TE.map((updates) => {
        if (!updates) return false
        const {newMessages, updatedInbox: inbox} = updates
        if (newMessages.length === 0) return false

        newMessages.forEach((newMessage) => {
          if (
            navigation &&
            isOnSpecificChat(navigation, {
              otherSideKey: notification.sender,
              inboxKey: notification.inbox,
            })
          )
            return
          void showChatNotification({newMessage, inbox})
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
