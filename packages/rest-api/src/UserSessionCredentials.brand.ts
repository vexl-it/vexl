import {z} from 'zod'
import {PrivateKey} from '@vexl-next/cryptography'

// TODO refine properties
export const UserSessionCredentials = z
  .object({
    privateKey: z.custom<PrivateKey>((one) => one instanceof PrivateKey),
    hash: z.string(),
    signature: z.string(),
  })
  .brand<'UserSessionCredentials'>()

export type UserSessionCredentials = z.TypeOf<typeof UserSessionCredentials>

export type GetUserSessionCredentials = () => UserSessionCredentials
