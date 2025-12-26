import {Schema} from 'effect'

export const PrivateKeyPemBase64 = Schema.String.pipe(
  Schema.brand('PrivateKeyPemBase64')
)
export type PrivateKeyPemBase64 = typeof PrivateKeyPemBase64.Type

export const PublicKeyPemBase64 = Schema.String.pipe(
  Schema.brand('PublicKeyPemBase64')
)
export type PublicKeyPemBase64 = typeof PublicKeyPemBase64.Type

export const PrivateKeyHolder = Schema.Struct({
  publicKeyPemBase64: PublicKeyPemBase64,
  privateKeyPemBase64: PrivateKeyPemBase64,
})
export type PrivateKeyHolder = typeof PrivateKeyHolder.Type
