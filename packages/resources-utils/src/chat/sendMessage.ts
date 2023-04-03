import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import {type ChatMessage} from '@vexl-next/domain/dist/general/messaging'
import * as TE from 'fp-ts/TaskEither'
import {encryptMessage, type ErrorEncryptingMessage} from './utils/chatCrypto'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'
import {type ServerMessage} from '@vexl-next/rest-api/dist/services/chat/contracts'

export type ApiErrorSendMessage = BasicError<'ApiErrorSendMessage'>
export default function sendMessage({
  api,
  receiverPublicKey,
  message,
  senderKeypair,
}: {
  api: ChatPrivateApi
  receiverPublicKey: PublicKeyPemBase64
  message: ChatMessage
  senderKeypair: PrivateKeyHolder
}): TE.TaskEither<ErrorEncryptingMessage | ApiErrorSendMessage, ServerMessage> {
  return pipe(
    message,
    encryptMessage(receiverPublicKey),
    TE.chainW((encrypted) =>
      pipe(
        api.sendMessage({
          message: encrypted,
          messageType: message.messageType,
          receiverPublicKey,
          keyPair: senderKeypair,
        }),
        TE.mapLeft(toError('ApiErrorSendMessage'))
      )
    )
  )
}
