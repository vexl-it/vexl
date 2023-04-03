import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import generateUuid from '../utils/generateUuid'
import {
  type ChatMessage,
  MessageTypes,
} from '@vexl-next/domain/dist/general/messaging'
import {now} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {flow, pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {encryptMessage, type ErrorEncryptingMessage} from './utils/chatCrypto'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'

function createRequestChatMessage({
  text,
  senderPublicKey,
}: {
  text: string
  senderPublicKey: PublicKeyPemBase64
}): ChatMessage {
  return {
    uuid: generateUuid(),
    messageType: MessageTypes.REQUEST_MESSAGING,
    text,
    isMine: true,
    time: now(),
    senderPublicKey,
    sent: false,
  }
}

export type ApiErrorRequestMessaging = BasicError<'ApiErrorRequestMessaging'>

export function sendMessagingRequest({
  text,
  fromKeypair,
  toPublicKey,
  api,
}: {
  text: string
  fromKeypair: PrivateKeyHolder
  toPublicKey: PublicKeyPemBase64
  api: ChatPrivateApi
}): TE.TaskEither<
  ApiErrorRequestMessaging | ErrorEncryptingMessage,
  ChatMessage
> {
  return pipe(
    createRequestChatMessage({
      text,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
    }),
    TE.right,
    TE.chainFirstW(
      flow(
        encryptMessage(toPublicKey),
        TE.chainW((message) =>
          pipe(
            api.requestApproval({message, publicKey: toPublicKey}),
            TE.mapLeft(toError('ApiErrorRequestMessaging'))
          )
        )
      )
    ),
    TE.map((message) => ({...message, sent: true}))
  )
}
