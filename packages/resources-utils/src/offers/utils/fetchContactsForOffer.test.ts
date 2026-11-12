import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  SERVER_TO_CLIENT_HASHED_NUMBER_PREFIX,
  ServerToClientHashedNumber,
} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {Array, Schema} from 'effect'
import {mergeCommonConnections} from './fetchContactsForOffer'

const publicKey = Schema.decodeSync(PublicKeyPemBase64)
const hashes = (...values: string[]): ServerToClientHashedNumber[] =>
  Array.map(values, (one) =>
    Schema.decodeSync(ServerToClientHashedNumber)(
      `${SERVER_TO_CLIENT_HASHED_NUMBER_PREFIX}${one}`
    )
  )

const alice = publicKey('alice')
const bob = publicKey('bob')

it('merges common connections per public key across phone numbers', () => {
  const underMainNumber = [
    {
      publicKey: alice,
      common: {hashes: hashes('a', 'b'), verifiedHashes: hashes('a')},
    },
  ]
  const underExtraNumber = [
    {
      publicKey: alice,
      common: {hashes: hashes('b', 'c'), verifiedHashes: hashes('c')},
    },
    {publicKey: bob, common: {hashes: hashes('d'), verifiedHashes: []}},
  ]

  expect(mergeCommonConnections([underMainNumber, underExtraNumber])).toEqual([
    {
      publicKey: alice,
      common: {hashes: hashes('a', 'b', 'c'), verifiedHashes: hashes('a', 'c')},
    },
    {publicKey: bob, common: {hashes: hashes('d'), verifiedHashes: []}},
  ])
})

it('keeps a single number unchanged', () => {
  const connections = [
    {publicKey: bob, common: {hashes: hashes('d'), verifiedHashes: []}},
  ]

  expect(mergeCommonConnections([connections])).toEqual(connections)
})
