import {type ChatMessage} from '@vexl-next/domain/dist/general/messaging'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {pipe} from 'fp-ts/function'
import {
  type InboxInBatch,
  type MessageInBatch,
  type ServerMessageWithId,
  type SignedChallenge,
} from '@vexl-next/rest-api/dist/services/chat/contracts'
import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import {encryptMessage, type ErrorEncryptingMessage} from './utils/chatCrypto'
import * as O from 'fp-ts/Option'
import {
  type ErrorGeneratingSignedChallengeBatch,
  generateSignedChallengeBatch,
} from './utils/generateSignedChallengesBatch'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'

interface MessageInInbox {
  readonly message: ChatMessage
  readonly receiverPublicKey: PublicKeyPemBase64
}
interface Inbox {
  readonly messages: MessageInInbox[]
  readonly inboxKeypair: PrivateKeyHolder
}

function createMessageInBatch({
  message,
  receiverPublicKey,
}: {
  message: ChatMessage
  receiverPublicKey: PublicKeyPemBase64
}): TE.TaskEither<ErrorEncryptingMessage, MessageInBatch> {
  return pipe(
    message,
    encryptMessage(receiverPublicKey),
    TE.map((encrypted) => ({
      message: encrypted,
      messageType: message.messageType,
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
  ErrorEncryptingMessage | ErrorNoChallengeForPublicKey,
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

export type ApiErrorSendingMessagesBatch =
  BasicError<'ApiErrorSendingMessagesBatch'>

export default function sendMessagesBatch({
  api,
  inboxes,
}: {
  api: ChatPrivateApi
  inboxes: Inbox[]
}): TE.TaskEither<
  | ErrorGeneratingSignedChallengeBatch
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
    TE.chainW((toSend) =>
      pipe(
        api.sendMessages({data: toSend}),
        TE.mapLeft(toError('ApiErrorSendingMessagesBatch'))
      )
    )
  )
}
