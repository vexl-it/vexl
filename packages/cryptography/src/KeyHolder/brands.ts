import {Brand, Schema} from 'effect'
import {z} from 'zod'

export const PrivateKeyPemBase64 = z
  .string()
  .transform((v) =>
    Brand.nominal<typeof v & Brand.Brand<'PrivateKeyPemBase64'>>()(v)
  )
export const PrivateKeyPemBase64E = Schema.String.pipe(
  Schema.brand('PrivateKeyPemBase64')
)
export type PrivateKeyPemBase64 = typeof PrivateKeyPemBase64E.Type

export const PublicKeyPemBase64 = z
  .string()
  .transform((v) =>
    Brand.nominal<typeof v & Brand.Brand<'PublicKeyPemBase64'>>()(v)
  )
export const PublicKeyPemBase64E = Schema.String.pipe(
  Schema.brand('PublicKeyPemBase64')
)
export type PublicKeyPemBase64 = typeof PublicKeyPemBase64E.Type

export const PrivateKeyHolder = z
  .object({
    publicKeyPemBase64: PublicKeyPemBase64,
    privateKeyPemBase64: PrivateKeyPemBase64,
  })
  .readonly()

export const PrivateKeyHolderE = Schema.Struct({
  publicKeyPemBase64: PublicKeyPemBase64E,
  privateKeyPemBase64: PrivateKeyPemBase64E,
})

export type PrivateKeyHolder = z.TypeOf<typeof PrivateKeyHolder>
export type PrivateKeyHolderE = typeof PrivateKeyHolderE.Type
