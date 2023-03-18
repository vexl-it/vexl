import {KeyFormat, PrivateKey, type PublicKey} from '@vexl-next/cryptography'
import {type OfferId} from '@vexl-next/domain/dist/general/OfferInfo'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import {generateSignedChallenge, type GeneratingChallengeErorr} from './api'
import {v4 as uuid} from 'uuid'
import {
  type BadStatusCodeError,
  type UnexpectedApiResponseError,
  type UnknownError,
} from '@vexl-next/rest-api/dist/Errors'
import {
  type JsonStringifyError,
  safeParse,
  stringifyToJson,
  type ZodParseError,
} from '../../utils/fpUtils'
import {
  Chat,
  ChatMessage,
  ChatMessageEncodedPayload,
  type ChatOrigin,
  Inbox,
  MessageTypes,
} from '@vexl-next/domain/dist/general/Inbox.brand'
import {usePrivateApiAssumeLoggedIn} from '../../api'
import {useSetAtom} from 'jotai'
import {chatsAtom, inboxesAtom} from './messagingStateAtom'
import {pipe} from 'fp-ts/function'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {useCallback} from 'react'

function useNotificationToken(): undefined | string {
  // TODO
  return undefined
}

export function useCreateInbox(): (
  privateKey: PrivateKey,
  offerId?: OfferId
) => TE.TaskEither<
  | GeneratingChallengeErorr
  | UnknownError
  | BadStatusCodeError
  | UnexpectedApiResponseError
  | ZodParseError<Inbox>,
  Inbox
> {
  const {chat} = usePrivateApiAssumeLoggedIn()
  const notificationToken = useNotificationToken()
  const setInboxes = useSetAtom(inboxesAtom)

  return (privateKey = PrivateKey.generate(), offerId) =>
    pipe(
      generateSignedChallenge(privateKey, chat),
      TE.map((challenge) => ({
        publicKey: privateKey.exportPublicKey(KeyFormat.PEM_BASE64),
        signedChallenge: challenge,
        token: notificationToken,
      })),
      TE.chainW(chat.createInbox),
      TE.map(() => ({privateKey: PrivateKey, offerId})),
      TE.chainEitherKW(safeParse(Inbox)),
      TE.map((inbox) => {
        setInboxes((inboxes) => [...inboxes, inbox])
        return inbox
      })
    )
}

function sendRequestApproval({
  payload,
  toPublicKey,
  fromInbox,
  chat,
}: {
  payload: ChatMessageEncodedPayload
  toPublicKey: PublicKey
  fromInbox: Inbox
  chat: ChatPrivateApi
}): TE.TaskEither<
  | UnknownError
  | BadStatusCodeError
  | UnexpectedApiResponseError
  | JsonStringifyError
  | ZodParseError<ChatMessage>,
  ChatMessage
> {
  return pipe(
    stringifyToJson(payload),
    TE.fromEither,
    TE.chainW((payload) =>
      // TODO from inbox should be used
      chat.requestApproval({
        message: payload,
        publicKey: toPublicKey.exportPublicKey(KeyFormat.PEM_BASE64),
      })
    ),
    TE.map((response) => ({
      id: response.id,
      type: MessageTypes.REQUEST_MESSAGING,
      isMine: true,
      senderPublicKey: fromInbox.privateKey.exportPublicKey(
        KeyFormat.PEM_BASE64
      ),
      ...payload,
    })),
    TE.chainEitherKW(safeParse(ChatMessage))
  )
}

function createMessagePayload(
  text: string
): E.Either<
  ZodParseError<ChatMessageEncodedPayload>,
  ChatMessageEncodedPayload
> {
  return pipe(
    E.right({
      uuid: uuid(),
      text,
      time: Date.now(),
    }),
    E.chainW(safeParse(ChatMessageEncodedPayload))
  )
}

function createChat({
  inbox,
  origin,
  toPublicKey,
  messages,
}: {
  inbox: Inbox
  origin: ChatOrigin
  toPublicKey: PublicKey
  messages: ChatMessage[]
}): E.Either<ZodParseError<Chat>, Chat> {
  return pipe(
    E.right({
      id: uuid(),
      inbox,
      origin,
      otherSide: {publicKey: toPublicKey.exportPublicKey(KeyFormat.PEM_BASE64)},
      messages,
    }),
    E.chainW(safeParse(Chat))
  )
}

export function useCreateChatAndSendRequest(): (arg: {
  toPublicKey: PublicKey
  chatOrigin: ChatOrigin
  text: string
  inbox: Inbox
}) => TE.TaskEither<
  | UnknownError
  | BadStatusCodeError
  | UnexpectedApiResponseError
  | JsonStringifyError
  | ZodParseError<ChatMessageEncodedPayload>
  | ZodParseError<ChatMessage>
  | ZodParseError<Chat>,
  Chat
> {
  const {chat} = usePrivateApiAssumeLoggedIn()
  const setChats = useSetAtom(chatsAtom)

  return useCallback(
    ({toPublicKey, chatOrigin, text, inbox}) =>
      pipe(
        TE.fromEither(createMessagePayload(text)),
        TE.chainW((payload) =>
          sendRequestApproval({payload, toPublicKey, fromInbox: inbox, chat})
        ),
        TE.chainEitherKW((firstMessage) =>
          createChat({
            inbox,
            origin: chatOrigin,
            toPublicKey,
            messages: [firstMessage],
          })
        ),
        TE.map((chat) => {
          setChats((chats) => [chat, ...chats])
          return chat
        })
      ),
    [chat, setChats]
  )
}

export function sendMessage(
  chatApi: ChatPrivateApi
): (payload: ChatMessageEncodedPayload) => TE.TaskEither<any, ChatMessage> {
  return (payload: ChatMessageEncodedPayload) =>
    pipe(generateSignedChallenge(chat.inbox.privateKey, chatApi))
}

export function useSendMessage(chat: Chat) {
  const {chat: chatApi} = usePrivateApiAssumeLoggedIn()
  const setChats = useSetAtom(chatsAtom)

  return useCallback(
    (message: ChatMessageEncodedPayload) =>
      pipe(
        TE.right(message),
        TE.chainW(sendMessage(chatApi)),
        TE.map((message) => {})
      ),
    [chat, chatApi, setChats]
  )
}
