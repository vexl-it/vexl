import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {Schema} from 'effect'
import {VexlAuthHeader} from './VexlAuthHeader'

export const UserSessionCredentials = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hash: HashedPhoneNumber,
  signature: EcdsaSignature,
  vexlAuthHeader: Schema.optional(VexlAuthHeader),
})

export type UserSessionCredentials = typeof UserSessionCredentials.Type

export type GetUserSessionCredentials = () => UserSessionCredentials
