import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {
  type ChatMessage,
  generateChatMessageId,
} from '@vexl-next/domain/dist/general/messaging'
import {now} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {flow, pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {encryptMessage, type ErrorEncryptingMessage} from './utils/chatCrypto'
import {type ExtractLeftTE} from '../utils/ExtractLeft'

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
  ApiErrorRequestMessaging | ErrorEncryptingMessage,
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
        encryptMessage(toPublicKey),
        TE.chainW((message) =>
          pipe(api.cancelRequestApproval({message, publicKey: toPublicKey}))
        )
      )
    )
  )
}
