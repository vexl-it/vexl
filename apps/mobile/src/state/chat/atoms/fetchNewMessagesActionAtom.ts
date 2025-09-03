import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type Chat,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
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
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {Array, Effect} from 'effect/index'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {group} from 'group-items'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {apiAtom} from '../../../api'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {version} from '../../../utils/environment'
import {getNotificationToken} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import {startMeasure} from '../../../utils/reportTime'
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
import {checkAndDeleteOldChatsAndDataActionAtom} from './checkAndDeleteOldChatsAndDataActionAtom'
import {sendUpdateNoticeMessageActionAtom} from './checkAndReportCurrentVersionToChatsActionAtom'
import createNewChatsFromMessagesActionAtom from './createNewChatsFromFirstMessagesActionAtom'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'
import {sendFcmCypherUpdateMessageActionAtom} from './refreshNotificationTokensActionAtom'
import {reportMessagesReceivedActionAtom} from './reportMessagesReceivedActionAtom'

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
        void set(sendUpdateNoticeMessageActionAtom, chatAtom)()
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
    const messagesToReportNewCypherTo = newMessages.filter((one) => {
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
    })

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

        void pipe(
          getNotificationToken(),
          T.chain((notificationToken) =>
            set(
              sendFcmCypherUpdateMessageActionAtom,
              notificationToken ?? undefined
            )(chat)
          )
        )()
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
  TE.TaskEither<
    ApiErrorRetrievingMessages | NoMessagesLeft,
    {updatedInbox: InboxInState; newMessages: readonly ChatMessageWithState[]}
  >
> {
  return (getInbox, inboxOffer) =>
    atom(null, (get, set) =>
      pipe(
        effectToTaskEither(
          retrieveMessages({
            api,
            currentAppVersion: version,
            inboxKeypair: getInbox().inbox.privateKey,
          })
        ),
        TE.map((one) => {
          const incompatibleMessagesError = one.errors.filter(
            (
              one
            ): one is typeof one & {
              _tag: 'ErrorChatMessageRequiresNewerVersion'
            } => one._tag === 'ErrorChatMessageRequiresNewerVersion'
          )
          const otherErrors = one.errors.filter(
            (one) => one._tag !== 'ErrorChatMessageRequiresNewerVersion'
          )

          if (otherErrors.length > 0) {
            reportError('error', new Error('Error decrypting messages'), {
              otherErrors,
            })
          }

          return [
            ...incompatibleMessagesError.map(
              incompatibleErrorToChatMessageWithState
            ),
            ...one.messages.map(messageToChatMessageWithState),
          ]
        }),
        TE.filterOrElseW(
          (messages) => messages.length > 0,
          () => 'noMessages' as const
        ),
        TE.chainW(
          flow(
            A.map((oneMessage): T.Task<ChatMessageWithState> => {
              if (
                oneMessage.state !== 'receivedButRequiresNewerVersion' &&
                !oneMessage.message.image &&
                !oneMessage.message.tradeChecklistUpdate?.identity?.image
              )
                return T.of(oneMessage)
              return replaceBase64UriWithImageFileUri(
                oneMessage,
                getInbox().inbox.privateKey.publicKeyPemBase64,
                oneMessage.message.senderPublicKey
              )
            }),
            T.sequenceArray,
            TE.fromTask
          )
        ),
        TE.bindTo('newMessages'),
        TE.bindW('updatedInbox', ({newMessages}) =>
          pipe(
            TE.right(newMessages),
            TE.map((newMessages) =>
              splitMessagesArrayToNewChatsAndExistingChats({
                inbox: getInbox(),
                messages: newMessages,
              })
            ),
            TE.map(({messagesInNewChat, messagesInExistingChat}) => {
              const inbox = getInbox()
              return {
                ...getInbox(),
                chats: [
                  ...set(
                    createNewChatsFromMessagesActionAtom({
                      inbox: inbox.inbox,
                      inboxOffer,
                    })(messagesInNewChat ?? [])
                  ),
                  ...addMessagesToChats(inbox.chats)(
                    messagesInExistingChat ?? []
                  ),
                ],
              }
            })
          )
        ),
        TE.match(
          (e) => {
            if (e === 'noMessages') {
              return E.left({_tag: 'noMessages'} as const)
            }
            return E.left(e)
          },
          (right) => E.right(right)
        )
      )
    )
}

function deletePulledMessagesReportLeft({
  api,
  keyPair,
}: {
  api: ChatApi
  keyPair: PrivateKeyHolder
}): T.Task<void> {
  return pipe(
    effectToTaskEither(api.deletePulledMessages({keyPair})),
    TE.match(
      (error) => {
        reportError('error', new Error('Error deleting pulled messages'), {
          error,
        })
      },
      () => {}
    )
  )
}

export const fetchAndStoreMessagesForInboxAtom = atom<
  null,
  [{key: PublicKeyPemBase64}],
  T.Task<
    | {updatedInbox: InboxInState; newMessages: readonly ChatMessageWithState[]}
    | undefined
  >
>(null, (get, set, params) => {
  const {key} = params
  const api = get(apiAtom)
  const inbox = get(focusInboxInMessagingStateAtom(key))

  if (!inbox) {
    reportError(
      'warn',
      new Error('Trying to refresh an inbox but inbox does not exist')
    )
    return T.of(undefined)
  }

  return pipe(
    set(
      refreshInboxActionAtom(api.chat)(
        () => get(focusInboxInMessagingStateAtom(key)) ?? inbox,
        get(singleOfferAtom(inbox.inbox.offerId))
      )
    ),
    TE.chainFirstW(({newMessages}) => {
      const messagesToReport = newMessages
      if (messagesToReport.length === 0) return TE.of(undefined)

      return set(
        reportMessagesReceivedActionAtom,
        Array.map(messagesToReport, (o) => o.message.uuid)
      ).pipe(Effect.ignore, effectToTaskEither)
    }),
    TE.matchEW(
      (
        error
      ): T.Task<{
        updatedInbox: InboxInState
        newMessages: readonly ChatMessageWithState[]
      }> => {
        if (error._tag === 'noMessages') {
          console.info('No new messages in inbox')
          return T.of({updatedInbox: inbox, newMessages: []})
        }

        if (error._tag === 'InboxDoesNotExist') {
          reportError(
            'warn',
            new Error(
              'Api Error fetching messages for inbox. Trying to create the inbox again.'
            ),
            {error}
          )
          return pipe(
            getNotificationToken(),
            TE.fromTask,
            TE.chainW((token) =>
              effectToTaskEither(
                api.chat.createInbox({
                  token: token ?? undefined,
                  keyPair: inbox.inbox.privateKey,
                })
              )
            ),
            TE.match(
              (e) => {
                reportError(
                  'error',
                  new Error('Error recreating inbox on server'),
                  {e}
                )
                return false
              },
              () => {
                console.info(
                  `✅ Inbox ${inbox.inbox.privateKey.publicKeyPemBase64} successfully recreated`
                )
                return true
              }
            ),
            T.map(() => ({updatedInbox: inbox, newMessages: []}))
          )
        }
        return T.of({
          updatedInbox: inbox,
          newMessages: [] satisfies ChatMessageWithState[],
        })
      },
      ({newMessages, updatedInbox}) => {
        set(
          focusInboxInMessagingStateAtom(
            inbox.inbox.privateKey.publicKeyPemBase64
          ),
          updatedInbox
        )

        newMessages
          .filter((one) => one.message.messageType === 'BLOCK_CHAT')
          .map((oneBlockMessage) => {
            set(
              createSingleOfferReportedFlagFromAtomAtom(
                focusOfferByPublicKeyAtom(
                  oneBlockMessage.message.senderPublicKey
                )
              ),
              true
            )
          })

        set(handleOtherSideUpdatedActionAtom, {
          newMessages,
          inbox: updatedInbox,
        })

        set(handleOtherSideReportedFcmCypher, {
          newMessages,
          inbox: updatedInbox,
        })

        return pipe(
          deletePulledMessagesReportLeft({
            api: api.chat,
            keyPair: updatedInbox.inbox.privateKey,
          }),
          T.map(() => ({updatedInbox, newMessages}))
        )
      }
    )
  )
})

const lastRefreshAtom = atom<UnixMilliseconds>(UnixMilliseconds0)

const fetchMessagesForAllInboxesAtom = atom(null, (get, set) => {
  const lastRefresh = get(lastRefreshAtom)

  if (unixMillisecondsNow() - lastRefresh < 120) return T.of('done')
  console.log(`Last refresh before ${unixMillisecondsNow() - lastRefresh}`)

  set(lastRefreshAtom, unixMillisecondsNow())
  const measure = startMeasure('Fetch inboxes')
  console.log('Refreshing all inboxes')

  return pipe(
    get(messagingStateAtom),
    A.map((inbox) =>
      pipe(
        T.Do,
        T.chain(() =>
          set(fetchAndStoreMessagesForInboxAtom, {
            key: inbox.inbox.privateKey.publicKeyPemBase64,
          })
        ),
        T.map((values) => {
          if (values) {
            set(checkAndDeleteOldChatsAndDataActionAtom, {
              key: values?.updatedInbox.inbox.privateKey.publicKeyPemBase64,
            })
          }

          return values
        })
      )
    ),
    T.sequenceSeqArray,
    T.map(() => {
      measure()
      return 'done' as const
    })
  )
})

export default fetchMessagesForAllInboxesAtom
