import {ChatMessageEncodedPayload} from '@vexl-next/domain/dist/general/Inbox.brand'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {
  type CryptoError,
  eciesDecrypt,
  eciesEncrypt,
  type JsonParseError,
  type JsonStringifyError,
  parseJson,
  safeParse,
  stringifyToJson,
  type ZodParseError,
} from '../../utils/fpUtils'
import {type PrivateKey, type PublicKey} from '@vexl-next/cryptography'

export function encodeMessagePayload(
  toPublicKey: PublicKey
): (
  message: ChatMessageEncodedPayload
) => TE.TaskEither<JsonStringifyError | CryptoError, string> {
  return (message) =>
    pipe(
      TE.right(message),
      TE.chainEitherKW(stringifyToJson),
      TE.chainW(eciesEncrypt(toPublicKey))
    )
}

export function decodeMessagePayload(
  privateKey: PrivateKey
): (
  encoded: string
) => TE.TaskEither<
  ZodParseError<ChatMessageEncodedPayload> | CryptoError | JsonParseError,
  ChatMessageEncodedPayload
> {
  return (encoded) =>
    pipe(
      TE.right(encoded),
      TE.chainW(eciesDecrypt(privateKey)),
      TE.chainEitherKW(parseJson),
      TE.chainEitherKW(safeParse(ChatMessageEncodedPayload))
    )
}
