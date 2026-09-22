import {
  generatePrivateKey,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {Effect, HashMap, Option, Schema} from 'effect'
import {createStore} from 'jotai'
import {apiAtom} from '../../../api'
import {ConnectionsState} from '../domain'
import connectionStateAtom, {
  fetchConnectionsActionAtom,
  unexpectedReachDropDetectedAtom,
  UnexpectedReachDropError,
} from './connectionStateAtom'
import {persistentDataAboutReachAndImportedContactsAtom} from './reachNumberWithoutClubsConnectionsMmkvAtom'

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

const publicKey = generatePrivateKey().publicKeyPemBase64

function mockGraph(
  store: ReturnType<typeof createStore>,
  levels: {
    firstLevel: PublicKeyPemBase64[]
    secondLevel: PublicKeyPemBase64[]
  }
): void {
  const api = store.get(apiAtom).contact
  jest.mocked(api.fetchMyContactsPaginated).mockImplementation(({level}) =>
    Effect.succeed({
      items: level === 'FIRST' ? levels.firstLevel : levels.secondLevel,
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
}

beforeEach(() => {
  jest.clearAllMocks()
})

it('fetches the latest graph without storing it', async () => {
  const store = createStore()
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
  mockGraph(store, {firstLevel: [], secondLevel: [publicKey]})
  const next = await Effect.runPromise(store.set(fetchConnectionsActionAtom))
  expect(Option.getOrThrow(HashMap.get(next.commonFriends, publicKey))).toEqual(
    ['new-friend']
  )
  expect(store.get(connectionStateAtom)).toBe(previous)
  expect(store.get(unexpectedReachDropDetectedAtom)).toBe(false)
})

it('fails when a previously large graph comes back empty', async () => {
  const store = createStore()
  store.set(persistentDataAboutReachAndImportedContactsAtom, {
    reach: 60,
    numberOfImportedContacts: 5,
  })
  const previous = store.get(connectionStateAtom)
  mockGraph(store, {firstLevel: [], secondLevel: []})
  const result = await Effect.runPromise(
    store.set(fetchConnectionsActionAtom).pipe(Effect.flip)
  )
  expect(result).toBeInstanceOf(UnexpectedReachDropError)
  expect(
    store.get(apiAtom).contact.fetchCommonConnectionsPaginated
  ).not.toHaveBeenCalled()
  expect(store.get(connectionStateAtom)).toBe(previous)
  expect(store.get(unexpectedReachDropDetectedAtom)).toBe(true)
})

it('accepts an empty graph for a user who never had reach', async () => {
  const store = createStore()
  mockGraph(store, {firstLevel: [], secondLevel: []})
  const next = await Effect.runPromise(store.set(fetchConnectionsActionAtom))
  expect(next.firstLevel).toEqual([])
  expect(next.secondLevel).toEqual([])
  expect(store.get(unexpectedReachDropDetectedAtom)).toBe(false)
})
