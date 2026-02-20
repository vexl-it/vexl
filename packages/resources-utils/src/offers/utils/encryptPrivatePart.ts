import {
  PublicKeyPemBase64,
  PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {isPublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {
  PRIVATE_PAYLOAD_ENCRYPTED_V2_PREFIX,
  PrivatePayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {cryptoBoxSeal} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Effect, flow, Schema} from 'effect'
import {eciesEncryptE} from '../../utils/crypto'
import {stringifyE} from '../../utils/parsing'
import {type OfferPrivatePayloadToEncrypt} from './constructPrivatePayloads'

export class PrivatePartEncryptionError extends Schema.TaggedError<PrivatePartEncryptionError>(
  'PrivatePartEncryptionError'
)('PrivatePartEncryptionError', {
  cause: Schema.Unknown,
  message: Schema.String,
  toPublicKey: Schema.Union(PublicKeyPemBase64, PublicKeyV2),
}) {}

export function encryptPrivatePart(
  privatePart: OfferPrivatePayloadToEncrypt
): Effect.Effect<ServerPrivatePart, PrivatePartEncryptionError> {
  return Effect.gen(function* (_) {
    const privatePartsStringified = yield* _(
      stringifyE(privatePart.payloadPrivate)
    )

    const encrypted = yield* _(
      privatePartsStringified,
      isPublicKeyV2(privatePart.toPublicKey)
        ? flow(
            cryptoBoxSeal(privatePart.toPublicKey),
            Effect.map((c) => `${PRIVATE_PAYLOAD_ENCRYPTED_V2_PREFIX}${c}`)
          )
        : eciesEncryptE(privatePart.toPublicKey),
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
