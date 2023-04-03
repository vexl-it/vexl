import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {
  type ChatMessage,
  ChatMessagePayload,
} from '@vexl-next/domain/dist/general/messaging'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {parseJson, safeParse, stringifyToJson} from '../../utils/parsing'
import {eciesDecrypt, eciesEncrypt} from '../../utils/crypto'
import {type ServerMessage} from '@vexl-next/rest-api/dist/services/chat/contracts'

export interface EncryptingMessageError {
  readonly type: 'EncryptingMessageError'
  readonly e: unknown
}
export function encryptMessage(
  publicKey: PublicKeyPemBase64
): (message: ChatMessage) => TE.TaskEither<EncryptingMessageError, string> {
  return (message: ChatMessage) =>
    pipe(
      TE.right<never, ChatMessagePayload>({
        time: message.time,
        text: message.text,
        uuid: message.uuid,
        image: message.image,
        deanonymizedUser: message.deanonymizedUser,
      }),
      TE.chainEitherKW(safeParse(ChatMessagePayload)),
      TE.chainEitherKW(stringifyToJson),
      TE.chainW(eciesEncrypt(publicKey)),
      TE.mapLeft((e) => ({type: 'EncryptingMessageError', e} as const))
    )
}

export interface DecryptingMessageError {
  readonly type: 'DecryptingMessageError'
  readonly e: unknown
}
export function decryptMessage(
  privateKey: PrivateKeyHolder
): (
  message: ServerMessage
) => TE.TaskEither<DecryptingMessageError, ChatMessage> {
  return (message: ServerMessage) =>
    pipe(
      eciesDecrypt(privateKey.privateKeyPemBase64)(message.message),
      TE.chainEitherKW(parseJson),
      TE.chainEitherKW(safeParse(ChatMessagePayload)),
      TE.map((payload) => ({
        uuid: payload.uuid,
        time: payload.time,
        text: payload.text,
        isMine: false,
        sent: true,
        messageType: message.messageType,
        image: payload.image,
        deanonymizedUser: payload.deanonymizedUser,
        senderPublicKey: message.senderPublicKey,
      })),
      TE.mapLeft((e) => ({type: 'DecryptingMessageError', e} as const))
    )
}
