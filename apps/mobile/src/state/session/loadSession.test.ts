import AsyncStorage from '@react-native-async-storage/async-storage'
import {KeyHolder, aes} from '@vexl-next/cryptography'
import {KeyPairV2 as KeyPairV2Schema} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VexlAuthHeader} from '@vexl-next/rest-api/src/VexlAuthHeader'
import {Effect, Schema} from 'effect/index'
import * as SecretStore from 'expo-secure-store'
import {getDefaultStore} from 'jotai'
import {Alert, Linking} from 'react-native'
import {sessionHolderAtom} from '.'
import {
  type Session,
  type SessionV2,
  Session as SessionSchema,
} from '../../brands/Session.brand'
import reportError from '../../utils/reportError'
import {storage} from '../../utils/mmkv/effectMmkv'
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
  AFTER_FIRST_UNLOCK: 1,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}))

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  AndroidImportance: {HIGH: 1},
  default: {
    createChannel: jest.fn(async () => 'debug-channel'),
    displayNotification: jest.fn(async () => undefined),
    getDisplayedNotifications: jest.fn(async () => []),
  },
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
const secretStoreGetItemAsyncMock = jest.mocked(SecretStore.getItemAsync)
const secretStoreSetItemAsyncMock = jest.mocked(SecretStore.setItemAsync)
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

  it('loads session from storage and sets loggedIn state', async () => {
    const loadedSession = buildLoggedInSession(dummySession.version + 2)
    const {encryptedSession, secretToken} =
      encryptSessionForStorage(loadedSession)

    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock.mockResolvedValueOnce(secretToken)

    const result = await Effect.runPromise(
      loadSession({showErrorAlert: false, forceReload: false})
    )

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

    const result = await Effect.runPromise(
      loadSession({showErrorAlert: false, forceReload: false})
    )

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

    const result = await Effect.runPromise(
      loadSession({showErrorAlert: false, forceReload: false})
    )

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

    const result = await Effect.runPromise(
      loadSession({showErrorAlert: false, forceReload: false})
    )

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

    const result = await Effect.runPromise(
      loadSession({showErrorAlert: false, forceReload: false})
    )

    expect(result).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
      loadingError: {
        _tag: 'ParseError',
      },
    })
    expect(reportErrorMock).not.toHaveBeenCalled()
  })

  it('reports secure store read failure when encrypted session exists and v2 secret marker is set', async () => {
    const loadedSession = buildSession(dummySession.version + 34)
    const {encryptedSession} = encryptSessionForStorage(loadedSession)
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})

    markV2SecretAsWritten()
    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock.mockRejectedValueOnce(
      new Error('secure store failed')
    )

    const result = await Effect.runPromise(
      loadSession({showErrorAlert: true, forceReload: false})
    )

    expect(result).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
      loadingError: {
        _tag: 'V2SecretReadFailedAfterBeingWritten',
      },
    })
    expect(alertSpy).toHaveBeenCalledTimes(1)
    expect(reportErrorMock).toHaveBeenCalledTimes(1)

    const call = reportErrorMock.mock.calls.at(0)
    expect(call).toBeDefined()
    if (!call) {
      throw new Error('Expected reportError to be called')
    }

    expect(call[0]).toBe('error')
    expect(call[1].message).toContain('V2 session secret')
    expect(call[2]).toMatchObject({
      loadingError: {
        _tag: 'V2SecretReadFailedAfterBeingWritten',
      },
    })
  })

  it('reports v2 secret read failure without showing a native alert', async () => {
    const loadedSession = buildSession(dummySession.version + 35)
    const {encryptedSession} = encryptSessionForStorage(loadedSession)
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    markV2SecretAsWritten()
    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock.mockRejectedValueOnce(
      new Error('secure store failed')
    )

    const result = await Effect.runPromise(
      loadSession({
        showErrorAlert: false,
        forceReload: false,
      })
    )

    expect(result).toMatchObject({
      sessionLoaded: false,
      blockingRecoveryRequired: true,
      loadingError: {
        _tag: 'V2SecretReadFailedAfterBeingWritten',
      },
    })
    expect(alertSpy).not.toHaveBeenCalled()
    expect(reportErrorMock).toHaveBeenCalledTimes(1)

    const call = reportErrorMock.mock.calls.at(0)
    expect(call).toBeDefined()
    if (!call) {
      throw new Error('Expected reportError to be called')
    }

    expect(call[0]).toBe('error')
    expect(call[2]).toMatchObject({
      loadingError: {
        _tag: 'V2SecretReadFailedAfterBeingWritten',
      },
    })
  })

  it('shows an alert when secure store read fails and showErrorAlert is true', async () => {
    const loadedSession = buildSession(dummySession.version + 33)
    const {encryptedSession} = encryptSessionForStorage(loadedSession)
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    const openUrlSpy = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValueOnce(undefined)

    asyncStorageGetItemMock.mockResolvedValueOnce(encryptedSession)
    secretStoreGetItemAsyncMock.mockRejectedValueOnce(
      new Error('secure store failed')
    )

    const result = await Effect.runPromise(
      loadSession({showErrorAlert: true, forceReload: false})
    )

    expect(result.sessionLoaded).toBe(false)
    expect(alertSpy).toHaveBeenCalledTimes(1)
    const alertButtons = alertSpy.mock.calls.at(0)?.[2]
    expect(alertButtons).toBeDefined()
    expect(alertButtons?.at(0)?.onPress).toBeDefined()

    const firstButton = alertButtons?.at(0)
    if (!firstButton?.onPress) {
      throw new Error('Support contact button is missing onPress callback')
    }
    firstButton.onPress()

    expect(openUrlSpy).toHaveBeenCalledWith('mailto:support@vexl.test')
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedOut',
    })
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

    const result = await Effect.runPromise(
      loadSession({showErrorAlert: false, forceReload: true})
    )

    expect(result.sessionLoaded).toBe(true)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedIn',
      session: withExpectedSessionUpgrades(updatedSession),
    })
  })

  it('does not reload when forceReload is true but session is currently loading', async () => {
    getDefaultStore().set(sessionHolderAtom, {state: 'loading'})

    const result = await Effect.runPromise(
      loadSession({showErrorAlert: false, forceReload: true})
    )

    expect(result.sessionLoaded).toBe(false)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loading',
    })
    expect(asyncStorageGetItemMock).not.toHaveBeenCalled()
    expect(secretStoreGetItemAsyncMock).not.toHaveBeenCalled()
  })

  it('loads session from approved snapshot storage strings', async () => {
    asyncStorageGetItemMock.mockResolvedValueOnce(
      snapshotSavedAsyncStorageValue
    )
    secretStoreGetItemAsyncMock.mockResolvedValueOnce(
      snapshotSavedSecretStorageValue
    )

    const result = await Effect.runPromise(
      loadSession({showErrorAlert: false, forceReload: false})
    )

    expect(result.sessionLoaded).toBe(true)
    expect(getDefaultStore().get(sessionHolderAtom)).toEqual({
      state: 'loggedIn',
      session: withExpectedSessionUpgrades(
        expectedSessionFromSnapshotSavedValues
      ),
    })
  })
})
