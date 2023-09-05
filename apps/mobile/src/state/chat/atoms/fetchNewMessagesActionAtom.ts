import {flow, pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {type ChatMessageWithState, type InboxInState} from '../domain'
import * as TE from 'fp-ts/TaskEither'
import retrieveMessages, {
  type ApiErrorRetrievingMessages,
} from '@vexl-next/resources-utils/dist/chat/retrieveMessages'
import reportError from '../../../utils/reportError'
import * as T from 'fp-ts/Task'
import {privateApiAtom} from '../../../api'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import addMessagesToChats from '../utils/addMessagesToChats'
import createNewChatsFromMessages from '../utils/createNewChatsFromFirstMessages'
import {group} from 'group-items'
import {focusAtom} from 'jotai-optics'
import messagingStateAtom from '../atoms/messagingStateAtom'
import replaceBase64UriWithImageFileUri from '../utils/replaceBase64UriWithImageFileUri'
import {
  createSingleOfferReportedFlagFromAtomAtom,
  focusOfferByOfferId,
  focusOfferByPublicKeyAtom,
} from '../../marketplace/atom'
import {
  type UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {type OneOfferInState} from '@vexl-next/domain/dist/general/offers'

function createInboxAtom(
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

function refreshInbox(
  api: ChatPrivateApi
): (
  getInbox: () => InboxInState,
  inboxOffer?: OneOfferInState
) => TE.TaskEither<
  ApiErrorRetrievingMessages,
  {updatedInbox: InboxInState; newMessages: readonly ChatMessageWithState[]}
> {
  return (getInbox, inboxOffer) =>
    pipe(
      retrieveMessages({api, inboxKeypair: getInbox().inbox.privateKey}),
      TE.map((one) => {
        if (one.errors.length > 0) {
          reportError('error', 'Error decrypting messages', one.errors)
        }

        return one.messages
      }),
      TE.filterOrElseW(
        (messages) => messages.length > 0,
        () => 'noMessages' as const
      ),
      TE.map((newMessages) =>
        newMessages.map(
          (oneMessage): ChatMessageWithState => ({
            state: 'received',
            message: oneMessage,
          })
        )
      ),
      TE.chainW(
        flow(
          A.map((oneMessage): T.Task<ChatMessageWithState> => {
            if (!oneMessage.message.image) return T.of(oneMessage)
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
                ...createNewChatsFromMessages({
                  inbox: inbox.inbox,
                  inboxOffer,
                })(messagesInNewChat ?? []),
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
            return E.right({updatedInbox: getInbox(), newMessages: []})
          }
          return E.left(e)
        },
        (right) => E.right(right)
      )
    )
}

function deletePulledMessagesReportLeft({
  api,
  keyPair,
}: {
  api: ChatPrivateApi
  keyPair: PrivateKeyHolder
}): T.Task<void> {
  return pipe(
    api.deletePulledMessages({keyPair}),
    TE.match(
      (error) => {
        reportError('error', 'Error deleting pulled messages', error)
      },
      () => {}
    )
  )
}

export const fetchAndStoreMessagesForInboxAtom = atom<
  null,
  [{key: PublicKeyPemBase64}],
  T.Task<InboxInState | undefined>
>(null, (get, set, params) => {
  const {key} = params
  const api = get(privateApiAtom)
  const inbox = get(createInboxAtom(key))

  if (!inbox) {
    reportError(
      'error',
      `Trying to refresh inbox with public key: ${key}, but inbox does not exist.`,
      new Error('Inbox does not exist')
    )
    return T.of(undefined)
  }

  return pipe(
    refreshInbox(api.chat)(
      () => get(createInboxAtom(key)) ?? inbox,
      get(focusOfferByOfferId(inbox.inbox.offerId))
    ),
    TE.match(
      (error) => {
        reportError('error', 'Api Error fetching messages for inbox', error)
        return inbox
      },
      ({newMessages, updatedInbox}) => {
        set(
          createInboxAtom(inbox.inbox.privateKey.publicKeyPemBase64),
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

        return updatedInbox
      }
    ),
    T.chainFirst(() =>
      deletePulledMessagesReportLeft({
        api: api.chat,
        keyPair: inbox.inbox.privateKey,
      })
    )
  )
})

const lastRefreshAtom = atom<UnixMilliseconds>(UnixMilliseconds0)

const fetchMessagesForAllInboxesAtom = atom(null, (get, set) => {
  const lastRefresh = get(lastRefreshAtom)

  if (unixMillisecondsNow() - lastRefresh < 120) return T.of('done')

  set(lastRefreshAtom, unixMillisecondsNow())
  console.log('Refreshing all inboxes')

  return pipe(
    get(messagingStateAtom),
    A.map(
      async (inbox) =>
        await set(fetchAndStoreMessagesForInboxAtom, {
          key: inbox.inbox.privateKey.publicKeyPemBase64,
        })()
    ),
    // @ts-expect-error bad typings?
    A.sequence(T.ApplicativeSeq),
    T.map(() => 'done' as const)
  )
})

export default fetchMessagesForAllInboxesAtom
