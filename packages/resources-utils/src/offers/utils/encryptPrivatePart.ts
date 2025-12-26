import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PrivatePayloadEncrypted} from '@vexl-next/domain/src/general/offers'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Effect, Schema} from 'effect'
import {eciesEncryptE} from '../../utils/crypto'
import {stringifyE} from '../../utils/parsing'
import {type OfferPrivatePayloadToEncrypt} from './constructPrivatePayloads'

export class PrivatePartEncryptionError extends Schema.TaggedError<PrivatePartEncryptionError>(
  'PrivatePartEncryptionError'
)('PrivatePartEncryptionError', {
  cause: Schema.Unknown,
  message: Schema.String,
  toPublicKey: PublicKeyPemBase64,
}) {}

export function encryptPrivatePart(
  privatePart: OfferPrivatePayloadToEncrypt
): Effect.Effect<ServerPrivatePart, PrivatePartEncryptionError> {
  return Effect.gen(function* (_) {
    const privatePartsStringified = yield* _(
      stringifyE(privatePart.payloadPrivate)
    )

    const encrypted = yield* _(
      eciesEncryptE(privatePart.toPublicKey)(privatePartsStringified),
      Effect.map((json) => `0${json}`),
      Effect.flatMap(Schema.decode(PrivatePayloadEncrypted))
    )

    return {
      userPublicKey: privatePart.toPublicKey,
      payloadPrivate: encrypted,
    }
  }).pipe(
    Effect.catchAll((e) => {
      return new PrivatePartEncryptionError({
        toPublicKey: privatePart.toPublicKey,
        message: 'Error encrypting private part',
        cause: e,
      })
    })
  )
}
