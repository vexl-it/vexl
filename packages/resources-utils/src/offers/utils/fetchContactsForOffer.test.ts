import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {
  SERVER_TO_CLIENT_HASHED_NUMBER_PREFIX,
  ServerToClientHashedNumber,
} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {Array, Effect, Schema} from 'effect'
import {
  fetchMyConnections,
  mergeCommonConnections,
} from './fetchContactsForOffer'

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

it("filters the user's own phone numbers' keys out of connections", async () => {
  const myExtraNumberV1 = publicKey('my-extra-number')
  const myExtraNumberV2 = Schema.decodeSync(PublicKeyV2)('V2_PUB_my-extra')
  const carol = Schema.decodeSync(PublicKeyV2)('V2_PUB_carol')
  const firstPage = {
    items: [alice, myExtraNumberV1],
    nextPageToken: 'next',
    hasNext: true,
  }
  const lastPage = {
    items: [myExtraNumberV2, carol, bob],
    nextPageToken: null,
    hasNext: false,
  }

  const connections = await Effect.runPromise(
    fetchMyConnections({
      contactApi: {
        fetchMyContactsPaginated: ({nextPageToken}) =>
          Effect.succeed({
            ...(nextPageToken === 'next' ? lastPage : firstPage),
            limit: 2,
          }),
      },
      level: 'SECOND',
      ownPublicKeys: [myExtraNumberV1, myExtraNumberV2],
    })
  )

  expect(connections).toEqual([alice, carol, bob])
})
