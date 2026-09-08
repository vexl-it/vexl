import {
  PublicKeyPemBase64,
  PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {HashMap, Option, Schema} from 'effect'
import {ContactHash} from './ContactHash.brand'

export const CommonConnectionsForUsers = Schema.HashMap({
  key: Schema.Union(PublicKeyPemBase64, PublicKeyV2),
  value: Schema.Array(ContactHash),
})

export type CommonConnectionsForUsers = typeof CommonConnectionsForUsers.Type

export const CommonConnectionsForUser = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hashes: Schema.Array(ContactHash),
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
