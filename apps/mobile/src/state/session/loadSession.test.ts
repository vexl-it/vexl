import AsyncStorage from '@react-native-async-storage/async-storage'
import {KeyHolder, aes} from '@vexl-next/cryptography'
import {KeyPairV2 as KeyPairV2Schema} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VexlAuthHeader} from '@vexl-next/rest-api/src/VexlAuthHeader'
import {Effect, Schema} from 'effect/index'
import * as SecretStore from 'expo-secure-store'
import {getDefaultStore} from 'jotai'
import {sessionHolderAtom} from '.'
import {
  type Session,
  type SessionV2,
  Session as SessionSchema,
} from '../../brands/Session.brand'
import {storage} from '../../utils/mmkv/effectMmkv'
import reportError from '../../utils/reportError'
import {
  PERSISTENT_DATA_ABOUT_REACH_AND_IMPORTED_CONTACTS_STORAGE_KEY,
  persistentDataAboutReachAndImportedContactsAtom,
} from '../connections/atom/reachNumberWithoutClubsConnectionsMmkvAtom'
import {dummySession} from './dummySesssion'
import {loadSession} from './loadSession'
import {
  clearV2SecretWasWrittenFlag,
  markV2SecretAsWritten,
  wasV2SecretWritten,
} from './utils/v2SecretStorageFlag'
import {
  SECRET_TOKEN_KEY,
  SECRET_TOKEN_KEY_V2,
  SECRET_TOKEN_KEY_V2_OPTIONS,
  SESSION_KEY,
} from './utils/writeSessionToStorage'

const mockPublicKeyV2 = 'V2_PUB_mock-public-key'
const mockPrivateKeyV2 = 'V2_PRIV_mock-private-key'
const mockCryptoBoxSignatureSuffix = 'mock-cryptobox-signature'
const mockVexlAuthSignature = `CBSig-${mockCryptoBoxSignatureSuffix}`

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 2,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}))

jest.mock('expo-notifications', () => ({
  __esModule: true,
  AndroidImportance: {DEFAULT: 5, HIGH: 6},
  AndroidNotificationPriority: {DEFAULT: 'default', HIGH: 'high'},
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  scheduleNotificationAsync: jest.fn(async () => 'notification-id'),
  getPresentedNotificationsAsync: jest.fn(async () => []),
  dismissNotificationAsync: jest.fn(async () => undefined),
}))

jest.mock('../../utils/reportError', () => {
  const {Effect} = jest.requireActual('effect/index')

  return {
    __esModule: true,
    default: jest.fn(),
    reportErrorE: jest.fn(() => Effect.succeed(undefined)),
  }
})

jest.mock('react-native-mmkv', () => {
  class MMKV {
    private readonly data = new Map<string, boolean | number | string>()

    set(key: string, value: boolean | number | string): void {
      this.data.set(key, value)
    }

    getString(key: string): string | undefined {
      const value = this.data.get(key)
      return typeof value === 'string' ? value : undefined
    }

    getBoolean(key: string): boolean | undefined {
      const value = this.data.get(key)
      return typeof value === 'boolean' ? value : undefined
    }

    delete(key: string): void {
      this.data.delete(key)
    }
  }

  return {MMKV}
})

jest.mock('../../utils/localization/I18nProvider', () => {
  const {atom: createAtom} = jest.requireActual('jotai')

  return {
    getCurrentLocale: () => 'en',
    translationAtom: createAtom({
      t: (
        key: string,
        options?: {
          errorCode?: string
        }
      ) => {
        if (key === 'settings.items.supportEmail') return 'support@vexl.test'
        if (key === 'errorGettingSession.text')
          return `error-code-${options?.errorCode ?? 'unknown'}`

        return key
      },
      isEnglish: () => true,
    }),
    useTranslation: () => ({
      t: (key: string) => key,
      isEnglish: () => true,
    }),
  }
})

jest.mock('@vexl-next/cryptography/src/operations/cryptobox', () => {
  const {Schema} = jest.requireActual('effect/index')
  const {KeyPairV2} = jest.requireActual(
    '@vexl-next/cryptography/src/KeyHolder/brandsV2'
  )

  return {
    ...jest.requireActual('@vexl-next/cryptography/src/operations/cryptobox'),
    generateKeyPair: jest.fn(async () =>
      Schema.decodeSync(KeyPairV2)({
        publicKey: mockPublicKeyV2,
        privateKey: mockPrivateKeyV2,
      })
    ),
    sign: jest.fn(async () => mockCryptoBoxSignatureSuffix),
  }
})

jest.mock('@vexl-next/rest-api/src', () => {
  const {Effect, Schema} = jest.requireActual('effect/index')
  const actualRestApi = jest.requireActual('@vexl-next/rest-api/src')
  const {VexlAuthHeader} = jest.requireActual(
    '@vexl-next/rest-api/src/VexlAuthHeader'
  )

  const toVexlAuthHeader = ({
    publicKeyV2,
    hash,
  }: {
    publicKeyV2: string
    hash: string
  }): typeof VexlAuthHeader.Type =>
    Schema.decodeSync(VexlAuthHeader)(
      `VexlAuth ${Buffer.from(JSON.stringify({pk: publicKeyV2, hash})).toString(
        'base64'
      )}.${mockVexlAuthSignature}`
    )

  return {
    ...actualRestApi,
    contact: {
      api: jest.fn(() =>
        Effect.succeed({
          refreshUser: jest.fn(() => Effect.succeed(undefined)),
          getClubInfo: jest.fn(() => Effect.succeed(undefined)),
        })
      ),
    },
    user: {
      api: jest.fn(
        (params: {getUserSessionCredentials: () => {hash: string}}) =>
          Effect.succeed({
            initUpgradeAuth: jest.fn(() =>
              Effect.succeed({challenge: 'mock-upgrade-auth-challenge'})
            ),
            submitUpgradeAuth: jest.fn((input: {publicKeyV2: string}) =>
              Effect.succeed({
                vexlAuthHeader: toVexlAuthHeader({
                  publicKeyV2: input.publicKeyV2,
                  hash: params.getUserSessionCredentials().hash,
                }),
              })
            ),
          })
      ),
    },
  }
})

const asyncStorageGetItemMock = jest.mocked(AsyncStorage.getItem)
const asyncStorageRemoveItemMock = jest.mocked(AsyncStorage.removeItem)
const secretStoreGetItemAsyncMock = jest.mocked(SecretStore.getItemAsync)
const secretStoreSetItemAsyncMock = jest.mocked(SecretStore.setItemAsync)
const secretStoreDeleteItemAsyncMock = jest.mocked(SecretStore.deleteItemAsync)
const reportErrorMock = jest.mocked(reportError)
const deterministicKeyPairV2 = Schema.decodeSync(KeyPairV2Schema)({
  publicKey: mockPublicKeyV2,
  privateKey: mockPrivateKeyV2,
})

function createMockVexlAuthHeader(hash: string): typeof VexlAuthHeader.Type {
  return Schema.decodeSync(VexlAuthHeader)(
    `VexlAuth ${Buffer.from(
      JSON.stringify({
        pk: deterministicKeyPairV2.publicKey,
        hash,
      })
    ).toString('base64')}.${mockVexlAuthSignature}`
  )
}

function withExpectedSessionUpgrades(session: Session): SessionV2 {
  return {
    ...session,
    keyPairV2: deterministicKeyPairV2,
    sessionCredentials: {
      ...session.sessionCredentials,
      vexlAuthHeader: createMockVexlAuthHeader(session.sessionCredentials.hash),
    },
    isLiquidityProvider: false,
  }
}

function buildLoggedInSession(version: number): SessionV2 {
  return withExpectedSessionUpgrades(buildSession(version))
}

const snapshotSavedAsyncStorageValue =
  '000.777hh/RpT/ouupOzNZOydQ50XsoeK40S5bLC/6aWc9WGNQc8JdLVZily36fNS6Fk6LhWUD9BV/l/VJQI2tcVDxZpUKeBEcD6VBgWe6PexbLDa4ThUVG0rENLJ5QjtLpXC4f4mYLRhMIPKFEqyJ/ML8UMEkkENuSQEcXtKaHWi0KCDTw5pvn6rzWkFs48xcrWM2vzs0xvMVhrXd9m4EirRbmPE+IFEPfqTVaZmxzbqNzrdHrK9z/FCqsaTQNT00hUuBjLQE1SHDxmvJC3tFKovmz1iRnxjUZcnSf+/fOpUPI/HtubwXEg8NKehwU1oogFhKJLP+hlggYxEiCgCgQxgxoe6toQwZNFj1YmF9WGzglxZ4al7NKvlyO7oTnPkaD9JYVn0C1kdcc74RtC70SAyzFMUEfdgu+va8Nv3P0+AVH5Q6Kpt6tQDvdoQCgeHHtQMs3ymVI2836oEFIWIeB4ywtnB/O32dWuu4O8qwzObMsetkkv/DZ/opVzQLmyetyDe/HC6t+aDNriiS7dZHS/06NxoJSFGjE70g14T9Z3zo0uaRHgNCXYjmbI8sDC6AvjbAzjRtWSOaBlmkVxbA4d+Ozl0XaJgltFAbGZeCkU+eg7TqGyfZMaAmfvjuptUWDsTTMOMwB1mr6OVaaIfLzmrokzE0Ngx4crO4OmOsQY95yiokgXBmrBMoCi67h38QCpm861EmPCKajcjgh+sooZ4dKSoY0m8sgPfvOvm57IU/atML/KY/R20kFSeZgn1z3kcrD8oaBmd527TczXvgb47zvChAes8D/FiOAFmxuN4Gf5gH7q0ByYifKLtN5kSYIxEIEiA71pDQBg5uVbeIt+oFEjQ5Cw7M+ylrWN3ZuvAizxs9H5LP09WHm9a0n+SIFYDfQGiOdMbiJCMwYJIQJYQiT/ulXR0fUVoKMSWJPHeeUWdUxwZl80DzRtL1MjFmQxxLisCu+jG3wxAnqUgkvqgl4tk5fIW1HNX4CpVSQQfdbEtVNSqT8aWH/eMsqDEGiFZAgio3KkxCRrqiFtDVPDKMIL2OvBWfIzi+lPELptbEfqcsPzQFL6EUZXBGsfLcSexzgpbxLyRw+hNkjfb7uKmvv0XeV/xIfwHZHVFZn+j3g2tSSkhSkAvOHf6SqrmhdtJhihxKc/PWipPYhzYMPjBj0cjeH5Kcm1UW1WxeXxUWjP1Ti+hiQA2x+zp7Q4ohH6LoFTnA/H8AbGxvG2lKbWS8Xx'
const snapshotSavedSecretStorageValue =
  'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1IZ0NBUUF3RUFZSEtvWkl6ajBDQVFZRks0RUVBQ0VFWVRCZkFnRUJCQnhLVWRKY3RyS2w0VlBCMTFPQmJtbHAKQzFkQWhoVzlhV0NxM2VlcG9Ud0RPZ0FFNFd0MVAyQ2dVczdEYjJLK1lLNUZ1cGY3NGpWa0o4aW5nSGRJUlpVWQpDSmQ1aFZCTXJRY0dFK2dyRFhDdlpMc29zZkp2M0dRdTc1QT0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo='
const snapshotSavedPrivateKey = KeyHolder.importPrivateKey({
  privateKeyPemBase64: Schema.decodeSync(KeyHolder.PrivateKeyPemBase64)(
    snapshotSavedSecretStorageValue
  ),
})
const expectedSessionFromSnapshotSavedValues: Session = Schema.decodeSync(
  SessionSchema
)({
  version: 42,
  phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420777777777'),
  sessionCredentials: {
    publicKey: snapshotSavedPrivateKey.publicKeyPemBase64,
    hash: 'snapshot-hash',
    signature: 'snapshot-signature',
  },
  privateKey: snapshotSavedPrivateKey,
})

function deferredValue<A>(): {
  readonly promise: Promise<A>
  resolve: (value: A) => void
} {
  let resolvePromise = (_value: A): void => {}
  const promise = new Promise<A>((resolve) => {
    resolvePromise = resolve
  })

  return {promise, resolve: resolvePromise}
}

function buildSession(version: number): Session {
  return Schema.decodeSync(SessionSchema)({
    ...dummySession,
    keyPairV2: undefined,
    version,
    sessionCredentials: {
      ...dummySession.sessionCredentials,
      vexlAuthHeader: undefined,
    },
  })
}

function encryptSessionForStorage(session: Session): {
  readonly encryptedSession: string
  readonly secretToken: string
} {
  const secretToken = `token-${session.version}`
  const sessionJson = Schema.encodeSync(Schema.parseJson(SessionSchema))(
    session
  )
  const encryptedSession = aes.aesCTREncrypt({
    data: sessionJson,
    password: secretToken,
  })

  return {encryptedSession, secretToken}
}

function buildSessionFailingSanityCheck(version: number): SessionV2 {
  // A complete V2 session that decodes fine, but whose stored public key no
  // longer matches its private key. sanityCheckSessionV2 fails after the read.
  const sane = buildLoggedInSession(version)
  return {
    ...sane,
    sessionCredentials: {
      ...sane.sessionCredentials,
      publicKey: snapshotSavedPrivateKey.publicKeyPemBase64,
    },
  }
}

describe('loadSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getDefaultStore().set(sessionHolderAtom, {state: 'initial'})
    storage._storage.delete(
      PERSISTENT_DATA_ABOUT_REACH_AND_IMPORTED_CONTACTS_STORAGE_KEY
    )
    asyncStorageGetItemMock.mockResolvedValue(null)
    secretStoreGetItemAsyncMock.mockResolvedValue(null)
    clearV2SecretWasWrittenFlag()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('waits for in-flight load and returns logged in state for both callers', async () => {
    const loadedSession = buildSession(dummySession.version + 1)
    const {encryptedSession, secretToken} =
      encryptSessionForStorage(loadedSession)
    const encryptedSessionDeferred = deferredValue<string | null>()

    asyncStorageGetItemMock.mockImplementationOnce(
      () => encryptedSessionDeferred.promise
    )
    secretStoreGetItemAsyncMock.mockResolvedValueOnce(secretToken)

    const firstLoadPromise = Effect.runPromise(loadSession())
    const secondLoadPromise = Effect.runPromise(loadSession())

    expect(getDefaultStore().get(sessionHolderAtom).state).toBe('loading')

    encryptedSessionDeferred.resolve(encryptedSession)

    const [firstLoadResult, secondLoadResult] = await Promise.all([
      firstLoadPromise,
      secondLoadPromise,
    ])

    expect(firstLoadResult.sessionLoaded).toBe(true)
    expect(secondLoadResult.sessionLoaded).toBe(true)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedIn',
      session: withExpectedSessionUpgrades(loadedSession),
    })
    expect(asyncStorageGetItemMock).toHaveBeenCalledTimes(1)
    expect(secretStoreGetItemAsyncMock).toHaveBeenCalledTimes(1)
  })

  it('waiters return the blocking recovery result from a failed in-flight load', async () => {
    const loadedSession = buildSession(dummySession.version + 93)
    const {encryptedSession} = encryptSessionForStorage(loadedSession)
    const encryptedSessionDeferred = deferredValue<string | null>()

    asyncStorageGetItemMock.mockImplementationOnce(
      () => encryptedSessionDeferred.promise
    )
    secretStoreGetItemAsyncMock.mockRejectedValueOnce(
      new Error('secure store failed')
    )

    const firstLoadPromise = Effect.runPromise(loadSession())
    const waitingLoadPromise = Effect.runPromise(loadSession())

    expect(getDefaultStore().get(sessionHolderAtom).state).toBe('loading')

    encryptedSessionDeferred.resolve(encryptedSession)

    const [firstLoadResult, waitingLoadResult] = await Promise.all([
      firstLoadPromise,
      waitingLoadPromise,
    ])

    expect(firstLoadResult).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
      loadingError: {
        _tag: 'ErrorReadingFromSecureStorage',
      },
    })
    expect(waitingLoadResult).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
      loadingError: {
        _tag: 'ErrorReadingFromSecureStorage',
      },
    })
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedOut',
    })
    expect(asyncStorageGetItemMock).toHaveBeenCalledTimes(1)
    expect(secretStoreGetItemAsyncMock).toHaveBeenCalledTimes(1)
  })

  it('returns blocking recovery when waiting for an in-flight load times out', async () => {
    jest.useFakeTimers()

    try {
      const loadedSession = buildSession(dummySession.version + 92)
      const {encryptedSession, secretToken} =
        encryptSessionForStorage(loadedSession)
      const encryptedSessionDeferred = deferredValue<string | null>()

      asyncStorageGetItemMock.mockImplementationOnce(
        () => encryptedSessionDeferred.promise
      )
      secretStoreGetItemAsyncMock.mockResolvedValueOnce(secretToken)

      const firstLoadPromise = Effect.runPromise(loadSession())
      const waiterPromise = Effect.runPromise(loadSession())

      expect(getDefaultStore().get(sessionHolderAtom).state).toBe('loading')

      await jest.advanceTimersByTimeAsync(5_000)

      const waiterResult = await waiterPromise

      expect(waiterResult).toMatchObject({
        sessionLoaded: false,
        blockingRecoveryRequired: true,
        loadingError: {
          _tag: 'SessionLoadWaitTimedOut',
        },
      })
      expect(getDefaultStore().get(sessionHolderAtom).state).toBe('loading')

      encryptedSessionDeferred.resolve(encryptedSession)

      const firstLoadResult = await firstLoadPromise

      expect(firstLoadResult.sessionLoaded).toBe(true)
      expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
        state: 'loggedIn',
        session: withExpectedSessionUpgrades(loadedSession),
      })
      expect(asyncStorageGetItemMock).toHaveBeenCalledTimes(1)
      expect(secretStoreGetItemAsyncMock).toHaveBeenCalledTimes(1)
    } finally {
      jest.useRealTimers()
    }
  })

  it('loads session from storage and sets loggedIn state', async () => {
    const loadedSession = buildLoggedInSession(dummySession.version + 2)
    const {encryptedSession, secretToken} =
      encryptSessionForStorage(loadedSession)

    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock.mockResolvedValueOnce(secretToken)

    const result = await Effect.runPromise(loadSession({forceReload: false}))

    expect(result.sessionLoaded).toBe(true)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedIn',
      session: withExpectedSessionUpgrades(loadedSession),
    })
    expect(asyncStorageGetItemMock).toHaveBeenCalledWith(SESSION_KEY)
    expect(secretStoreGetItemAsyncMock).toHaveBeenCalledWith(
      SECRET_TOKEN_KEY_V2
    )
    expect(secretStoreSetItemAsyncMock).not.toHaveBeenCalled()
  })

  it('falls back to legacy secret storage and backfills v2 key', async () => {
    const loadedSession = buildLoggedInSession(dummySession.version + 20)
    const {encryptedSession, secretToken} =
      encryptSessionForStorage(loadedSession)

    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(secretToken)

    const result = await Effect.runPromise(loadSession({forceReload: false}))

    expect(result.sessionLoaded).toBe(true)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedIn',
      session: withExpectedSessionUpgrades(loadedSession),
    })
    expect(secretStoreGetItemAsyncMock).toHaveBeenCalledWith(
      SECRET_TOKEN_KEY_V2
    )
    expect(secretStoreGetItemAsyncMock).toHaveBeenCalledWith(SECRET_TOKEN_KEY)
    expect(secretStoreSetItemAsyncMock).toHaveBeenCalledWith(
      SECRET_TOKEN_KEY_V2,
      secretToken,
      SECRET_TOKEN_KEY_V2_OPTIONS
    )
    expect(wasV2SecretWritten()).toBe(true)
  })

  it('sets loggedOut when there is no session in async storage', async () => {
    asyncStorageGetItemMock.mockResolvedValueOnce(null)

    const result = await Effect.runPromise(loadSession())

    expect(result).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: false,
      loadingError: {
        _tag: 'StoreEmpty',
      },
    })
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedOut',
    })
    expect(secretStoreGetItemAsyncMock).not.toHaveBeenCalled()
  })

  it('returns not-loaded result and sets state to loggedOut when secure store read fails', async () => {
    const loadedSession = buildSession(dummySession.version + 3)
    const {encryptedSession} = encryptSessionForStorage(loadedSession)
    const staleReachData = {
      reach: 100,
      numberOfImportedContacts: 5,
    }

    storage._storage.set(
      PERSISTENT_DATA_ABOUT_REACH_AND_IMPORTED_CONTACTS_STORAGE_KEY,
      JSON.stringify({data: staleReachData})
    )
    getDefaultStore().set(
      persistentDataAboutReachAndImportedContactsAtom,
      staleReachData
    )

    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock.mockRejectedValueOnce(
      new Error('secure store failed')
    )

    const result = await Effect.runPromise(loadSession({forceReload: false}))

    expect(result).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
      loadingError: {
        _tag: 'ErrorReadingFromSecureStorage',
      },
    })
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedOut',
    })
    expect(
      getDefaultStore().get(persistentDataAboutReachAndImportedContactsAtom)
    ).toEqual({
      reach: 0,
      numberOfImportedContacts: 0,
    })
    expect(reportErrorMock).not.toHaveBeenCalled()
  })

  it('requires blocking recovery when encrypted session exists but stored secret is missing', async () => {
    const loadedSession = buildSession(dummySession.version + 36)
    const {encryptedSession} = encryptSessionForStorage(loadedSession)

    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)

    const result = await Effect.runPromise(loadSession({forceReload: false}))

    expect(result).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
      loadingError: {
        _tag: 'StoredSessionSecretUnavailable',
      },
    })
    expect(reportErrorMock).not.toHaveBeenCalled()
  })

  it('requires blocking recovery when encrypted session exists but can not be decrypted into a session', async () => {
    const loadedSession = buildSession(dummySession.version + 37)
    const {encryptedSession} = encryptSessionForStorage(loadedSession)

    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock.mockResolvedValueOnce('wrong-secret-token')

    const result = await Effect.runPromise(loadSession({forceReload: false}))

    expect(result).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
      loadingError: {
        _tag: 'ParseError',
      },
    })
    expect(reportErrorMock).not.toHaveBeenCalled()
  })

  it('requires blocking recovery when v2 secret marker is set but secure store read fails, without reporting or erasing data', async () => {
    const loadedSession = buildSession(dummySession.version + 34)
    const {encryptedSession} = encryptSessionForStorage(loadedSession)

    markV2SecretAsWritten()
    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock.mockRejectedValueOnce(
      new Error('secure store failed')
    )

    const result = await Effect.runPromise(loadSession({forceReload: false}))

    expect(result).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
      loadingError: {
        _tag: 'V2SecretReadFailedAfterBeingWritten',
      },
    })
    // loadSession is no longer the per-attempt reporting point: the splash
    // layer reports the final blocking outcome exactly once per startup.
    expect(reportErrorMock).not.toHaveBeenCalled()
    // PRIME DIRECTIVE: a transient blocking failure must NEVER erase data.
    expect(asyncStorageRemoveItemMock).not.toHaveBeenCalled()
    expect(secretStoreDeleteItemAsyncMock).not.toHaveBeenCalled()
  })

  it('does not fail the read or erase data when the v2 backfill write fails on a legacy secret', async () => {
    const loadedSession = buildLoggedInSession(dummySession.version + 50)
    const {encryptedSession, secretToken} =
      encryptSessionForStorage(loadedSession)

    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(secretToken)
    secretStoreSetItemAsyncMock.mockRejectedValueOnce(
      new Error('secure store write failed')
    )

    const result = await Effect.runPromise(loadSession({forceReload: false}))

    // Backfill write failure is best-effort: a valid legacy secret still logs in.
    expect(result.sessionLoaded).toBe(true)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedIn',
      session: withExpectedSessionUpgrades(loadedSession),
    })
    // The failed write must not have marked the v2 secret as written.
    expect(wasV2SecretWritten()).toBe(false)
    expect(asyncStorageRemoveItemMock).not.toHaveBeenCalled()
    expect(secretStoreDeleteItemAsyncMock).not.toHaveBeenCalled()
  })

  it('treats a transient async storage read failure as blocking without erasing data', async () => {
    asyncStorageGetItemMock.mockRejectedValueOnce(
      new Error('async storage failed')
    )

    const result = await Effect.runPromise(loadSession({forceReload: false}))

    expect(result).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
      loadingError: {
        _tag: 'ErrorReadingFromAsyncStorage',
      },
    })
    expect(asyncStorageRemoveItemMock).not.toHaveBeenCalled()
    expect(secretStoreDeleteItemAsyncMock).not.toHaveBeenCalled()
  })

  it('requires blocking recovery and resets to initial without erasing data when an unexpected error happens after the session was read (failing session sanity check)', async () => {
    const corruptedSession = buildSessionFailingSanityCheck(
      dummySession.version + 60
    )
    const {encryptedSession, secretToken} =
      encryptSessionForStorage(corruptedSession)

    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock.mockResolvedValueOnce(secretToken)

    const result = await Effect.runPromise(loadSession({forceReload: false}))

    expect(result).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
    })
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'initial',
    })
    // PRIME DIRECTIVE: an unexpected error must NEVER erase data.
    expect(asyncStorageRemoveItemMock).not.toHaveBeenCalled()
    expect(secretStoreDeleteItemAsyncMock).not.toHaveBeenCalled()
  })

  it('returns blocking recovery to concurrent waiters when sanity check fails after storage read', async () => {
    const corruptedSession = buildSessionFailingSanityCheck(
      dummySession.version + 61
    )
    const {encryptedSession, secretToken} =
      encryptSessionForStorage(corruptedSession)
    const encryptedSessionDeferred = deferredValue<string | null>()

    asyncStorageGetItemMock.mockImplementationOnce(
      () => encryptedSessionDeferred.promise
    )
    secretStoreGetItemAsyncMock.mockResolvedValueOnce(secretToken)

    const firstLoadPromise = Effect.runPromise(
      loadSession({forceReload: false})
    )
    const waiterLoadPromise = Effect.runPromise(loadSession())

    expect(getDefaultStore().get(sessionHolderAtom).state).toBe('loading')

    encryptedSessionDeferred.resolve(encryptedSession)

    const [firstLoadResult, waiterLoadResult] = await Promise.all([
      firstLoadPromise,
      waiterLoadPromise,
    ])

    expect(firstLoadResult).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
    })
    expect(waiterLoadResult).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
    })
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'initial',
    })
    expect(asyncStorageGetItemMock).toHaveBeenCalledTimes(1)
    expect(secretStoreGetItemAsyncMock).toHaveBeenCalledTimes(1)
    // PRIME DIRECTIVE: an unexpected error must NEVER erase data.
    expect(asyncStorageRemoveItemMock).not.toHaveBeenCalled()
    expect(secretStoreDeleteItemAsyncMock).not.toHaveBeenCalled()
  })

  it('returns current value and skips storage calls when already loggedIn', async () => {
    const existingSession = buildLoggedInSession(dummySession.version + 4)
    getDefaultStore().set(sessionHolderAtom, {
      state: 'loggedIn',
      session: existingSession,
    })

    const result = await Effect.runPromise(loadSession())

    expect(result.sessionLoaded).toBe(true)
    expect(asyncStorageGetItemMock).not.toHaveBeenCalled()
    expect(secretStoreGetItemAsyncMock).not.toHaveBeenCalled()
  })

  it('returns current value and skips storage calls when already loggedOut', async () => {
    getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})

    const result = await Effect.runPromise(loadSession())

    expect(result.sessionLoaded).toBe(false)
    expect(asyncStorageGetItemMock).not.toHaveBeenCalled()
    expect(secretStoreGetItemAsyncMock).not.toHaveBeenCalled()
  })

  it('force reloads existing loggedIn state using values from storage', async () => {
    const originalSession = buildLoggedInSession(dummySession.version + 5)
    const updatedSession = buildSession(dummySession.version + 6)
    const {encryptedSession, secretToken} =
      encryptSessionForStorage(updatedSession)

    getDefaultStore().set(sessionHolderAtom, {
      state: 'loggedIn',
      session: originalSession,
    })
    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock.mockResolvedValueOnce(secretToken)

    const result = await Effect.runPromise(loadSession({forceReload: true}))

    expect(result.sessionLoaded).toBe(true)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedIn',
      session: withExpectedSessionUpgrades(updatedSession),
    })
  })

  it('does not start a second read when forceReload is true but a load is already in flight', async () => {
    // 'loading' without an armed in-flight latch (no real loader running): the
    // forceReload caller must not kick off its own storage read. It joins the
    // (already-settled) wait and returns the current state.
    getDefaultStore().set(sessionHolderAtom, {state: 'loading'})

    const result = await Effect.runPromise(loadSession({forceReload: true}))

    expect(result.sessionLoaded).toBe(false)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loading',
    })
    expect(asyncStorageGetItemMock).not.toHaveBeenCalled()
    expect(secretStoreGetItemAsyncMock).not.toHaveBeenCalled()
  })

  it('forceReload caller waits for an in-flight load instead of starting a second read', async () => {
    const loadedSession = buildSession(dummySession.version + 70)
    const {encryptedSession, secretToken} =
      encryptSessionForStorage(loadedSession)
    const encryptedSessionDeferred = deferredValue<string | null>()

    asyncStorageGetItemMock.mockImplementationOnce(
      () => encryptedSessionDeferred.promise
    )
    secretStoreGetItemAsyncMock.mockResolvedValueOnce(secretToken)

    const firstLoadPromise = Effect.runPromise(loadSession())
    const forceReloadPromise = Effect.runPromise(
      loadSession({forceReload: true})
    )

    expect(getDefaultStore().get(sessionHolderAtom).state).toBe('loading')

    encryptedSessionDeferred.resolve(encryptedSession)

    const [firstLoadResult, forceReloadResult] = await Promise.all([
      firstLoadPromise,
      forceReloadPromise,
    ])

    expect(firstLoadResult.sessionLoaded).toBe(true)
    expect(forceReloadResult.sessionLoaded).toBe(true)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedIn',
      session: withExpectedSessionUpgrades(loadedSession),
    })
    // The forceReload caller joined the in-flight load - exactly one read.
    expect(asyncStorageGetItemMock).toHaveBeenCalledTimes(1)
    expect(secretStoreGetItemAsyncMock).toHaveBeenCalledTimes(1)
  })

  it('re-arms the in-flight wait for each load cycle so a later concurrent load still waits', async () => {
    // First cycle: a full load to completion. The old one-shot latch would stay
    // resolved forever after this, breaking waiting on every subsequent cycle.
    const firstSession = buildSession(dummySession.version + 80)
    const firstEncrypted = encryptSessionForStorage(firstSession)
    asyncStorageGetItemMock.mockResolvedValueOnce(
      firstEncrypted.encryptedSession
    )
    secretStoreGetItemAsyncMock.mockResolvedValueOnce(
      firstEncrypted.secretToken
    )

    await Effect.runPromise(loadSession())
    expect(getDefaultStore().get(sessionHolderAtom).state).toBe('loggedIn')

    // Second cycle: a forced reload whose read is deferred, with a concurrent
    // caller. The concurrent caller must wait for THIS cycle's read to finish,
    // not return immediately off a stale latch.
    const secondSession = buildSession(dummySession.version + 81)
    const secondEncrypted = encryptSessionForStorage(secondSession)
    const secondDeferred = deferredValue<string | null>()
    asyncStorageGetItemMock.mockImplementationOnce(() => secondDeferred.promise)
    secretStoreGetItemAsyncMock.mockResolvedValueOnce(
      secondEncrypted.secretToken
    )

    const reloadPromise = Effect.runPromise(loadSession({forceReload: true}))
    const waiterPromise = Effect.runPromise(loadSession())

    expect(getDefaultStore().get(sessionHolderAtom).state).toBe('loading')

    secondDeferred.resolve(secondEncrypted.encryptedSession)

    const [reloadResult, waiterResult] = await Promise.all([
      reloadPromise,
      waiterPromise,
    ])

    expect(reloadResult.sessionLoaded).toBe(true)
    expect(waiterResult.sessionLoaded).toBe(true)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedIn',
      session: withExpectedSessionUpgrades(secondSession),
    })
  })

  it('does not let a stale load settlement clear a newer in-flight latch', async () => {
    const firstSession = buildSession(dummySession.version + 90)
    const firstEncrypted = encryptSessionForStorage(firstSession)
    const firstDeferred = deferredValue<string | null>()
    const secondSession = buildSession(dummySession.version + 91)
    const secondEncrypted = encryptSessionForStorage(secondSession)
    const secondDeferred = deferredValue<string | null>()

    asyncStorageGetItemMock
      .mockImplementationOnce(() => firstDeferred.promise)
      .mockImplementationOnce(() => secondDeferred.promise)
    secretStoreGetItemAsyncMock
      .mockResolvedValueOnce(firstEncrypted.secretToken)
      .mockResolvedValueOnce(secondEncrypted.secretToken)

    const firstLoadPromise = Effect.runPromise(loadSession())
    expect(getDefaultStore().get(sessionHolderAtom).state).toBe('loading')

    // Simulate the state being reset while the first load is still in flight,
    // allowing a newer load to arm its own latch before the stale one settles.
    getDefaultStore().set(sessionHolderAtom, {state: 'initial'})
    const secondLoadPromise = Effect.runPromise(loadSession())
    expect(getDefaultStore().get(sessionHolderAtom).state).toBe('loading')

    firstDeferred.resolve(firstEncrypted.encryptedSession)
    const firstLoadResult = await firstLoadPromise
    expect(firstLoadResult.sessionLoaded).toBe(true)

    getDefaultStore().set(sessionHolderAtom, {state: 'loading'})
    const waiterPromise = Effect.runPromise(loadSession())
    const waiterResultPromise = waiterPromise.then((result) => result)

    const waiterResolvedBeforeSecondLoad = await Promise.race([
      waiterResultPromise.then(() => true),
      new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(false)
        }, 0)
      }),
    ])

    expect(waiterResolvedBeforeSecondLoad).toBe(false)

    secondDeferred.resolve(secondEncrypted.encryptedSession)
    const [secondLoadResult, waiterResult] = await Promise.all([
      secondLoadPromise,
      waiterResultPromise,
    ])

    expect(secondLoadResult.sessionLoaded).toBe(true)
    expect(waiterResult.sessionLoaded).toBe(true)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedIn',
      session: withExpectedSessionUpgrades(secondSession),
    })
  })

  it('loads session from approved snapshot storage strings', async () => {
    asyncStorageGetItemMock.mockResolvedValueOnce(
      snapshotSavedAsyncStorageValue
    )
    secretStoreGetItemAsyncMock.mockResolvedValueOnce(
      snapshotSavedSecretStorageValue
    )

    const result = await Effect.runPromise(loadSession({forceReload: false}))

    expect(result.sessionLoaded).toBe(true)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedIn',
      session: withExpectedSessionUpgrades(
        expectedSessionFromSnapshotSavedValues
      ),
    })
  })
})
