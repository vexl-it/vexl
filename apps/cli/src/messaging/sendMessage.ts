import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {
  type ChatMessage,
  type MessageType,
  MessageTypes,
} from '@vexl-next/domain/dist/general/messaging'
import {addMessageToChat, readInboxFromFile} from './utils/SavedInbox'
import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import {getPrivateApi} from '../api'
import {flow, pipe} from 'fp-ts/function'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {randomUUID} from 'node:crypto'
import {Uuid} from '@vexl-next/domain/dist/utility/Uuid.brand'
import {now} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {generateSignedChallengeBatch} from './utils/generateSignedChallenge'
import {encryptMessage} from './utils/messageCrypto'
import {
  type SendMessagesRequest,
  type SignedChallenge,
  type MessageInBatch,
  type InboxInBatch,
} from '@vexl-next/rest-api/dist/services/chat/contracts'

function createTextMessage({
  text,
  senderPublicKey,
}: {
  text: string
  senderPublicKey: PublicKeyPemBase64
}): ChatMessage {
  return {
    uuid: Uuid.parse(randomUUID()),
    messageType: MessageTypes.MESSAGE,
    text,
    isMine: true,
    time: now(),
    senderPublicKey,
    sent: false,
  }
}

function createMessageInBatch({
  message,
  receiverPublicKey,
}: {
  message: ChatMessage
  receiverPublicKey: PublicKeyPemBase64
}): TE.TaskEither<any, MessageInBatch> {
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

function createInboxInBatch(
  generatedChallenges: Array<{
    challenge: SignedChallenge
    publicKey: PublicKeyPemBase64
  }>
): (args: {
  messages: Array<{message: ChatMessage; receiverPublicKey: PublicKeyPemBase64}>
  senderPublicKey: PublicKeyPemBase64
}) => TE.TaskEither<any, InboxInBatch> {
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
          TE.fromOption(() => new Error('no challenge for public key'))
        )
      )
    )
}

function sendChatMessages({
  api,
  inboxes,
}: {
  api: ChatPrivateApi
  inboxes: Array<{
    messages: Array<{
      message: ChatMessage
      receiverPublicKey: PublicKeyPemBase64
    }>
    inboxKeypair: PrivateKeyHolder
  }>
}): TE.TaskEither<any, any> {
  return pipe(
    inboxes,
    A.map((one) => one.inboxKeypair),
    generateSignedChallengeBatch(api),
    TE.chainW((signedChallenges) =>
      pipe(
        inboxes,
        A.map((one) => ({
          messages: one.messages,
          senderPublicKey: one.inboxKeypair.publicKeyPemBase64,
        })),
        A.map((a) => createInboxInBatch(signedChallenges)(a)),
        A.sequence(TE.ApplicativePar)
      )
    ),
    TE.chainW((data) => api.sendMessages({data}))
  )
}

export default async function sendMessage({
  inboxFile,
  toPublicKey,
  text,
}: {
  inboxFile: PathString
  toPublicKey: PublicKeyPemBase64
  text: string
}) {
  await pipe(
    readInboxFromFile(inboxFile),
    TE.fromEither,
    TE.bindW('api', ({ownerCredentials}) =>
      TE.right(getPrivateApi(ownerCredentials))
    ),
    TE.bindW('messageToSend', ({keypair}) =>
      TE.right(
        createTextMessage({
          text,
          senderPublicKey: keypair.publicKeyPemBase64,
        })
      )
    ),
    TE.chainFirstW(({api, keypair, messageToSend}) =>
      sendChatMessages({
        api: api.chat,
        inboxes: [
          {
            messages: [
              {
                message: messageToSend,
                receiverPublicKey: toPublicKey,
              },
            ],
            inboxKeypair: keypair,
          },
        ],
      })
    ),
    TE.chainEitherKW(({messageToSend}) => {
      return addMessageToChat({inboxFile, otherSidePublicKey: toPublicKey})({
        ...messageToSend,
        sent: true,
      })
    }),
    TE.match(
      (e) => {
        console.error('Error while sending message', e)
      },
      () => {
        console.log('Message sent successfully')
      }
    )
  )()
}
