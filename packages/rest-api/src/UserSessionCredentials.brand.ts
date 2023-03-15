import {z} from 'zod'
import {KeyHolder} from '@vexl-next/cryptography'

// TODO refine properties
export const UserSessionCredentials = z.object({
  publicKey: KeyHolder.PublicKeyPemBase64,
  hash: z.string(),
  signature: z.string(),
})

export type UserSessionCredentials = z.TypeOf<typeof UserSessionCredentials>

export type GetUserSessionCredentials = () => UserSessionCredentials
