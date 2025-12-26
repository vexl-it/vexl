import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {HashMap, Option, Schema} from 'effect'
import {HashedPhoneNumber} from './HashedPhoneNumber.brand'

export const CommonConnectionsForUsers = Schema.HashMap({
  key: PublicKeyPemBase64,
  value: Schema.Array(HashedPhoneNumber),
})

export type CommonConnectionsForUsers = typeof CommonConnectionsForUsers.Type

export const CommonConnectionsForUser = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hashes: Schema.Array(HashedPhoneNumber),
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
