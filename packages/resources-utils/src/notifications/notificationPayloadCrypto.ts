import {Schema, type ParseResult} from '@effect/schema'
import {type ParseError} from '@effect/schema/ParseResult'
import {eciesLegacy} from '@vexl-next/cryptography'
import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ChatNotificationData,
  EncryptedNotificationPayload,
} from '@vexl-next/domain/src/general/notifications'
import {toError} from '@vexl-next/domain/src/utility/errors'
import {Effect} from 'effect'
import {type CryptoError} from '../utils/crypto'

export class EncryptionError extends Schema.TaggedError<EncryptionError>()(
  'EncryptionError',
  {}
) {}

export function encryptChatNotificationPayload({
  publicKeyOfReceiver,
  payload,
}: {
  publicKeyOfReceiver: PublicKeyPemBase64
  payload: ChatNotificationData
}): Effect.Effect<EncryptedNotificationPayload, CryptoError | ParseError> {
  const stringify = Schema.encode(Schema.parseJson(ChatNotificationData))
  return stringify(payload).pipe(
    Effect.flatMap((e) =>
      Effect.tryPromise({
        try: async () => {
          return await eciesLegacy.eciesLegacyEncrypt({
            publicKey: publicKeyOfReceiver,
            data: e,
          })
        },
        catch: toError('CryptoError'),
      })
    ),
    Effect.map(EncryptedNotificationPayload)
  )
}

export function decryptChatNotificationPayload(
  privateKey: PrivateKeyPemBase64
): (
  encrypted: EncryptedNotificationPayload
) => Effect.Effect<ChatNotificationData, CryptoError | ParseResult.ParseError> {
  const decode = Schema.decode(Schema.parseJson(ChatNotificationData))

  return (encrypted) =>
    Effect.tryPromise({
      try: async () => {
        return await eciesLegacy.eciesLegacyDecrypt({
          privateKey,
          data: encrypted,
        })
      },
      catch: toError('CryptoError'),
    }).pipe(Effect.flatMap(decode))
}
