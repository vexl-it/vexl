import {Schema} from 'effect'

export const PUBLIC_KEY_V2_PREFIX = 'V2_PUB_'

// 32-byte X25519 public key, base64url encoded (no padding)
export const PublicKeyV2 = Schema.String.pipe(
  Schema.filter((s) => s.startsWith(PUBLIC_KEY_V2_PREFIX)),
  Schema.brand('PublicKeyV2')
)
export type PublicKeyV2 = typeof PublicKeyV2.Type

export const PRIVATE_KEY_V2_PREFIX = 'V2_PRIV_'

export const isPublicKeyV2 = Schema.is(PublicKeyV2)

// 32-byte X25519 secret key, base64url encoded (no padding)
export const PrivateKeyV2 = Schema.String.pipe(
  Schema.filter((s) => s.startsWith(PRIVATE_KEY_V2_PREFIX)),
  Schema.brand('PrivateKeyV2')
)
export type PrivateKeyV2 = typeof PrivateKeyV2.Type
export const isPrivateKeyV2 = Schema.is(PrivateKeyV2)

// V2 Keypair holder
export const KeyPairV2 = Schema.Struct({
  publicKey: PublicKeyV2,
  privateKey: PrivateKeyV2,
})
export type KeyPairV2 = typeof KeyPairV2.Type
export const isKeyPairV2 = Schema.is(KeyPairV2)
