import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {Schema} from 'effect'
import {HashedPhoneNumberE} from './HashedPhoneNumber.brand'

export const CommonConnectionsForUser = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  common: Schema.Struct({
    hashes: Schema.Array(HashedPhoneNumberE),
  }),
})
export type CommonConnectionsForUser = typeof CommonConnectionsForUser.Type
