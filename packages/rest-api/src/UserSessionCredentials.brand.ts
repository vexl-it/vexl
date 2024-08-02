import {KeyHolder} from '@vexl-next/cryptography'
import {z} from 'zod'

// TODO refine properties
export const UserSessionCredentials = z
  .object({
    publicKey: KeyHolder.PublicKeyPemBase64,
    hash: z.string(),
    signature: z.string(),
  })
  .readonly()

export type UserSessionCredentials = z.TypeOf<typeof UserSessionCredentials>

export type GetUserSessionCredentials = () => UserSessionCredentials
