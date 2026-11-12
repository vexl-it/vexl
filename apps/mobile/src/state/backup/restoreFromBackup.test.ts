import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateKeyPair} from '@vexl-next/cryptography/src/operations/cryptobox'
import {ecdsaVerify} from '@vexl-next/cryptography/src/operations/ecdsa'
import {
  generateClubUuid,
  type ClubKeys,
  type ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {LoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
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
import {
  LoginSessionProof,
  loginSessionProofMessage,
  UserNotFoundError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect, Option, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import {
  type SessionPhoneNumber,
  type SessionV2,
} from '../../brands/Session.brand'
import {showMarketplaceIntroDialogAtom} from '../../utils/preferences'
import messagingStateAtom from '../chat/atoms/messagingStateAtom'
import {clubsKeyHolderStorageAtom} from '../clubs/atom/clubsToKeyHolderV2Atom'
import {keyDerivationCountersAtom} from '../keyDerivation'
import {vexlNotificationTokenAtom} from '../notifications/vexlNotificationTokenAtom'
import {vexlTokenToKeyHolderAtom} from '../notifications/vexlTokenToKeyHolderAtom'
import {postLoginFlowCompletedScreensAtom} from '../postLoginOnboarding'
import {sessionHolderAtom} from '../session'
import {dummySession} from '../session/dummySesssion'
import {makeExtraPhoneNumber} from '../session/extraPhoneNumber.testUtils'
import {backupFileToRestoreAtom, backupKeyPairAtom} from './backupToRestore'
import {
  restoredAccountInfoAtom,
  restoreFromBackupStateAtom,
  startRestoreFromBackupActionAtom,
} from './restoreFromBackup'

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import {SESSION_KEY} from '../session/utils/writeSessionToStorage'

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
const mockDeleteUserOnUserService = jest.fn()
jest.mock('../../api/contactApiForSession', () => ({
  contactApiForPhoneNumber: (
    _: unknown,
    {phoneNumber}: {phoneNumber: string}
  ) => ({
    restoreUser: (request: unknown) => mockRestoreUser(request, phoneNumber),
    createUser: mockCreateUser,
  }),
  userApiForPhoneNumber: (
    _: unknown,
    {phoneNumber}: {phoneNumber: string}
  ) => ({
    deleteUser: () =>
      jest
        .requireActual('effect')
        .Effect.sync(() => mockDeleteUserOnUserService(phoneNumber)),
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
    store.set(restoredAccountInfoAtom, Option.none())
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
    expect(mockRestoreUser).toHaveBeenCalledWith(
      {
        loginSessionId: session.loginSessionId,
        loginSessionProof: {
          signedAt: expect.any(Number),
          signature: expect.any(String),
        },
        vexlNotificationToken: Option.some(sessionNotificationToken),
      },
      backup.session.phoneNumber
    )
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
    expect(store.get(restoredAccountInfoAtom)).toEqual(
      Option.some({notRestoredPhoneNumbers: []})
    )
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
    expect(store.get(restoredAccountInfoAtom)).toEqual(Option.none())
  })

  it('fails the restore when the restored session cannot be stored', async () => {
    const {backup} = await setUp()
    mockRestoreUser.mockReturnValue(Effect.void)
    jest
      .mocked(SecureStore.setItemAsync)
      .mockRejectedValueOnce(new Error('keychain unavailable'))

    await Effect.runPromise(store.set(startRestoreFromBackupActionAtom, backup))

    expect(store.get(restoreFromBackupStateAtom)).toEqual({
      state: 'failed',
      failure: 'unknown',
    })
    expect(store.get(sessionHolderAtom).state).toBe('loggedOut')
    expect(store.get(messagingStateAtom)).toEqual([])
    expect(store.get(restoredAccountInfoAtom)).toEqual(Option.none())
  })

  it('stores the restored session once', async () => {
    const {backup} = await setUp()
    mockRestoreUser.mockReturnValue(Effect.void)
    jest.mocked(AsyncStorage.setItem).mockClear()

    await Effect.runPromise(store.set(startRestoreFromBackupActionAtom, backup))

    expect(
      jest
        .mocked(AsyncStorage.setItem)
        .mock.calls.filter(([key]) => key === SESSION_KEY)
    ).toHaveLength(1)
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
        }),
        backup.session.phoneNumber
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
        }),
        backup.session.phoneNumber
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

  describe('with several phone numbers', () => {
    const second = makeExtraPhoneNumber({
      phoneNumber: '+420777777777',
      hash: 'second',
      index: 0,
    })
    const third = makeExtraPhoneNumber({
      phoneNumber: '+421905123456',
      hash: 'third',
      index: 4,
    })

    const withExtraNumbers = async (): Promise<BackupFile> => {
      const {backup} = await setUp()
      return {
        ...backup,
        session: {...backup.session, extraPhoneNumbers: [second, third]},
        derivationCounters: {
          nextInboxIndex: index(0),
          nextClubIndex: index(0),
          nextPhoneNumberIndex: index(2),
        },
      }
    }

    const restoreUserAnswers = (
      answers: Record<string, Effect.Effect<void, unknown>>
    ): void => {
      mockRestoreUser.mockImplementation(
        (_: unknown, phoneNumber: string) => answers[phoneNumber] ?? Effect.void
      )
    }

    const restoredSession = (): SessionV2 => {
      const sessionHolder = store.get(sessionHolderAtom)
      if (sessionHolder.state !== 'loggedIn')
        throw new Error(`Unexpected session state ${sessionHolder.state}`)
      return sessionHolder.session
    }

    const restoreUserCalls = (): Array<{
      phoneNumber: string
      vexlNotificationToken: Option.Option<unknown>
    }> =>
      Array.map(
        mockRestoreUser.mock.calls,
        ([request, phoneNumber]: [
          {vexlNotificationToken: Option.Option<unknown>},
          string,
        ]) => ({
          phoneNumber,
          vexlNotificationToken: request.vexlNotificationToken,
        })
      )

    const isSignedBy = (
      request: unknown,
      key: SessionPhoneNumber['privateKey']
    ): boolean => {
      const {loginSessionId, loginSessionProof} = Schema.decodeUnknownSync(
        Schema.Struct({
          loginSessionId: LoginSessionId,
          loginSessionProof: LoginSessionProof,
        })
      )(request)
      return ecdsaVerify({
        challenge: loginSessionProofMessage({
          loginSessionId,
          signedAt: loginSessionProof.signedAt,
        }),
        signature: loginSessionProof.signature,
        pubKey: key.publicKeyPemBase64,
      })
    }

    it("restores every number with a proof signed by that number's own key, the notification token only on the main one", async () => {
      const backup = await withExtraNumbers()
      restoreUserAnswers({})

      await Effect.runPromise(
        store.set(startRestoreFromBackupActionAtom, backup)
      )

      expect(restoreUserCalls()).toEqual([
        {
          phoneNumber: backup.session.phoneNumber,
          vexlNotificationToken: Option.some(sessionNotificationToken),
        },
        {phoneNumber: second.phoneNumber, vexlNotificationToken: Option.none()},
        {phoneNumber: third.phoneNumber, vexlNotificationToken: Option.none()},
      ])
      const [[mainRequest], [secondRequest], [thirdRequest]] =
        mockRestoreUser.mock.calls
      expect(isSignedBy(mainRequest, backup.session.privateKey)).toBe(true)
      expect(isSignedBy(secondRequest, second.privateKey)).toBe(true)
      expect(isSignedBy(thirdRequest, third.privateKey)).toBe(true)
      expect(isSignedBy(secondRequest, backup.session.privateKey)).toBe(false)

      expect(restoredSession().extraPhoneNumbers).toEqual([second, third])
      expect(store.get(restoredAccountInfoAtom)).toEqual(
        Option.some({notRestoredPhoneNumbers: []})
      )
      // Past the highest index in the backup, not just its counter.
      expect(store.get(keyDerivationCountersAtom).nextPhoneNumberIndex).toBe(5)
      expect(mockDeleteUserOnUserService).not.toHaveBeenCalled()
    })

    it('drops an extra number contact-service no longer knows and deletes its user-service row', async () => {
      const backup = await withExtraNumbers()
      restoreUserAnswers({
        [second.phoneNumber]: Effect.fail(new UserNotFoundError()),
      })

      await Effect.runPromise(
        store.set(startRestoreFromBackupActionAtom, backup)
      )

      const session = restoredSession()
      expect(session.phoneNumber).toBe(backup.session.phoneNumber)
      expect(session.extraPhoneNumbers).toEqual([third])
      expect(store.get(restoredAccountInfoAtom)).toEqual(
        Option.some({notRestoredPhoneNumbers: [second.phoneNumber]})
      )
      expect(mockDeleteUserOnUserService).toHaveBeenCalledWith(
        second.phoneNumber
      )
      expect(mockDeleteUserOnUserService).toHaveBeenCalledTimes(1)
      // The dropped number's key may still be registered on user-service.
      expect(store.get(keyDerivationCountersAtom).nextPhoneNumberIndex).toBe(5)
    })

    it('reports a backup the server no longer knows when the main number is gone, even with extra numbers left', async () => {
      const backup = await withExtraNumbers()
      restoreUserAnswers({
        [backup.session.phoneNumber]: Effect.fail(new UserNotFoundError()),
      })

      await Effect.runPromise(
        store.set(startRestoreFromBackupActionAtom, backup)
      )

      expect(restoreUserCalls()).toEqual([
        {
          phoneNumber: backup.session.phoneNumber,
          vexlNotificationToken: Option.some(sessionNotificationToken),
        },
      ])
      expect(store.get(restoreFromBackupStateAtom)).toEqual({
        state: 'failed',
        failure: 'backupNoLongerValid',
      })
      expect(mockDiscardSecret).toHaveBeenCalledTimes(1)
      expect(store.get(sessionHolderAtom).state).toBe('loggedOut')
      expect(store.get(messagingStateAtom)).toEqual([])
      expect(store.get(restoredAccountInfoAtom)).toEqual(Option.none())
      expect(mockDeleteUserOnUserService).not.toHaveBeenCalled()
    })

    it('keeps nothing when a number fails and restores all of them when tried again', async () => {
      const backup = await withExtraNumbers()
      restoreUserAnswers({
        [second.phoneNumber]: Effect.fail({_tag: 'NetworkError'}),
      })

      await Effect.runPromise(
        store.set(startRestoreFromBackupActionAtom, backup)
      )

      expect(store.get(restoreFromBackupStateAtom)).toEqual({
        state: 'failed',
        failure: 'offline',
      })
      // The main number was restored on the server before the failure.
      expect(restoreUserCalls()).toHaveLength(2)
      expect(store.get(sessionHolderAtom).state).toBe('loggedOut')
      expect(store.get(messagingStateAtom)).toEqual([])
      expect(store.get(restoredAccountInfoAtom)).toEqual(Option.none())
      expect(mockDiscardSecret).toHaveBeenCalledTimes(1)
      expect(mockRefreshOffers).not.toHaveBeenCalled()
      const [[firstAttempt]] = mockRestoreUser.mock.calls

      mockRestoreUser.mockClear()
      restoreUserAnswers({})
      await Effect.runPromise(
        store.set(startRestoreFromBackupActionAtom, backup)
      )

      expect(store.get(restoreFromBackupStateAtom)).toEqual({state: 'idle'})
      expect(restoreUserCalls()).toEqual([
        {
          phoneNumber: backup.session.phoneNumber,
          vexlNotificationToken: Option.some(sessionNotificationToken),
        },
        {phoneNumber: second.phoneNumber, vexlNotificationToken: Option.none()},
        {phoneNumber: third.phoneNumber, vexlNotificationToken: Option.none()},
      ])
      const session = restoredSession()
      // A new login session, so the numbers restored by the failed attempt
      // move to it too.
      expect(session.loginSessionId).not.toBe(firstAttempt.loginSessionId)
      expect(
        Array.map(mockRestoreUser.mock.calls, ([request]) => request)
      ).toEqual(
        Array.replicate(
          expect.objectContaining({loginSessionId: session.loginSessionId}),
          3
        )
      )
      expect(session.extraPhoneNumbers).toEqual([second, third])
    })
  })
})
