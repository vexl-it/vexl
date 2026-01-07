import {Socket} from '@effect/platform'
import {RpcClient, RpcSerialization} from '@effect/rpc'
import {
  type NotificationStreamMessage,
  Rpcs,
} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {
  Array,
  Console,
  Effect,
  Fiber,
  Layer,
  Option,
  Schedule,
  Stream,
} from 'effect'
import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {getNotificationTokenE} from '.'
import {getApiPreset} from '../../api'
import {fetchAndStoreMessagesForInboxHandleNotificationsActionAtom} from '../../state/chat/atoms/fetchNewMessagesActionAtom'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import {processStreamOnlyNotificationActionAtom} from '../../state/chat/atoms/processStreamOnlyChatMessage'
import {getKeyHolderForNotificationTokenOrCypherActionAtom} from '../../state/notifications/fcmCypherToKeyHolderAtom'
import {platform, versionCode} from '../environment'
import {reportErrorE} from '../reportError'
import {useAppState} from '../useAppState'

const WebSocketConstructorLive = Layer.succeed(
  Socket.WebSocketConstructor,
  (url, protocol) => new WebSocket(url, protocol) as any
)

// Choose which protocol to use
const ProtocoSocketLive = RpcClient.layerProtocolSocket({
  retryTransientErrors: true,
}).pipe(
  Layer.provide([
    Socket.layerWebSocket(`${getApiPreset().notificationMs}/rpc`).pipe(
      Layer.provide(WebSocketConstructorLive)
    ),
    RpcSerialization.layerNdjson,
  ])
)

const makeClient = RpcClient.make(Rpcs)

const processMessageActionAtom = atom(
  null,
  (get, set, message: NotificationStreamMessage) =>
    Effect.gen(function* (_) {
      if (message._tag === 'DebugMessage') {
        yield* _(
          Console.debug('Received debug message from notification stream')
        )
        return
      }

      yield* _(Console.log('Received notification stream message', message))

      const cypher = message.targetCypher
      const inboxForCypher = set(
        getKeyHolderForNotificationTokenOrCypherActionAtom,
        cypher
      )
      if (!inboxForCypher) {
        yield* _(
          reportErrorE(
            'warn',
            new Error(
              'Error decrypting notification from stream - unable to find private key for cypher'
            )
          )
        )
        return
      }

      if (message._tag === 'NewChatMessageNoticeMessage') {
        yield* _(
          Console.log('📩 Processing chat message notification from stream')
        )
        yield* _(
          set(fetchAndStoreMessagesForInboxHandleNotificationsActionAtom, {
            key: inboxForCypher.publicKeyPemBase64,
          })
        )
      } else if (message._tag === 'StreamOnlyChatMessage') {
        const inbox = Array.findFirst(
          get(messagingStateAtom),
          (i) =>
            i.inbox.privateKey.publicKeyPemBase64 ===
            inboxForCypher.publicKeyPemBase64
        )
        if (Option.isNone(inbox)) {
          yield* _(
            reportErrorE(
              'warn',
              new Error(
                'WTF? Got inbox key from keyHolderForNotificaitonCypherActionAtom but no matching inbox in state'
              )
            )
          )
          return
        }

        yield* _(
          set(processStreamOnlyNotificationActionAtom, {
            message,
            inbox: inbox.value,
          })
        )
      }
    }).pipe(
      Effect.exit,
      Effect.tap((e) => {
        if (e._tag === 'Success')
          return Console.log(
            '✅ Processed notification stream message',
            JSON.stringify(message, null, 2)
          )
        return reportErrorE(
          'error',
          new Error(
            `Error processing notification stream message: ${JSON.stringify(e)}`
          ),
          {e}
        )
      })
    )
)

const startListeningToNotificationStreamActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    const notificationToken = yield* _(getNotificationTokenE())
    // We don't have a notification token, so do nothing
    if (!notificationToken) return Effect.void

    const rpc = yield* _(makeClient)
    return yield* rpc
      .listenToNotifications({
        notificationToken,
        platform,
        version: versionCode,
      })
      .pipe(
        Stream.runForEach((message) => set(processMessageActionAtom, message)),
        Effect.exit,
        Effect.tap((e) =>
          Console.log(
            'Notification stream ended. Retrying...',
            JSON.stringify(e, null, 2)
          )
        ),
        Effect.repeat({
          schedule: __DEV__
            ? Schedule.spaced(1000) // In dev retry quickly
            : Schedule.exponential(1000).pipe(Schedule.jittered), // In prod exponential backoff with jitter to prevent thundering herd
        })
      )
  }).pipe(
    Effect.scoped,
    Effect.provide(ProtocoSocketLive),
    Effect.runFork,
    (fiber) => () => {
      Effect.runFork(Fiber.interrupt(fiber))
    }
  )
)

export function useConsumeNotificationStream(): void {
  const startListeningToNotificationStream = useSetAtom(
    startListeningToNotificationStreamActionAtom
  )

  useAppState(
    useCallback(
      (appState) => {
        if (appState !== 'active') return
        return startListeningToNotificationStream()
      },
      [startListeningToNotificationStream]
    )
  )
}
