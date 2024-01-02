import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import {
  type ChatMessagePayload,
  type ChatMessage,
  type ServerMessage,
} from '@vexl-next/domain/dist/general/messaging'
import * as TE from 'fp-ts/TaskEither'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {messageToNetwork} from './utils/messageIO'
import {type JsonStringifyError, type ZodParseError} from '../utils/parsing'

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
