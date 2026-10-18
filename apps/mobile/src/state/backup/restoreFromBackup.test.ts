import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateKeyPair} from '@vexl-next/cryptography/src/operations/cryptobox'
import {
  generateClubUuid,
  type ClubKeys,
  type ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  KeyDerivationIndex,
  MasterSeed,
} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type BackupFile} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {
  deriveClubKeys,
  deriveInboxPrivateKey,
} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect, Option, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import messagingStateAtom from '../chat/atoms/messagingStateAtom'
import {clubsKeyHolderStorageAtom} from '../clubs/atom/clubsToKeyHolderV2Atom'
import {keyDerivationCountersAtom} from '../keyDerivation'
import {postLoginFlowCompletedScreensAtom} from '../postLoginOnboarding'
import {sessionHolderAtom} from '../session'
import {dummySession} from '../session/dummySesssion'
import {
  restoreFromBackupStateAtom,
  showRestoredAccountInfoAtom,
  startRestoreFromBackupActionAtom,
} from './restoreFromBackup'

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
jest.mock('url-join', () => jest.fn((...parts: string[]) => parts.join('/')))
jest.mock('../../components/ErrorAlert', () => ({showErrorAlert: jest.fn()}))
jest.mock('../defaultCurrencyBaseOnCountryCodeActionAtom', () => ({
  defaultCurrencyBaseOnCountryCodeActionAtom: jest
    .requireActual('jotai')
    .atom(null, () => {}),
}))

const mockSessionNotificationToken = jest.fn()
jest.mock(
  '../notifications/actions/createVexlSecretAndSessionTokenActionAtom',
  () => {
    const {Effect, Option} = jest.requireActual('effect')
    return {
      createVexlSecretAndSessionTokenActionAtom: jest
        .requireActual('jotai')
        .atom(null, () =>
          Effect.succeed({
            expoToken: null,
            sessionNotificationToken: Option.some(
              mockSessionNotificationToken()
            ),
          })
        ),
    }
  }
)

const mockDiscardSecret = jest.fn()
jest.mock('../notifications/actions/invalidateVexlSecretActionAtom', () => ({
  invalidateVexlSecretActionAtom: jest
    .requireActual('jotai')
    .atom(null, () =>
      jest.requireActual('effect').Effect.sync(mockDiscardSecret)
    ),
}))

const mockRestoreUser = jest.fn()
const mockCreateUser = jest.fn()
jest.mock('../../api/contactApiForSession', () => ({
  contactApiForSession: () => ({
    restoreUser: mockRestoreUser,
    createUser: mockCreateUser,
  }),
}))

const mockCheckInboxesExist = jest.fn()
const mockGetClubInfo = jest.fn()
jest.mock('../../api', () => ({
  apiAtom: jest.requireActual('jotai').atom(() => ({
    chat: {checkInboxesExist: mockCheckInboxesExist},
    contact: {getClubInfo: mockGetClubInfo},
  })),
}))
jest.mock('../../utils/notifications', () => ({}))

const mockRefreshOffers = jest.fn()
jest.mock('../marketplace/atoms/refreshOffersActionAtom', () => ({
  refreshOffersActionAtom: jest
    .requireActual('jotai')
    .atom(null, () =>
      jest.requireActual('effect').Effect.sync(mockRefreshOffers)
    ),
}))
const mockUpdateOfferNotificationTokens = jest.fn()
jest.mock(
  '../marketplace/checkNotificationTokensAndVersionsAndUpdateOffersTask',
  () => ({
    updateMissingOfferNotificationTokensActionAtom: jest
      .requireActual('jotai')
      .atom(null, () =>
        jest
          .requireActual('effect')
          .Effect.sync(mockUpdateOfferNotificationTokens)
      ),
  })
)
jest.mock('../notes/atoms/refreshNotesActionAtom', () => ({
  refreshNotesActionAtom: jest
    .requireActual('jotai')
    .atom(null, () => jest.requireActual('effect').Effect.void),
}))

const store = getDefaultStore()
const masterSeed = Schema.decodeSync(MasterSeed)('55'.repeat(32))
const index = KeyDerivationIndex.make
const sessionNotificationToken = Schema.decodeSync(VexlNotificationToken)(
  'vexl_nt_restored'
)

const randomClubKeys = async (): Promise<ClubKeys> => ({
  keyPair: await generateKeyPair(),
  oldKeyPair: generatePrivateKey(),
})

const setUp = async (): Promise<{
  backup: BackupFile
  legacyClubUuid: ClubUuid
  scannedClubUuid: ClubUuid
}> => {
  const legacyClubUuid = generateClubUuid()
  const scannedClubUuid = generateClubUuid()
  const backup: BackupFile = {
    version: 1,
    session: {
      phoneNumber: dummySession.phoneNumber,
      sessionCredentials: {
        ...dummySession.sessionCredentials,
        hash: dummySession.sessionCredentials.vexlAuthHeader.data.hash,
      },
      privateKey: dummySession.privateKey,
      keyPairV2: dummySession.keyPairV2,
      isLiquidityProvider: true,
    },
    masterSeed,
    legacyInboxKeys: [generatePrivateKey()],
    legacyClubKeys: {[legacyClubUuid]: await randomClubKeys()},
    legacyClubKeysWaitingForAdmission: [await randomClubKeys()],
  }

  const [derivedInbox, derivedClub0, derivedClub1] = await Effect.runPromise(
    Effect.all([
      deriveInboxPrivateKey(masterSeed, index(7)),
      deriveClubKeys(masterSeed, index(0)),
      deriveClubKeys(masterSeed, index(1)),
    ])
  )
  mockCheckInboxesExist.mockImplementation(
    ({publicKeys}: {publicKeys: readonly string[]}) =>
      Effect.succeed({
        existingPublicKeys: Array.filter(
          publicKeys,
          (key) => key === derivedInbox.publicKeyPemBase64
        ),
      })
  )
  const clubsByPublicKey = new Map<string, ClubUuid>([
    // Also among the legacy clubs, under a different key - the legacy one wins.
    [derivedClub0.keyPair.publicKey, legacyClubUuid],
    [derivedClub1.keyPair.publicKey, scannedClubUuid],
  ])
  mockGetClubInfo.mockImplementation(
    ({keyPairV2}: {keyPairV2: {publicKey: string}}) => {
      const uuid = clubsByPublicKey.get(keyPairV2.publicKey)
      return uuid
        ? Effect.succeed({clubInfoForUser: {club: {uuid}}})
        : Effect.fail(new NotFoundError())
    }
  )
  mockSessionNotificationToken.mockReturnValue(sessionNotificationToken)

  return {backup, legacyClubUuid, scannedClubUuid}
}

const callOrder = (mock: jest.Mock): number[] => mock.mock.invocationCallOrder

describe('restore from backup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    store.set(sessionHolderAtom, {state: 'loggedOut'})
    store.set(messagingStateAtom, [])
    store.set(restoreFromBackupStateAtom, {state: 'idle'})
    store.set(showRestoredAccountInfoAtom, false)
  })

  it('scans first, restores the user last without creating one and stores the account right away', async () => {
    const {backup, legacyClubUuid, scannedClubUuid} = await setUp()
    mockRestoreUser.mockReturnValue(Effect.void)

    await Effect.runPromise(store.set(startRestoreFromBackupActionAtom, backup))

    expect(mockCreateUser).not.toHaveBeenCalled()
    expect(mockRestoreUser).toHaveBeenCalledTimes(1)
    expect(Math.min(...callOrder(mockRestoreUser))).toBeGreaterThan(
      Math.max(
        ...callOrder(mockCheckInboxesExist),
        ...callOrder(mockGetClubInfo)
      )
    )
    expect(mockDiscardSecret).not.toHaveBeenCalled()

    const sessionHolder = store.get(sessionHolderAtom)
    if (sessionHolder.state !== 'loggedIn')
      throw new Error(`Unexpected session state ${sessionHolder.state}`)
    const {session} = sessionHolder
    expect(mockRestoreUser).toHaveBeenCalledWith({
      loginSessionId: session.loginSessionId,
      vexlNotificationToken: Option.some(sessionNotificationToken),
      expoToken: Option.none(),
    })
    expect(session).toEqual({
      ...backup.session,
      version: 1,
      masterSeed,
      loginSessionId: session.loginSessionId,
      sessionNotificationToken,
    })
    expect(session.loginSessionId).not.toBe(dummySession.loginSessionId)

    const derivedInbox = await Effect.runPromise(
      deriveInboxPrivateKey(masterSeed, index(7))
    )
    expect(store.get(messagingStateAtom)).toEqual(
      Array.map(
        [backup.session.privateKey, ...backup.legacyInboxKeys, derivedInbox],
        (privateKey) => ({
          inbox: {privateKey},
          chats: [],
          restoredFromBackup: true,
        })
      )
    )
    expect(store.get(clubsKeyHolderStorageAtom)).toEqual({
      data: {
        [legacyClubUuid]: backup.legacyClubKeys[legacyClubUuid],
        [scannedClubUuid]: await Effect.runPromise(
          deriveClubKeys(masterSeed, index(1))
        ),
      },
      waitingForAdmission: backup.legacyClubKeysWaitingForAdmission,
    })
    expect(store.get(keyDerivationCountersAtom)).toEqual({
      nextInboxIndex: 400,
      nextClubIndex: 40,
    })
    expect(store.get(postLoginFlowCompletedScreensAtom)).toEqual(['usageInfo'])
    expect(store.get(showRestoredAccountInfoAtom)).toBe(true)
    expect(mockRefreshOffers).toHaveBeenCalled()
    expect(mockUpdateOfferNotificationTokens).toHaveBeenCalled()
    expect(store.get(restoreFromBackupStateAtom)).toEqual({state: 'idle'})
  })

  it('leaves the account untouched when a scan fails', async () => {
    const {backup} = await setUp()
    mockCheckInboxesExist.mockReturnValue(
      Effect.fail(new UnexpectedServerError({status: 500}))
    )

    await Effect.runPromise(store.set(startRestoreFromBackupActionAtom, backup))

    expect(store.get(restoreFromBackupStateAtom)).toEqual({
      state: 'failed',
      failure: 'unknown',
    })
    expect(mockSessionNotificationToken).not.toHaveBeenCalled()
    expect(mockRestoreUser).not.toHaveBeenCalled()
    expect(store.get(sessionHolderAtom).state).toBe('loggedOut')
    expect(store.get(messagingStateAtom)).toEqual([])
  })

  it('reports a backup the server no longer knows and throws the new notification secret away', async () => {
    const {backup} = await setUp()
    mockRestoreUser.mockReturnValue(Effect.fail(new UserNotFoundError()))

    await Effect.runPromise(store.set(startRestoreFromBackupActionAtom, backup))

    expect(store.get(restoreFromBackupStateAtom)).toEqual({
      state: 'failed',
      failure: 'backupNoLongerValid',
    })
    expect(mockDiscardSecret).toHaveBeenCalledTimes(1)
    expect(mockCreateUser).not.toHaveBeenCalled()
    expect(store.get(sessionHolderAtom).state).toBe('loggedOut')
    expect(store.get(messagingStateAtom)).toEqual([])
    expect(store.get(showRestoredAccountInfoAtom)).toBe(false)
  })
})
