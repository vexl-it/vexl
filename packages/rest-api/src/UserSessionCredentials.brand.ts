import {KeyHolder} from '@vexl-next/cryptography'
import {Schema} from 'effect'

// TODO refine properties
export const UserSessionCredentials = Schema.Struct({
  publicKey: KeyHolder.PublicKeyPemBase64,
  hash: Schema.String,
  signature: Schema.String,
})

export type UserSessionCredentials = typeof UserSessionCredentials.Type

export type GetUserSessionCredentials = () => UserSessionCredentials
