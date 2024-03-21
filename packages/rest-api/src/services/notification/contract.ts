import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {z} from 'zod'

export const GetPublicKeyResponse = z.object({
  publicKey: PublicKeyPemBase64,
})

export type GetPublicKeyResponse = z.TypeOf<typeof GetPublicKeyResponse>
