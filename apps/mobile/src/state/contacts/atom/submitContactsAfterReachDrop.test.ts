/**
 * Runs the REAL re-import -> sync -> reach-drop guard -> connection state
 * pipeline for a user whose whole network disappeared (e.g. it only came
 * through numbers banned from connecting people). Only device IO, network,
 * UI and notes are mocked.
 */
import {Array, Effect, Schema} from 'effect'
import {createStore, type ExtractAtomArgs} from 'jotai'
import {Alert} from 'react-native'

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}))
jest.mock('expo-file-system', () => ({
  Paths: {document: '/mock/documents'},
  File: jest.fn().mockImplementation(() => ({exists: false, size: 0})),
}))
jest.mock('expo-contacts', () => ({
  getPermissionsAsync: jest.fn(async () => ({
    granted: true,
    canAskAgain: true,
    accessPrivileges: 'all',
  })),
}))
jest.mock('../getDeviceContactsFromSystem', () => ({
  getDeviceContactsFromSystem: jest.fn(async () =>
    [0, 1, 2].map((i) => ({
      id: `contact-${i}`,
      firstName: `First${i}`,
      lastName: `Last${i}`,
      name: `First${i} Last${i}`,
      phoneNumbers: [{label: 'mobile', number: `+42060110000${i}`}],
    }))
  ),
}))
jest.mock('../../../utils/toE164PhoneNumberWithDefaultCountryCode', () => {
  const {toE164PhoneNumber} = jest.requireActual(
    '@vexl-next/domain/src/general/E164PhoneNumber.brand'
  )
  return {
    __esModule: true,
    default: (number: string) => toE164PhoneNumber(number, 'CZ'),
  }
})
jest.mock('../../../utils/localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    __esModule: true,
    translationAtom: atom({t: (key: string) => key}),
    useTranslation: () => ({t: (key: string) => key}),
  }
})
jest.mock('../../../utils/localization/formatting', () => ({
  formatInteger: (n: number) => String(n),
}))
jest.mock('../../../utils/localization/formattingLocaleAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {formattingLocaleAtom: atom('en-US')}
})
jest.mock('../../../utils/useCommonErrorMessages', () => ({
  toCommonErrorMessage: () => 'common error',
}))
jest.mock('../../../utils/runAfterAnimationFrames', () => {
  const {Effect} = jest.requireActual('effect')
  return {waitForNextAnimationFrameEffect: () => Effect.void}
})
jest.mock('../../../components/LoadingOverlayProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {loadingOverlayDisplayedAtom: atom(false)}
})
jest.mock('../../../components/UploadingOfferProgressModal/atoms', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    offerProgressModalActionAtoms: {
      show: atom(null, () => {}),
      showStep: atom(null, () => {}),
      hide: atom(null, () => {}),
      hideDeffered: atom(null, () => Effect.void),
    },
    waitUntilProgressModalIsFullyHiddenActionAtom: atom(
      null,
      () => Effect.void
    ),
  }
})
jest.mock('../../connections/atom/noteToConnectionsAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    noteRecordsToReencryptCountAtom: atom(0),
    updateAndReencryptAllNotesConnectionsActionAtom: atom(null, () =>
      Effect.succeed([])
    ),
  }
})
jest.mock('../../marketplace/atoms/myOffers', () => {
  const {atom} = jest.requireActual('jotai')
  return {areThereAnyMyOffersAtom: atom(false)}
})
jest.mock('../../notes/atoms/notesState', () => {
  const {atom} = jest.requireActual('jotai')
  return {areThereAnyMyNotesAtom: atom(false)}
})
jest.mock('../../session', () => {
  const {atom} = jest.requireActual('jotai')
  return {sessionDataOrDummyAtom: atom({privateKey: {}, keyPairV2: {}})}
})
jest.mock('../../marketplace/atoms/offersMissingOnServer', () => ({
  reencryptSingleOfferMissingOnServerWhenEditingActionAtom: null,
}))
jest.mock('../../clubs/atom/refreshClubsActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    syncAllClubsHandleStateWhenNotFoundActionAtom: atom(
      null,
      () => Effect.void
    ),
  }
})
jest.mock('../../clubs/atom/clubsWithMembersAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {clubsWithMembersAtom: atom([])}
})
jest.mock(
  './ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom',
  () => {
    const {atom} = jest.requireActual('jotai')
    const {Effect, HashMap} = jest.requireActual('effect')
    return {
      ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom: atom(
        null,
        () => Effect.succeed(HashMap.empty())
      ),
    }
  }
)
jest.mock(
  '../../../utils/notifications/showDebugNotificationIfEnabled',
  () => ({showDebugNotificationIfEnabled: jest.fn()})
)
jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('../../ActionBenchmarks', () => ({
  effectWithEnsuredBenchmark: () => (effect: unknown) => effect,
}))

const mockImportContacts = jest.fn()
const mockFirstLevelKeys = jest.fn((): string[] => [])
jest.mock('../../../api', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  const emptyPage = {items: [], nextPageToken: null, hasNext: false, limit: 500}
  return {
    apiAtom: atom({
      contact: {
        importContacts: (request: unknown) => mockImportContacts(request),
        fetchMyContactsPaginated: ({level}: {level: string}) =>
          Effect.succeed({
            ...emptyPage,
            items: level === 'FIRST' ? mockFirstLevelKeys() : [],
          }),
        fetchCommonConnectionsPaginated: () => Effect.succeed(emptyPage),
      },
      offer: {},
    }),
  }
})

// eslint-disable-next-line import/first
import {ConnectionsState} from '../../connections/domain'
// eslint-disable-next-line import/first
import connectionStateAtom, {
  fetchConnectionsActionAtom,
  unexpectedReachDropDetectedAtom,
  UnexpectedReachDropError,
} from '../../connections/atom/connectionStateAtom'
// eslint-disable-next-line import/first
import {
  persistentDataAboutReachAndImportedContactsAtom,
  persistentDataAboutReachAtom,
} from '../../connections/atom/reachNumberWithoutClubsConnectionsMmkvAtom'
// eslint-disable-next-line import/first
import {updateAndReencryptAllConnectionsActionAtom} from '../../connections/atom/updateAndReencryptAllConnectionsActionAtom'
// eslint-disable-next-line import/first
import {submitContactsActionAtom} from './submitContactsActionAtom'

class ImportFailedError extends Schema.TaggedError<ImportFailedError>()(
  'ImportFailedError',
  {}
) {}

const reimportParams: ExtractAtomArgs<typeof submitContactsActionAtom>[0] = {
  normalizeAndImportAll: true,
  showOfferReencryptionDialog: true,
}

function storeWithLostNetwork(): ReturnType<typeof createStore> {
  const store = createStore()
  store.set(
    connectionStateAtom,
    Schema.decodeUnknownSync(ConnectionsState)({
      lastUpdate: 1,
      firstLevel: Array.makeBy(60, (i) => `V2_PUB_${i}`),
      secondLevel: [],
      commonFriends: [],
      verifiedFriends: [],
    })
  )
  store.set(persistentDataAboutReachAndImportedContactsAtom, {
    reach: 60,
    numberOfImportedContacts: 3,
  })
  return store
}

async function expectGuardArmed(
  store: ReturnType<typeof createStore>,
  previous: ConnectionsState
): Promise<void> {
  const error = await Effect.runPromise(
    store.set(fetchConnectionsActionAtom).pipe(Effect.flip)
  )
  expect(error).toBeInstanceOf(UnexpectedReachDropError)
  expect(store.get(connectionStateAtom)).toBe(previous)
  expect(store.get(persistentDataAboutReachAtom)).toBe(60)
}

beforeEach(() => {
  const {storage} = jest.requireActual('../../../utils/mmkv/effectMmkv')
  storage._storage.clearAll()
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  mockFirstLevelKeys.mockReturnValue([])
  mockImportContacts.mockImplementation(({contacts}: {contacts: string[]}) =>
    Effect.succeed({
      imported: true,
      message: 'ok',
      phoneNumberHashesToServerToClientHash: contacts.map((hash) => ({
        hashedNumber: hash,
        serverToClientHash: `ServerToClientHash:${hash}`,
      })),
    })
  )
})

it('accepts an empty graph after the user confirmed the re-import', async () => {
  const store = storeWithLostNetwork()
  // Marks the contacts as imported, like on a device that imported them before.
  await Effect.runPromise(store.set(submitContactsActionAtom, reimportParams))
  store.set(unexpectedReachDropDetectedAtom, false)
  mockImportContacts.mockClear()

  const result = await Effect.runPromise(
    store.set(submitContactsActionAtom, {
      ...reimportParams,
      acceptEmptyGraph: true,
    })
  )

  expect(result).toBe('success')
  expect(mockImportContacts).toHaveBeenCalledTimes(1)
  expect(mockImportContacts).toHaveBeenCalledWith(
    expect.objectContaining({
      // Not a replace: the server keeps what it has and only adds what is
      // missing, so nothing is dropped or counted as new if a batch fails.
      replace: false,
      contacts: expect.objectContaining({length: 3}),
    })
  )
  expect(store.get(connectionStateAtom).firstLevel).toEqual([])
  expect(store.get(connectionStateAtom).secondLevel).toEqual([])
  expect(store.get(persistentDataAboutReachAtom)).toBe(0)
  expect(store.get(unexpectedReachDropDetectedAtom)).toBe(false)

  // Later ordinary syncs no longer treat the empty graph as a reach drop.
  const next = await Effect.runPromise(store.set(fetchConnectionsActionAtom))
  expect(next.firstLevel).toEqual([])
  expect(store.get(unexpectedReachDropDetectedAtom)).toBe(false)
})

it('arms the guard again once an ordinary sync finds a network', async () => {
  const store = storeWithLostNetwork()
  await Effect.runPromise(
    store.set(submitContactsActionAtom, {
      ...reimportParams,
      acceptEmptyGraph: true,
    })
  )
  expect(store.get(persistentDataAboutReachAtom)).toBe(0)

  mockFirstLevelKeys.mockReturnValue(Array.makeBy(60, (i) => `V2_PUB_${i}`))
  await Effect.runPromise(
    store.set(updateAndReencryptAllConnectionsActionAtom, {
      isInBackground: false,
    })
  )
  expect(store.get(connectionStateAtom).firstLevel).toHaveLength(60)
  expect(store.get(persistentDataAboutReachAtom)).toBe(60)

  mockFirstLevelKeys.mockReturnValue([])
  const error = await Effect.runPromise(
    store.set(fetchConnectionsActionAtom).pipe(Effect.flip)
  )
  expect(error).toBeInstanceOf(UnexpectedReachDropError)
})

it('keeps the guard armed when an ordinary sync finds a smaller network', async () => {
  const store = storeWithLostNetwork()

  mockFirstLevelKeys.mockReturnValue(Array.makeBy(40, (i) => `V2_PUB_${i}`))
  await Effect.runPromise(
    store.set(updateAndReencryptAllConnectionsActionAtom, {
      isInBackground: false,
    })
  )
  expect(store.get(connectionStateAtom).firstLevel).toHaveLength(40)
  expect(store.get(persistentDataAboutReachAtom)).toBe(60)

  mockFirstLevelKeys.mockReturnValue([])
  const error = await Effect.runPromise(
    store.set(fetchConnectionsActionAtom).pipe(Effect.flip)
  )
  expect(error).toBeInstanceOf(UnexpectedReachDropError)
})

it('keeps rejecting an empty graph after an ordinary import', async () => {
  const store = storeWithLostNetwork()
  const previous = store.get(connectionStateAtom)

  await Effect.runPromise(store.set(submitContactsActionAtom, reimportParams))

  expect(store.get(unexpectedReachDropDetectedAtom)).toBe(true)
  await expectGuardArmed(store, previous)
})

it('keeps the guard armed when the confirmed re-import fails to upload', async () => {
  const store = storeWithLostNetwork()
  const previous = store.get(connectionStateAtom)
  mockImportContacts.mockReturnValue(Effect.fail(new ImportFailedError()))

  const result = await Effect.runPromise(
    store.set(submitContactsActionAtom, {
      ...reimportParams,
      acceptEmptyGraph: true,
    })
  )

  expect(result).toBe('otherError')
  await expectGuardArmed(store, previous)
})
