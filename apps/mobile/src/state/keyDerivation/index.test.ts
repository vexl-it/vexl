import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  KeyDerivationIndex,
  MasterSeed,
} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {deriveInboxPrivateKey} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {Array, Effect, Exit, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import {
  createClubKeysActionAtom,
  createInboxPrivateKeyActionAtom,
  initializeKeyDerivationCountersActionAtom,
  keyDerivationCountersAtom,
  raiseKeyDerivationCountersActionAtom,
} from '.'
import {KEY_DERIVATION_COUNTERS_MMKV_KEY} from '../../utils/mmkv/criticalMmkvKeys'
import {storage} from '../../utils/mmkv/effectMmkv'
import {sessionHolderAtom} from '../session'
import {dummySession} from '../session/dummySesssion'

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}))
jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 2,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

const mockExistingInboxPublicKeys: PublicKeyPemBase64[] = []
const mockCheckInboxesExist = jest.fn(
  ({publicKeys}: {publicKeys: readonly PublicKeyPemBase64[]}) =>
    Effect.succeed({
      existingPublicKeys: Array.intersection(
        publicKeys,
        mockExistingInboxPublicKeys
      ),
    })
)
const mockGetClubInfo = jest.fn(() => Effect.fail(new NotFoundError()))
jest.mock('../../api', () => ({
  apiAtom: jest.requireActual('jotai').atom(() => ({
    chat: {checkInboxesExist: mockCheckInboxesExist},
    contact: {getClubInfo: mockGetClubInfo},
  })),
}))
jest.mock('../../utils/notifications', () => ({
  getNotificationTokenWithTimeoutE: () =>
    jest
      .requireActual('effect')
      .Effect.succeed(jest.requireActual('effect').Option.none()),
}))

const masterSeed = Schema.decodeSync(MasterSeed)('22'.repeat(32))
const index = KeyDerivationIndex.make
const store = getDefaultStore()

const storedCounters = (): unknown =>
  JSON.parse(storage._storage.getString(KEY_DERIVATION_COUNTERS_MMKV_KEY) ?? '')

describe('key derivation counters', () => {
  beforeEach(() => {
    store.set(sessionHolderAtom, {
      state: 'loggedIn',
      session: {...dummySession, masterSeed},
    })
  })

  it('derives inbox keys from consecutive indexes and persists the next index right away', async () => {
    store.set(initializeKeyDerivationCountersActionAtom)

    const first = await Effect.runPromise(
      store.set(createInboxPrivateKeyActionAtom)
    )
    const second = await Effect.runPromise(
      store.set(createInboxPrivateKeyActionAtom)
    )

    expect(first).toEqual(
      await Effect.runPromise(deriveInboxPrivateKey(masterSeed, index(0)))
    )
    expect(second).toEqual(
      await Effect.runPromise(deriveInboxPrivateKey(masterSeed, index(1)))
    )
    expect(storedCounters()).toEqual({nextInboxIndex: 2, nextClubIndex: 0})

    await Effect.runPromise(store.set(createClubKeysActionAtom))
    expect(storedCounters()).toEqual({nextInboxIndex: 2, nextClubIndex: 1})
  })

  it('only raises counters', () => {
    store.set(raiseKeyDerivationCountersActionAtom, {
      nextInboxIndex: index(0),
      nextClubIndex: index(40),
    })

    expect(store.get(keyDerivationCountersAtom)).toEqual({
      nextInboxIndex: 2,
      nextClubIndex: 40,
    })
  })

  it('refuses to derive keys without a logged in session', async () => {
    store.set(sessionHolderAtom, {state: 'loggedOut'})

    const exit = await Effect.runPromiseExit(
      store.set(createInboxPrivateKeyActionAtom)
    )

    expect(Exit.isFailure(exit)).toBe(true)
    expect(store.get(keyDerivationCountersAtom).nextInboxIndex).toBe(2)
  })

  it('recovers lost counters from the server before handing out an index', async () => {
    storage._storage.remove(KEY_DERIVATION_COUNTERS_MMKV_KEY)
    mockExistingInboxPublicKeys.push(
      (await Effect.runPromise(deriveInboxPrivateKey(masterSeed, index(3))))
        .publicKeyPemBase64
    )

    const allocated = await Effect.runPromise(
      Effect.all(
        [
          store.set(createInboxPrivateKeyActionAtom),
          store.set(createInboxPrivateKeyActionAtom),
        ],
        {concurrency: 'unbounded'}
      )
    )
    const expected = await Effect.runPromise(
      Effect.all([
        deriveInboxPrivateKey(masterSeed, index(104)),
        deriveInboxPrivateKey(masterSeed, index(105)),
      ])
    )

    // One recovery for both: a batch with the hit and the empty one after it.
    expect(mockCheckInboxesExist).toHaveBeenCalledTimes(2)
    expect(mockGetClubInfo).toHaveBeenCalledTimes(20)
    expect(allocated).toEqual(expect.arrayContaining(expected))
    // The club counter was already higher in memory and is never lowered.
    expect(storedCounters()).toEqual({nextInboxIndex: 106, nextClubIndex: 40})
  })
})
