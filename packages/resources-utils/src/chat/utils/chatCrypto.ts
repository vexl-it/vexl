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
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'

export type ErrorEncryptingMessage = BasicError<'ErrorEncryptingMessage'>

export function encryptMessage(
  publicKey: PublicKeyPemBase64
): (message: ChatMessage) => TE.TaskEither<ErrorEncryptingMessage, string> {
  return (message: ChatMessage) =>
    pipe(
      TE.right<never, ChatMessagePayload>({
        time: message.time,
        text: message.text,
        uuid: message.uuid,
        image: message.image,
        deanonymizedUser: message.deanonymizedUser,
      }),
      // TE.chainEitherKW(safeParse(ChatMessagePayload)),
      TE.chainEitherKW(safeParse(ChatMessagePayload)),
      TE.chainEitherKW(stringifyToJson),
      TE.chainW(eciesEncrypt(publicKey)),
      TE.mapLeft(toError('ErrorEncryptingMessage'))
    )
}

export type ErrorDecryptingMessage = BasicError<'ErrorDecryptingMessage'>

export function decryptMessage(
  privateKey: PrivateKeyHolder
): (
  message: ServerMessage
) => TE.TaskEither<ErrorDecryptingMessage, ChatMessage> {
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
        messageType: message.messageType,
        image: payload.image,
        deanonymizedUser: payload.deanonymizedUser,
        senderPublicKey: message.senderPublicKey,
      })),
      TE.mapLeft(toError('ErrorDecryptingMessage'))
    )
}
