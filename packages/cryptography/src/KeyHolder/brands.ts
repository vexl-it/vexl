import * as S from '@effect/schema/Schema'
import {Brand} from 'effect'
import {z} from 'zod'

export const PrivateKeyPemBase64 = z
  .string()
  .transform((v) =>
    Brand.nominal<typeof v & Brand.Brand<'PrivateKeyPemBase64'>>()(v)
  )
export const PrivateKeyPemBase64E = S.String.pipe(
  S.brand('PrivateKeyPemBase64')
)
export type PrivateKeyPemBase64 = S.Schema.Type<typeof PrivateKeyPemBase64E>

export const PublicKeyPemBase64 = z
  .string()
  .transform((v) =>
    Brand.nominal<typeof v & Brand.Brand<'PublicKeyPemBase64'>>()(v)
  )
export const PublicKeyPemBase64E = S.String.pipe(S.brand('PublicKeyPemBase64'))
export type PublicKeyPemBase64 = S.Schema.Type<typeof PublicKeyPemBase64E>

export const PrivateKeyHolder = z.object({
  publicKeyPemBase64: PublicKeyPemBase64,
  privateKeyPemBase64: PrivateKeyPemBase64,
})

export const PrivateKeyHolderE = S.Struct({
  publicKeyPemBase64: PublicKeyPemBase64E,
  privateKeyPemBase64: PrivateKeyPemBase64E,
})

export type PrivateKeyHolder = z.TypeOf<typeof PrivateKeyHolder>
export type PrivateKeyHolderE = S.Schema.Type<typeof PrivateKeyHolderE>
