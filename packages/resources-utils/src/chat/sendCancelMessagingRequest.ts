import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ChatPrivateApi} from '@vexl-next/rest-api/src/services/chat'
import {
  type ChatMessage,
  generateChatMessageId,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {flow, pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {messageToNetwork} from './utils/messageIO'
import {type JsonStringifyError, type ZodParseError} from '../utils/parsing'

function createCancelRequestChatMessage({
  text,
  senderPublicKey,
}: {
  text: string
  senderPublicKey: PublicKeyPemBase64
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: 'CANCEL_REQUEST_MESSAGING',
    text,
    time: now(),
    senderPublicKey,
  }
}

export type ApiErrorRequestMessaging = ExtractLeftTE<
  ReturnType<ChatPrivateApi['cancelRequestApproval']>
>

export function sendCancelMessagingRequest({
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
    createCancelRequestChatMessage({
      text,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
    }),
    TE.right,
    TE.chainFirstW(
      flow(
        messageToNetwork(toPublicKey),
        TE.chainW((message) =>
          pipe(api.cancelRequestApproval({message, publicKey: toPublicKey}))
        )
      )
    )
  )
}
