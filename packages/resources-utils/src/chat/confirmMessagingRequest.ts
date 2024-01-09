import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'

import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type ChatPrivateApi} from '@vexl-next/rest-api/src/services/chat'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {type JsonStringifyError, type ZodParseError} from '../utils/parsing'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'
import {messageToNetwork} from './utils/messageIO'

function createApproveChatMessage({
  text,
  senderPublicKey,
  approve,
}: {
  text: string
  senderPublicKey: PublicKeyPemBase64
  approve: boolean
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: approve ? 'APPROVE_MESSAGING' : 'DISAPPROVE_MESSAGING',
    text,
    time: now(),
    senderPublicKey,
  }
}

export type ApiConfirmMessagingRequest = ExtractLeftTE<
  ReturnType<ChatPrivateApi['approveRequest']>
>

export default function confirmMessagingRequest({
  text,
  fromKeypair,
  toPublicKey,
  api,
  approve,
}: {
  text: string
  fromKeypair: PrivateKeyHolder
  toPublicKey: PublicKeyPemBase64
  api: ChatPrivateApi
  approve: boolean
}): TE.TaskEither<
  | ApiConfirmMessagingRequest
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage,
  ChatMessage
> {
  return pipe(
    createApproveChatMessage({
      text,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
      approve,
    }),
    TE.right,
    TE.chainFirstW(
      flow(
        messageToNetwork(toPublicKey),
        TE.chainFirstW((message) =>
          pipe(
            api.approveRequest({
              message,
              approve,
              keyPair: fromKeypair,
              publicKeyToConfirm: toPublicKey,
            })
          )
        )
      )
    )
  )
}
