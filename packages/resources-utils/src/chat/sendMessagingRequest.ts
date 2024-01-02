import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/dist/general/messaging'
import {now} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {type JsonStringifyError, type ZodParseError} from '../utils/parsing'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'
import {messageToNetwork} from './utils/messageIO'

function createRequestChatMessage({
  text,
  senderPublicKey,
}: {
  text: string
  senderPublicKey: PublicKeyPemBase64
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: 'REQUEST_MESSAGING',
    text,
    time: now(),
    senderPublicKey,
  }
}

export type ApiErrorRequestMessaging = ExtractLeftTE<
  ReturnType<ChatPrivateApi['requestApproval']>
>

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
  | ApiErrorRequestMessaging
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage,
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
        messageToNetwork(toPublicKey),
        TE.chainW((message) =>
          pipe(api.requestApproval({message, publicKey: toPublicKey}))
        )
      )
    )
  )
}
