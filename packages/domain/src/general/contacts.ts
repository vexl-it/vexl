import {
  type PublicKeyPemBase64,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder'
import {HashMap, Option, Schema} from 'effect'
import {HashedPhoneNumberE} from './HashedPhoneNumber.brand'

export const CommonConnectionsForUsers = Schema.HashMap({
  key: PublicKeyPemBase64E,
  value: Schema.Array(HashedPhoneNumberE),
})

export type CommonConnectionsForUsers = typeof CommonConnectionsForUsers.Type

export const CommonConnectionsForUser = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  hashes: Schema.Array(HashedPhoneNumberE),
})
export type CommonConnectionsForUser = typeof CommonConnectionsForUser.Type

export const commonConnectionsForOneUser =
  (publicKey: PublicKeyPemBase64) =>
  (
    comonConnectionsForUsers: CommonConnectionsForUsers
  ): Option.Option<CommonConnectionsForUser> =>
    HashMap.get(comonConnectionsForUsers, publicKey).pipe(
      Option.map((hashes) => ({
        publicKey,
        hashes,
      }))
    )
