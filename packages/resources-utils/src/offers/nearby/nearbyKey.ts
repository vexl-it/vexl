import {
  importKeyPair,
  PrivateKeyPemBase64,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {defaultCurve} from '@vexl-next/cryptography/src/KeyHolder/Curve.brand'
import {privateRawToPem} from '@vexl-next/cryptography/src/KeyHolder/keyUtils'
import {getCrypto} from '@vexl-next/cryptography/src/getCrypto'
import {NearbyOfferKey} from '@vexl-next/domain/src/general/offers'
import {Effect, Schema} from 'effect'

const NEARBY_KEY_BYTES = 32

export class InvalidNearbyKeyError extends Schema.TaggedError<InvalidNearbyKeyError>(
  'InvalidNearbyKeyError'
)('InvalidNearbyKeyError', {
  cause: Schema.Unknown,
}) {}

export function generateNearbyKey(): NearbyOfferKey {
  const ecdh = getCrypto().createECDH(defaultCurve)
  ecdh.generateKeys()
  const privateKey = ecdh.getPrivateKey()
  // ECDH may strip leading zero bytes of the scalar
  const padded = Buffer.concat([
    Buffer.alloc(NEARBY_KEY_BYTES - privateKey.length),
    privateKey,
  ])
  return Schema.decodeSync(NearbyOfferKey)(padded.toString('base64'))
}

export function nearbyKeyToKeyPair(key: NearbyOfferKey): PrivateKeyHolder {
  const privateKeyPem = privateRawToPem(
    Buffer.from(key, 'base64'),
    defaultCurve
  )
  return importKeyPair(
    Schema.decodeSync(PrivateKeyPemBase64)(privateKeyPem.toString('base64'))
  )
}

// Received keys come from untrusted Bluetooth peers and may not be a valid scalar
export function nearbyKeyToKeyPairE(
  key: NearbyOfferKey
): Effect.Effect<PrivateKeyHolder, InvalidNearbyKeyError> {
  return Effect.try({
    try: () => nearbyKeyToKeyPair(key),
    catch: (cause) => new InvalidNearbyKeyError({cause}),
  })
}
