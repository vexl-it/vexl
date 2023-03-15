import {z} from 'zod'

export const PrivateKeyPemBase64 = z.string().brand<'PrivateKeyPemBase64'>()
export type PrivateKeyPemBase64 = z.TypeOf<typeof PrivateKeyPemBase64>

export const PrivateKeyRaw = z.string().brand<'PrivateKeyRaw'>()
export type PrivateKeyRaw = z.TypeOf<typeof PrivateKeyRaw>

export const PublicKeyPemBase64 = z.string().brand<'PublicKeyPemBase64'>()
export type PublicKeyPemBase64 = z.TypeOf<typeof PublicKeyPemBase64>

export const PublicKeyRaw = z.string().brand<'PublicKeyRaw'>()
export type PublicKeyRaw = z.TypeOf<typeof PublicKeyRaw>

export const PublicKeyHolder = z.object({
  publicKeyPemBase64: PublicKeyPemBase64,
  publicKeyRaw: PublicKeyRaw,
})
export type PublicKeyHolder = z.TypeOf<typeof PublicKeyHolder>

export const PrivateKeyHolder = PublicKeyHolder.extend({
  privateKeyPemBase64: PrivateKeyPemBase64,
  privateKeyRaw: PrivateKeyRaw,
})
export type PrivateKeyHolder = z.TypeOf<typeof PrivateKeyHolder>
