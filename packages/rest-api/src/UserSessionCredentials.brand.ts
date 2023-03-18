import {z} from 'zod'

// TODO refine properties
export const UserSessionCredentials = z
  .object({
    publicKey: z.string(),
    hash: z.string(),
    signature: z.string(),
  })
  .brand<'UserSessionCredentials'>()

export type UserSessionCredentials = z.TypeOf<typeof UserSessionCredentials>

export type GetUserSessionCredentials = () => UserSessionCredentials
