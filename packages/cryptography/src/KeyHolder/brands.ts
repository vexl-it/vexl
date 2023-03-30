import {z} from 'zod'

export const PrivateKeyPemBase64 = z.string().brand<'PrivateKeyPemBase64'>()
export type PrivateKeyPemBase64 = z.TypeOf<typeof PrivateKeyPemBase64>

export const PublicKeyPemBase64 = z.string().brand<'PublicKeyPemBase64'>()
export type PublicKeyPemBase64 = z.TypeOf<typeof PublicKeyPemBase64>

export const PrivateKeyHolder = z.object({
  publicKeyPemBase64: PublicKeyPemBase64,
  privateKeyPemBase64: PrivateKeyPemBase64,
})
export type PrivateKeyHolder = z.TypeOf<typeof PrivateKeyHolder>
