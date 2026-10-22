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
import {
  VexlNotificationToken,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {type BackupFile} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {
  deriveClubKeys,
  deriveInboxPrivateKey,
} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect, Option, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import {showMarketplaceIntroDialogAtom} from '../../utils/preferences'
import messagingStateAtom from '../chat/atoms/messagingStateAtom'
import {clubsKeyHolderStorageAtom} from '../clubs/atom/clubsToKeyHolderV2Atom'
import {keyDerivationCountersAtom} from '../keyDerivation'
import {vexlNotificationTokenAtom} from '../notifications/vexlNotificationTokenAtom'
import {vexlTokenToKeyHolderAtom} from '../notifications/vexlTokenToKeyHolderAtom'
import {postLoginFlowCompletedScreensAtom} from '../postLoginOnboarding'
import {sessionHolderAtom} from '../session'
import {dummySession} from '../session/dummySesssion'
import {backupFileToRestoreAtom, backupKeyPairAtom} from './backupToRestore'
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
const mockGenerateNotificationToken = jest.fn()
const mockGetClubInfo = jest.fn()

jest.mock('../../api', () => ({
  apiAtom: jest.requireActual('jotai').atom(() => ({
    chat: {checkInboxesExist: mockCheckInboxesExist},
    contact: {getClubInfo: mockGetClubInfo},
    notification: {generateNotificationToken: mockGenerateNotificationToken},
  })),
}))
const mockExpoToken = jest.fn((): string | null => null)
jest.mock('../../utils/notifications', () => ({
  getNotificationTokenE: () =>
    jest.requireActual('effect').Effect.sync(mockExpoToken),
}))
const mockSyncNotificationTokens = jest.fn()
jest.mock(
  '../notifications/actions/syncVexlNotificationTokensActionAtom',
  () => ({
    syncVexlNotificationTokensActionAtom: jest
      .requireActual('jotai')
      .atom(null, (_: unknown, __: unknown, params: unknown) =>
        jest
          .requireActual('effect')
          .Effect.sync(() => mockSyncNotificationTokens(params))
      ),
  })
)

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
    updateOfferNotificationTokensActionAtom: jest
      .requireActual('jotai')
      .atom(null, (_: unknown, __: unknown, params: unknown) =>
        jest
          .requireActual('effect')
          .Effect.sync(() => mockUpdateOfferNotificationTokens(params))
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
    session: {
      phoneNumber: dummySession.phoneNumber,
      sessionCredentials: {
        ...dummySession.sessionCredentials,
        hash: dummySession.sessionCredentials.vexlAuthHeader.data.hash,
      },
      privateKey: dummySession.privateKey,
      keyPairV2: dummySession.keyPairV2,
      isLiquidityProvider: true,
      realUserData: {userName: Schema.decodeSync(UserName)('Satoshi')},
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
    store.set(vexlNotificationTokenAtom, {
      secret: null,
      systemVexlToken: null,
      marketingVexlToken: null,
      lastUpdatedMetadata: null,
    })
    store.set(vexlTokenToKeyHolderAtom, {data: {}})
    store.set(
      backupFileToRestoreAtom,
      Option.some({
        version: 1,
        publicKey: dummySession.keyPairV2.publicKey,
        ciphertext: 'ciphertext',
      })
    )
    store.set(backupKeyPairAtom, Option.some(dummySession.keyPairV2))
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
      realUserData: {userName: 'Satoshi', image: undefined},
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
          restoredAt: expect.any(Number),
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
      nextInboxIndex: 7 + 1 + 100,
      nextClubIndex: 1 + 1 + 10,
    })
    expect(store.get(postLoginFlowCompletedScreensAtom)).toEqual(['usageInfo'])
    expect(store.get(showRestoredAccountInfoAtom)).toBe(true)
    expect(store.get(showMarketplaceIntroDialogAtom)).toBe(false)
    expect(mockRefreshOffers).toHaveBeenCalled()
    // No secret in this backup: a new one was minted, so offer tokens follow.
    expect(mockUpdateOfferNotificationTokens).toHaveBeenCalledWith({
      regenerateAll: true,
    })
    expect(mockSyncNotificationTokens).not.toHaveBeenCalled()
    expect(store.get(restoreFromBackupStateAtom)).toEqual({state: 'idle'})
    expect(store.get(backupFileToRestoreAtom)).toEqual(Option.none())
    expect(store.get(backupKeyPairAtom)).toEqual(Option.none())
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
    // Kept for trying again.
    expect(Option.isSome(store.get(backupKeyPairAtom))).toBe(true)
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

  describe('with the old notification secret in the backup', () => {
    const secret = Schema.decodeSync(VexlNotificationTokenSecret)(
      'vexl_nt_secret_old_device'
    )
    const mintedSessionToken = Schema.decodeSync(VexlNotificationToken)(
      'vexl_nt_minted_with_old_secret'
    )
    const withSecret = async (): Promise<BackupFile> => ({
      ...(await setUp()).backup,
      notificationSecret: {secret},
    })

    beforeEach(() => {
      mockGenerateNotificationToken.mockReturnValue(
        Effect.succeed({token: mintedSessionToken})
      )
    })

    it('takes over the secret right after restoreUser with freshly minted tokens', async () => {
      const backup = await withSecret()
      mockRestoreUser.mockReturnValue(Effect.void)
      mockExpoToken.mockReturnValue('ExponentPushToken[new-phone]')

      await Effect.runPromise(
        store.set(startRestoreFromBackupActionAtom, backup)
      )

      expect(mockSessionNotificationToken).not.toHaveBeenCalled()
      expect(mockGenerateNotificationToken).toHaveBeenCalledWith(
        expect.objectContaining({secret})
      )
      expect(
        Math.max(...callOrder(mockGenerateNotificationToken))
      ).toBeLessThan(Math.min(...callOrder(mockRestoreUser)))
      expect(mockRestoreUser).toHaveBeenCalledWith(
        expect.objectContaining({
          vexlNotificationToken: Option.some(mintedSessionToken),
          expoToken: Option.some('ExponentPushToken[new-phone]'),
        })
      )
      expect(mockSyncNotificationTokens).toHaveBeenCalledWith({
        expoNotificationToken: 'ExponentPushToken[new-phone]',
      })
      expect(
        Math.min(...callOrder(mockSyncNotificationTokens))
      ).toBeGreaterThan(Math.max(...callOrder(mockRestoreUser)))
      // No tokens, so the takeover sync mints system and marketing ones.
      expect(store.get(vexlNotificationTokenAtom)).toEqual({
        secret,
        systemVexlToken: null,
        marketingVexlToken: null,
        lastUpdatedMetadata: null,
      })
      // Rebuilt once own offers and notes are back.
      expect(store.get(vexlTokenToKeyHolderAtom).data).toEqual({})
      const sessionHolder = store.get(sessionHolderAtom)
      expect(
        sessionHolder.state === 'loggedIn' &&
          sessionHolder.session.sessionNotificationToken
      ).toBe(mintedSessionToken)
      expect(mockUpdateOfferNotificationTokens).not.toHaveBeenCalled()
      expect(mockDiscardSecret).not.toHaveBeenCalled()
    })

    it('mints a new secret and offer tokens when the server no longer knows the old one', async () => {
      const backup = await withSecret()
      mockGenerateNotificationToken.mockReturnValue(
        Effect.fail(new NotFoundError())
      )
      mockRestoreUser.mockReturnValue(Effect.void)

      await Effect.runPromise(
        store.set(startRestoreFromBackupActionAtom, backup)
      )

      expect(store.get(restoreFromBackupStateAtom)).toEqual({state: 'idle'})
      expect(mockSessionNotificationToken).toHaveBeenCalled()
      expect(mockRestoreUser).toHaveBeenCalledWith(
        expect.objectContaining({
          vexlNotificationToken: Option.some(sessionNotificationToken),
        })
      )
      expect(store.get(vexlNotificationTokenAtom).secret).not.toBe(secret)
      expect(mockSyncNotificationTokens).not.toHaveBeenCalled()
      await new Promise(setImmediate)
      expect(mockUpdateOfferNotificationTokens).toHaveBeenCalledWith({
        regenerateAll: true,
      })
    })

    it('leaves everything untouched when minting with the old secret fails', async () => {
      const backup = await withSecret()
      mockGenerateNotificationToken.mockReturnValue(
        Effect.fail(new UnexpectedServerError({status: 500}))
      )

      await Effect.runPromise(
        store.set(startRestoreFromBackupActionAtom, backup)
      )

      expect(store.get(restoreFromBackupStateAtom)).toEqual({
        state: 'failed',
        failure: 'unknown',
      })
      expect(mockRestoreUser).not.toHaveBeenCalled()
      expect(mockSessionNotificationToken).not.toHaveBeenCalled()
      expect(store.get(vexlNotificationTokenAtom).secret).toBeNull()
      expect(store.get(sessionHolderAtom).state).toBe('loggedOut')
    })

    it('points the secret at no push token when notifications are off', async () => {
      mockRestoreUser.mockReturnValue(Effect.void)
      mockExpoToken.mockReturnValue(null)

      await Effect.runPromise(
        store.set(startRestoreFromBackupActionAtom, await withSecret())
      )

      expect(mockSyncNotificationTokens).toHaveBeenCalledWith({
        expoNotificationToken: null,
      })
    })

    it.each([
      [
        'a scan',
        (): void => {
          mockCheckInboxesExist.mockReturnValue(
            Effect.fail(new UnexpectedServerError({status: 500}))
          )
        },
      ],
      [
        'restoreUser',
        (): void => {
          mockRestoreUser.mockReturnValue(Effect.fail(new UserNotFoundError()))
        },
      ],
    ])(
      'leaves the secret with the old device when %s fails',
      async (_, fail) => {
        const backup = await withSecret()
        fail()

        await Effect.runPromise(
          store.set(startRestoreFromBackupActionAtom, backup)
        )

        expect(store.get(restoreFromBackupStateAtom).state).toBe('failed')
        expect(mockSyncNotificationTokens).not.toHaveBeenCalled()
        expect(mockDiscardSecret).not.toHaveBeenCalled()
        expect(store.get(vexlNotificationTokenAtom).secret).toBeNull()
        expect(store.get(sessionHolderAtom).state).toBe('loggedOut')
      }
    )
  })
})
