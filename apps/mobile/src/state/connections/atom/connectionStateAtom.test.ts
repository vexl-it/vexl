import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {Effect, HashMap, Option, Schema} from 'effect'
import {createStore} from 'jotai'
import {apiAtom} from '../../../api'
import {ConnectionsState} from '../domain'
import connectionStateAtom, {
  fetchConnectionsActionAtom,
} from './connectionStateAtom'

jest.mock('../../../utils/atomUtils/atomWithParsedMmkvStorage', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    atomWithParsedMmkvStorage: (_key: string, initial: unknown) =>
      Object.assign(atom(initial), {flushNow: jest.fn()}),
  }
})
jest.mock('../../../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    apiAtom: atom({
      contact: {
        fetchMyContactsPaginated: jest.fn(),
        fetchCommonConnectionsPaginated: jest.fn(),
      },
    }),
  }
})
jest.mock('../../clubs/atom/clubsWithMembersAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {clubsWithMembersAtom: atom([])}
})
jest.mock('../../clubs/utils', () => ({getClubReach: jest.fn()}))
jest.mock(
  '../../contacts/atom/ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom',
  () => {
    const {atom} = jest.requireActual('jotai')
    const {Effect, HashMap} = jest.requireActual('effect')
    return {
      ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom: atom(
        null,
        () =>
          Effect.succeed(
            HashMap.make(['ServerToClientHash:friend', 'new-friend'])
          )
      ),
    }
  }
)
jest.mock('../../../utils/notifications', () => {
  const {Effect} = jest.requireActual('effect')
  return {getNotificationTokenE: () => Effect.succeed(null)}
})
jest.mock(
  '../../../utils/notifications/showDebugNotificationIfEnabled',
  () => ({showDebugNotificationIfEnabled: jest.fn()})
)
jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
  reportErrorE: jest.fn(),
}))
jest.mock('../../ActionBenchmarks', () => ({
  effectWithEnsuredBenchmark: () => (effect: unknown) => effect,
}))

it('fetches the latest graph without storing it', async () => {
  const store = createStore()
  const publicKey = generatePrivateKey().publicKeyPemBase64
  store.set(
    connectionStateAtom,
    Schema.decodeUnknownSync(ConnectionsState)({
      lastUpdate: 0,
      firstLevel: [],
      secondLevel: [publicKey],
      commonFriends: [[publicKey, ['old-friend']]],
      verifiedFriends: [],
    })
  )
  const previous = store.get(connectionStateAtom)
  const api = store.get(apiAtom).contact
  jest.mocked(api.fetchMyContactsPaginated).mockImplementation(({level}) =>
    Effect.succeed({
      items: level === 'FIRST' ? [] : [publicKey],
      nextPageToken: null,
      hasNext: false,
      limit: 500,
    })
  )
  jest.mocked(api.fetchCommonConnectionsPaginated).mockReturnValue(
    Effect.succeed({
      items: [
        {
          publicKey,
          common: {
            hashes: [
              Schema.decodeUnknownSync(ServerToClientHashedNumber)(
                'ServerToClientHash:friend'
              ),
            ],
            verifiedHashes: [],
          },
        },
      ],
      nextPageToken: null,
      hasNext: false,
      limit: 500,
    })
  )
  const next = await Effect.runPromise(store.set(fetchConnectionsActionAtom))
  expect(Option.getOrThrow(HashMap.get(next.commonFriends, publicKey))).toEqual(
    ['new-friend']
  )
  expect(store.get(connectionStateAtom)).toBe(previous)
})
