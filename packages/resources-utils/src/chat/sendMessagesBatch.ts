import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {toError, type BasicError} from '@vexl-next/domain/src/utility/errors'
import {type ChatPrivateApi} from '@vexl-next/rest-api/src/services/chat'
import {
  type InboxInBatch,
  type MessageInBatch,
  type ServerMessageWithId,
  type SignedChallenge,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {type JsonStringifyError, type ZodParseError} from '../utils/parsing'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'
import {
  generateSignedChallengeBatch,
  type ErrorGeneratingSignedChallengeBatch,
} from './utils/generateSignedChallengesBatch'
import {messageToNetwork} from './utils/messageIO'
import {messagePreviewToNetwork} from './utils/messagePreviewIO'

export interface MessageInInbox {
  readonly message: ChatMessage
  readonly receiverPublicKey: PublicKeyPemBase64
}

export interface Inbox {
  readonly messages: MessageInInbox[]
  readonly inboxKeypair: PrivateKeyHolder
}

function createMessageInBatch({
  message,
  receiverPublicKey,
}: {
  message: ChatMessage
  receiverPublicKey: PublicKeyPemBase64
}): TE.TaskEither<
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage,
  MessageInBatch
> {
  return pipe(
    message,
    messageToNetwork(receiverPublicKey),
    TE.bindTo('encryptedMessage'),
    TE.bindW('encryptedPreview', () =>
      messagePreviewToNetwork(receiverPublicKey)(message)
    ),
    TE.map(({encryptedMessage, encryptedPreview}) => ({
      message: encryptedMessage,
      messageType: message.messageType,
      messagePreview: encryptedPreview,
      receiverPublicKey,
    }))
  )
}

function findChallengeForPublicKey(
  generatedChallenges: Array<{
    challenge: SignedChallenge
    publicKey: PublicKeyPemBase64
  }>
): (publicKey: PublicKeyPemBase64) => O.Option<SignedChallenge> {
  return (publicKey) =>
    pipe(
      generatedChallenges,
      A.findFirst((challenge) => challenge.publicKey === publicKey),
      O.map((one) => one.challenge)
    )
}

export type ErrorNoChallengeForPublicKey =
  BasicError<'ErrorNoChallengeForPublicKey'>

function createInboxInBatch(
  generatedChallenges: Array<{
    challenge: SignedChallenge
    publicKey: PublicKeyPemBase64
  }>
): (args: {
  messages: Array<{message: ChatMessage; receiverPublicKey: PublicKeyPemBase64}>
  senderPublicKey: PublicKeyPemBase64
}) => TE.TaskEither<
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage
  | ErrorNoChallengeForPublicKey,
  InboxInBatch
> {
  return ({messages, senderPublicKey}) =>
    pipe(
      messages,
      A.map(createMessageInBatch),
      A.sequence(TE.ApplicativePar),
      TE.bindTo('messages'),
      TE.bindW('senderPublicKey', () => TE.right(senderPublicKey)),
      TE.bindW('signedChallenge', ({senderPublicKey}) =>
        pipe(
          senderPublicKey,
          findChallengeForPublicKey(generatedChallenges),
          TE.fromOption(() =>
            toError('ErrorNoChallengeForPublicKey')(
              new Error('No challenge fro public key found')
            )
          )
        )
      )
    )
}

export type ApiErrorSendingMessagesBatch = ExtractLeftTE<
  ReturnType<ChatPrivateApi['sendMessages']>
>

export default function sendMessagesBatch({
  api,
  inboxes,
}: {
  api: ChatPrivateApi
  inboxes: Inbox[]
}): TE.TaskEither<
  | ErrorGeneratingSignedChallengeBatch
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage
  | ErrorNoChallengeForPublicKey
  | ApiErrorSendingMessagesBatch,
  ServerMessageWithId[]
> {
  return pipe(
    inboxes.map((one) => one.inboxKeypair),
    generateSignedChallengeBatch(api),
    TE.chainW((signedChallenge) =>
      pipe(
        inboxes,
        A.map((one) => ({
          messages: one.messages,
          senderPublicKey: one.inboxKeypair.publicKeyPemBase64,
        })),
        A.map(createInboxInBatch(signedChallenge)),
        A.sequence(TE.ApplicativePar)
      )
    ),
    TE.chainW((toSend) => pipe(api.sendMessages({data: toSend})))
  )
}
