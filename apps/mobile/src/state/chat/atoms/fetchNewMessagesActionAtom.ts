import notifee from '@notifee/react-native'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type Chat,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {type NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds0,
  unixMillisecondsNow,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import retrieveMessages, {
  type ApiErrorRetrievingMessages,
} from '@vexl-next/resources-utils/src/chat/retrieveMessages'
import {type ErrorChatMessageRequiresNewerVersion} from '@vexl-next/resources-utils/src/chat/utils/parseChatMessage'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {Array, Effect, Either, pipe, Record} from 'effect/index'
import {group} from 'group-items'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {apiAtom} from '../../../api'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {version} from '../../../utils/environment'
import {isOnSpecificChat} from '../../../utils/navigation'
import {getNotificationTokenE} from '../../../utils/notifications'
import {cancelNewChatNotifications} from '../../../utils/notifications/cancelNewChatNotifications'
import {showChatNotification} from '../../../utils/notifications/chatNotifications'
import reportError from '../../../utils/reportError'
import {startMeasure} from '../../../utils/reportTime'
import {effectWithEnsuredBenchmark} from '../../ActionBenchmarks'
import {
  createSingleOfferReportedFlagFromAtomAtom,
  focusOfferByPublicKeyAtom,
  singleOfferAtom,
} from '../../marketplace/atoms/offersState'
import messagingStateAtom from '../atoms/messagingStateAtom'
import {type InboxInState} from '../domain'
import addMessagesToChats from '../utils/addMessagesToChats'
import replaceBase64UriWithImageFileUri from '../utils/replaceBase64UriWithImageFileUri'
import {type ChatMessageWithState} from './../domain'
import {sendUpdateNoticeMessageActionAtom} from './checkAndReportCurrentVersionToChatsActionAtom'
import createNewChatsFromMessagesActionAtom from './createNewChatsFromFirstMessagesActionAtom'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'
import {sendFcmCypherUpdateMessageActionAtom} from './refreshNotificationTokensActionAtom'
import {reportMessagesReceivedActionAtom} from './reportMessagesReceivedActionAtom'
import {unreadChatsCountAtom} from './unreadChatsCountAtom'

const handleOtherSideUpdatedActionAtom = atom(
  null,
  (
    get,
    set,
    {
      newMessages,
      inbox,
    }: {newMessages: readonly ChatMessageWithState[]; inbox: InboxInState}
  ) => {
    const messagesToRespondWithCurrentVersion = newMessages.filter(
      (one) =>
        one.message.messageType === 'VERSION_UPDATE' &&
        one.message.lastReceivedVersion !== version
    )

    messagesToRespondWithCurrentVersion.forEach(
      (oneMessageToRespondWithCurrentVersion) => {
        const chatAtom = focusChatByInboxKeyAndSenderKey({
          inboxKey: inbox.inbox.privateKey.publicKeyPemBase64,
          senderKey:
            oneMessageToRespondWithCurrentVersion.message.senderPublicKey,
        })
        Effect.runFork(set(sendUpdateNoticeMessageActionAtom, chatAtom))
      }
    )
  }
)

function findChatForMessage(
  message: ChatMessage,
  inbox: InboxInState
): Chat | undefined {
  return inbox.chats.find(
    (one) => one.chat.otherSide.publicKey === message.senderPublicKey
  )?.chat
}

const handleOtherSideReportedFcmCypher = atom(
  null,
  (
    get,
    set,
    {
      newMessages,
      inbox,
    }: {newMessages: readonly ChatMessageWithState[]; inbox: InboxInState}
  ) => {
    const messagesToReportNewCypherTo = pipe(
      newMessages,
      Array.filter((one) => {
        if (
          one.message.messageType !== 'FCM_CYPHER_UPDATE' &&
          // We also want to check if other side has the correct cypher when they accept messaging request
          // since there might have been a delay between sending request and approving and the token might
          // be outdated - update messages are not sent until the chat is approved by both sides
          one.message.messageType !== 'APPROVE_MESSAGING'
        )
          return false

        const chatForMessage = findChatForMessage(one.message, inbox)
        if (!chatForMessage) return false
        // only chats that have a different cypher than the one reported
        return (
          chatForMessage.lastReportedFcmToken?.cypher !==
          one.message.lastReceivedFcmCypher
        )
      }),
      Array.groupBy((one) => one.message.senderPublicKey),
      Record.values,
      Array.filterMap(Array.last)
    )

    messagesToReportNewCypherTo.forEach(
      (oneMessageToRespondWithCurrentVersion) => {
        const chat = get(
          focusChatByInboxKeyAndSenderKey({
            inboxKey: inbox.inbox.privateKey.publicKeyPemBase64,
            senderKey:
              oneMessageToRespondWithCurrentVersion.message.senderPublicKey,
          })
        )
        if (!chat) return

        void Effect.runPromise(
          Effect.gen(function* (_) {
            const notificationToken = yield* _(getNotificationTokenE())
            yield* _(
              set(
                sendFcmCypherUpdateMessageActionAtom,
                notificationToken ?? undefined
              )(chat)
            )
          })
        )
      }
    )
  }
)

function focusInboxInMessagingStateAtom(
  publicKey: PublicKeyPemBase64
): WritableAtom<
  InboxInState | undefined,
  [SetStateAction<InboxInState>],
  void
> {
  return focusAtom(messagingStateAtom, (optic) =>
    optic.find((one) => one.inbox.privateKey.publicKeyPemBase64 === publicKey)
  )
}

function splitMessagesArrayToNewChatsAndExistingChats({
  inbox,
  messages,
}: {
  readonly inbox: InboxInState
  readonly messages: readonly ChatMessageWithState[]
}): {
  messagesInNewChat: ChatMessageWithState[] | undefined
  messagesInExistingChat: ChatMessageWithState[] | undefined
} {
  return group(messages)
    .by((oneMessage) =>
      inbox.chats.some(
        (oneChat) =>
          oneMessage.message.senderPublicKey ===
          oneChat.chat.otherSide.publicKey
      )
        ? 'messagesInExistingChat'
        : 'messagesInNewChat'
    )
    .asObject()
}

function incompatibleErrorToChatMessageWithState(
  error: ErrorChatMessageRequiresNewerVersion
): ChatMessageWithState {
  return {
    message: error.message,
    state: 'receivedButRequiresNewerVersion',
  }
}

function messageToChatMessageWithState(
  message: ChatMessage
): ChatMessageWithState {
  return {
    message,
    state: 'received',
  }
}

export interface NoMessagesLeft {
  _tag: 'noMessages'
}

function refreshInboxActionAtom(
  api: ChatApi
): (
  getInbox: () => InboxInState,
  inboxOffer?: OneOfferInState
) => ActionAtomType<
  [],
  Effect.Effect<
    {updatedInbox: InboxInState; newMessages: ChatMessageWithState[]},
    ApiErrorRetrievingMessages | NoMessagesLeft
  >
> {
  return (getInbox, inboxOffer) =>
    atom(null, (get, set) =>
      Effect.gen(function* (_) {
        const retrieveResult = yield* _(
          retrieveMessages({
            api,
            currentAppVersion: version,
            inboxKeypair: getInbox().inbox.privateKey,
          })
        )

        const incompatibleMessagesError = pipe(
          retrieveResult.errors,
          Array.filter(
            (
              one
            ): one is typeof one & {
              _tag: 'ErrorChatMessageRequiresNewerVersion'
            } => one._tag === 'ErrorChatMessageRequiresNewerVersion'
          )
        )

        const otherErrors = pipe(
          retrieveResult.errors,
          Array.filter(
            (one) => one._tag !== 'ErrorChatMessageRequiresNewerVersion'
          )
        )

        if (Array.isNonEmptyArray(otherErrors)) {
          reportError('error', new Error('Error decrypting messages'), {
            otherErrors,
          })
        }

        const allMessages: ChatMessageWithState[] = [
          ...Array.map(
            incompatibleMessagesError,
            incompatibleErrorToChatMessageWithState
          ),
          ...Array.map(retrieveResult.messages, messageToChatMessageWithState),
        ]

        if (allMessages.length === 0) {
          return yield* _(Effect.fail({_tag: 'noMessages'} as const))
        }

        const newMessages: ChatMessageWithState[] = yield* _(
          Array.map(allMessages, (oneMessage) => {
            if (
              oneMessage.state !== 'receivedButRequiresNewerVersion' &&
              !oneMessage.message.image &&
              !oneMessage.message.tradeChecklistUpdate?.identity?.image
            ) {
              return Effect.succeed(oneMessage)
            }
            return replaceBase64UriWithImageFileUri(
              oneMessage,
              getInbox().inbox.privateKey.publicKeyPemBase64,
              oneMessage.message.senderPublicKey
            ).pipe(
              Effect.catchAll((error) => {
                console.error('Error processing message image:', error)
                return Effect.succeed(oneMessage)
              })
            )
          }),
          Effect.allWith({concurrency: 'unbounded'})
        )

        const {messagesInNewChat, messagesInExistingChat} =
          splitMessagesArrayToNewChatsAndExistingChats({
            inbox: getInbox(),
            messages: newMessages,
          })

        const inbox = getInbox()
        const updatedInbox: InboxInState = {
          ...inbox,
          chats: [
            ...set(
              createNewChatsFromMessagesActionAtom({
                inbox: inbox.inbox,
                inboxOffer,
              })(messagesInNewChat ?? [])
            ),
            ...addMessagesToChats(inbox.chats)(messagesInExistingChat ?? []),
          ],
        }

        return {updatedInbox, newMessages}
      })
    )
}

function deletePulledMessagesReportLeft({
  api,
  keyPair,
}: {
  api: ChatApi
  keyPair: PrivateKeyHolder
}): Effect.Effect<void> {
  return api.deletePulledMessages({keyPair}).pipe(
    Effect.match({
      onFailure: (error) => {
        reportError('error', new Error('Error deleting pulled messages'), {
          error,
        })
      },
      onSuccess: () => {},
    })
  )
}

export const fetchAndStoreMessagesForInboxAtom = atom<
  null,
  [{key: PublicKeyPemBase64}],
  Effect.Effect<
    | {updatedInbox: InboxInState; newMessages: ChatMessageWithState[]}
    | undefined
  >
>(null, (get, set, params) => {
  const {key} = params
  const api = get(apiAtom)
  const inbox = get(focusInboxInMessagingStateAtom(key))

  if (!inbox) {
    reportError(
      'warn',
      new Error('Trying to refresh an inbox but inbox does not exist'),
      {key}
    )
    return Effect.succeed(undefined)
  }

  return Effect.gen(function* (_) {
    const result = yield* _(
      set(
        refreshInboxActionAtom(api.chat)(
          () => get(focusInboxInMessagingStateAtom(key)) ?? inbox,
          get(singleOfferAtom(inbox.inbox.offerId))
        )
      ),
      Effect.either
    )

    if (Either.isLeft(result)) {
      const error = result.left

      if (error._tag === 'noMessages') {
        console.info('No new messages in inbox')
        return {updatedInbox: inbox, newMessages: []}
      }

      if (error._tag === 'InboxDoesNotExist') {
        reportError(
          'warn',
          new Error(
            'Api Error fetching messages for inbox. Trying to create the inbox again.'
          ),
          {error}
        )

        const token = yield* _(getNotificationTokenE())
        const createResult = yield* _(
          api.chat
            .createInbox({
              token: token ?? undefined,
              keyPair: inbox.inbox.privateKey,
            })
            .pipe(Effect.either)
        )

        if (Either.isLeft(createResult)) {
          reportError('error', new Error('Error recreating inbox on server'), {
            e: createResult.left,
          })
        } else {
          console.info(
            `✅ Inbox ${inbox.inbox.privateKey.publicKeyPemBase64} successfully recreated`
          )
        }

        return {updatedInbox: inbox, newMessages: []}
      }

      return {
        updatedInbox: inbox,
        newMessages: [] satisfies ChatMessageWithState[],
      }
    }

    const {newMessages, updatedInbox} = result.right

    const visibleMessagesToReport = pipe(
      newMessages,
      Array.filter(
        (one) =>
          one.state === 'received' &&
          !['FCM_CYPHER_UPDATE', 'VERSION_UPDATE'].includes(
            one.message.messageType
          )
      )
    )

    const nonVisibleMessagesToReport = pipe(
      newMessages,
      Array.filter(
        (one) =>
          one.state === 'received' &&
          ['FCM_CYPHER_UPDATE', 'VERSION_UPDATE'].includes(
            one.message.messageType
          )
      )
    )

    yield* _(
      Effect.all([
        set(
          reportMessagesReceivedActionAtom,
          Array.map(visibleMessagesToReport, (o) => o.message.uuid),
          true
        ),
        set(
          reportMessagesReceivedActionAtom,
          Array.map(nonVisibleMessagesToReport, (o) => o.message.uuid),
          false
        ),
      ]).pipe(Effect.ignore)
    )

    set(
      focusInboxInMessagingStateAtom(inbox.inbox.privateKey.publicKeyPemBase64),
      updatedInbox
    )

    pipe(
      newMessages,
      Array.filter((one) => one.message.messageType === 'BLOCK_CHAT'),
      Array.map((oneBlockMessage) => {
        set(
          createSingleOfferReportedFlagFromAtomAtom(
            focusOfferByPublicKeyAtom(oneBlockMessage.message.senderPublicKey)
          ),
          true
        )
      })
    )

    set(handleOtherSideUpdatedActionAtom, {
      newMessages,
      inbox: updatedInbox,
    })

    set(handleOtherSideReportedFcmCypher, {
      newMessages,
      inbox: updatedInbox,
    })

    yield* _(
      deletePulledMessagesReportLeft({
        api: api.chat,
        keyPair: updatedInbox.inbox.privateKey,
      })
    )

    return {updatedInbox, newMessages}
  })
})

export const fetchAndStoreMessagesForInboxHandleNotificationsActionAtom = atom<
  null,
  [
    {
      key: PublicKeyPemBase64
      triggeredByNotification?: NewChatMessageNoticeNotificationData
    },
  ],
  Effect.Effect<
    | {updatedInbox: InboxInState; newMessages: ChatMessageWithState[]}
    | undefined
  >
>(null, (get, set, {key}) =>
  Effect.gen(function* (_) {
    const updates = yield* _(
      set(fetchAndStoreMessagesForInboxAtom, {
        key,
      })
    )

    if (!updates) return undefined

    const {newMessages, updatedInbox: inbox} = updates
    if (!Array.isNonEmptyArray(newMessages)) return undefined

    Array.forEach(newMessages, (newMessage) => {
      if (
        isOnSpecificChat({
          otherSideKey: newMessage.message.senderPublicKey,
          inboxKey: inbox.inbox.privateKey.publicKeyPemBase64,
        })
      ) {
        void cancelNewChatNotifications()
        return
      }
      void showChatNotification({
        newMessage,
        inbox,
      })
    })

    notifee.setBadgeCount(get(unreadChatsCountAtom)).catch((e: unknown) => {
      reportError('warn', new Error('Unable to set badge count'), {e})
    })
    return updates
  })
)

const lastRefreshAtom = atom<UnixMilliseconds>(UnixMilliseconds0)

const fetchMessagesForAllInboxesAtom = atom(null, (get, set) => {
  return Effect.gen(function* (_) {
    const lastRefresh = get(lastRefreshAtom)

    if (unixMillisecondsNow() - lastRefresh < 120) return 'done' as const
    console.log(`Last refresh before ${unixMillisecondsNow() - lastRefresh}`)

    set(lastRefreshAtom, unixMillisecondsNow())
    const measure = startMeasure('Fetch inboxes')
    console.log('Refreshing all inboxes')

    yield* _(
      get(messagingStateAtom),
      Array.map((inbox) =>
        set(fetchAndStoreMessagesForInboxHandleNotificationsActionAtom, {
          key: inbox.inbox.privateKey.publicKeyPemBase64,
        }).pipe(Effect.either)
      ),
      Effect.allWith({concurrency: 'unbounded'}),
      effectWithEnsuredBenchmark('Fetch all inboxes')
    )

    measure()
    return 'done' as const
  })
})

export default fetchMessagesForAllInboxesAtom
