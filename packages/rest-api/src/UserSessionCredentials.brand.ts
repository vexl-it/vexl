import {Schema} from '@effect/schema'
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
export const UserSessionCredentialsE = Schema.Struct({
  publicKey: KeyHolder.PublicKeyPemBase64E,
  hash: Schema.String,
  signature: Schema.String,
})

export type UserSessionCredentials = Schema.Schema.Type<
  typeof UserSessionCredentialsE
>

export type GetUserSessionCredentials = () => UserSessionCredentials
