import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ChatMessage,
  type ChatMessagePayload,
  type ServerMessage,
} from '@vexl-next/domain/src/general/messaging'
import {type ChatPrivateApi} from '@vexl-next/rest-api/src/services/chat'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {type JsonStringifyError, type ZodParseError} from '../utils/parsing'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'
import {messageToNetwork} from './utils/messageIO'

export type SendMessageApiErrors = ExtractLeftTE<
  ReturnType<ChatPrivateApi['sendMessage']>
>

export default function sendLeaveChat({
  api,
  receiverPublicKey,
  message,
  senderKeypair,
}: {
  api: ChatPrivateApi
  receiverPublicKey: PublicKeyPemBase64
  message: ChatMessage
  senderKeypair: PrivateKeyHolder
}): TE.TaskEither<
  | ZodParseError<ChatMessagePayload>
  | JsonStringifyError
  | ErrorEncryptingMessage
  | SendMessageApiErrors,
  ServerMessage
> {
  return pipe(
    message,
    messageToNetwork(receiverPublicKey),
    TE.chainW((encrypted) =>
      api.leaveChat({
        message: encrypted,
        receiverPublicKey,
        keyPair: senderKeypair,
      })
    )
  )
}
