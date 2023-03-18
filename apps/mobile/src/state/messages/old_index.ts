import {
  Chat,
  ChatMessage,
  ChatMessageEncodedPayload,
  Inbox,
  type MessageType,
  MessageTypes,
} from '@vexl-next/domain/dist/general/Inbox.brand'
import {useSetAtom} from 'jotai'
import {KeyFormat, PrivateKey, type PublicKey} from '@vexl-next/cryptography'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {usePrivateApiAssumeLoggedIn} from '../../api'
import {type OfferId} from '@vexl-next/domain/dist/general/OfferInfo'
import {
  type CryptoError,
  type JsonStringifyError,
  safeParse,
  type ZodParseError,
} from '../../utils/fpUtils'
import {generateSignedChallenge, type GeneratingChallengeErorr} from './api'
import {
  type BadStatusCodeError,
  type UnexpectedApiResponseError,
  type UnknownError,
} from '@vexl-next/rest-api/dist/Errors'
import {v4 as uuid} from 'uuid'
import {encodeMessagePayload} from './utils'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {chatsAtom, inboxesAtom} from './messagingStateAtom'

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

export function useSendMessageRequestAndCreateChat(): (args: {
  inbox: Inbox
  toPublicKey: PublicKey
  text: string
  originOfferId?: OfferId
}) => TE.TaskEither<any, Chat> {
  const {chat} = usePrivateApiAssumeLoggedIn()
  const setChats = useSetAtom(chatsAtom)

  return ({toPublicKey, originOfferId, text, inbox}) =>
    pipe(
      {
        uuid: uuid(),
        text,
        time: Date.now(),
      },
      TE.right,
      TE.chainEitherKW(safeParse(ChatMessageEncodedPayload)),
      TE.bindTo('messageToSend'),
      TE.bindW('jsonToSend', ({messageToSend}) =>
        encodeMessagePayload(toPublicKey)(messageToSend)
      ),
      TE.bindW('response', ({jsonToSend}) =>
        chat.requestApproval({
          message: jsonToSend,
          publicKey: toPublicKey.exportPublicKey(KeyFormat.PEM_BASE64),
        })
      ),
      TE.chainEitherKW(({messageToSend, response}) =>
        createNewChatAndSendRequest({
          id: response.id,
          encodedMessagePayload: messageToSend,
          type: MessageTypes.REQUEST_MESSAGING,
          isMine: true,
          senderPublicKey: inbox.privateKey.exportPublicKey(
            KeyFormat.PEM_BASE64
          ),
        })
      ),
      TE.chainEitherKW((message) =>
        createNewChatWithInitialMessage({
          inbox,
          initialMessage: message,
          otherSidePublicKey: toPublicKey,
        })
      ),
      TE.map((chat) => {
        setChats((chats) => [chat, ...chats])
        return chat
      })
    )
}

export function createNewChatAndSendRequest({
  messageToSend,
  inbox,
  toPublicKey,
  chatApi,
}: {
  messageToSend: ChatMessageEncodedPayload
  toPublicKey: PublicKey
  inbox: Inbox
  messageType: MessageType
  chatApi: ChatPrivateApi
}): TE.TaskEither<
  | UnknownError
  | BadStatusCodeError
  | UnexpectedApiResponseError
  | JsonStringifyError
  | CryptoError
  | ZodParseError<ChatMessage | Chat>,
  Chat
> {
  return pipe(
    TE.right(messageToSend),
    TE.chainW(encodeMessagePayload(toPublicKey)),
    TE.chainW((encryptedMessage) =>
      chatApi.requestApproval({
        message: encryptedMessage,
        publicKey: toPublicKey.exportPublicKey(KeyFormat.PEM_BASE64),
      })
    ),
    TE.chainEitherKW((response) =>
      createNewChatWithInitialMessage({
        inbox,
        initialMessage: ChatMessage.parse({
          id: response.id,
          ...messageToSend,
          type: MessageTypes.REQUEST_MESSAGING,
          isMine: true,
          senderPublicKey: inbox.privateKey.exportPublicKey(
            KeyFormat.PEM_BASE64
          ),
        }),
        otherSidePublicKey: toPublicKey,
      })
    )
  )
}

export function createNewChatWithInitialMessage({
  inbox,
  otherSidePublicKey,
  initialMessage,
}: {
  inbox: Inbox
  otherSidePublicKey: PublicKey
  initialMessage: ChatMessage
}): E.Either<ZodParseError<Chat>, Chat> {
  return pipe(
    {
      inbox,
      otherSide: {
        publicKey: otherSidePublicKey.exportPublicKey(KeyFormat.PEM_BASE64),
      },
      messages: [initialMessage],
    },
    E.right,
    E.chainW(safeParse(Chat))
  )
}

// export function useRefreshInboxes() {}
//
// export function useFetchNewMessages() {}
//
// export function useRequestApproval() {}
