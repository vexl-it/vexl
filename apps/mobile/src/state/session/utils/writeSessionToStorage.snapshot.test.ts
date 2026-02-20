import AsyncStorage from '@react-native-async-storage/async-storage'
import {KeyHolder} from '@vexl-next/cryptography'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Effect, Either, Schema} from 'effect/index'
import * as SecretStore from 'expo-secure-store'
import {
  type Session,
  Session as SessionSchema,
} from '../../../brands/Session.brand'
import writeSessionToStorage from './writeSessionToStorage'

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

const asyncStorageSetItemMock = jest.mocked(AsyncStorage.setItem)
const secretStoreSetItemAsyncMock = jest.mocked(SecretStore.setItemAsync)

const deterministicPrivateKey = KeyHolder.importPrivateKey({
  privateKeyPemBase64: Schema.decodeSync(KeyHolder.PrivateKeyPemBase64)(
    'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1IZ0NBUUF3RUFZSEtvWkl6ajBDQVFZRks0RUVBQ0VFWVRCZkFnRUJCQnhLVWRKY3RyS2w0VlBCMTFPQmJtbHAKQzFkQWhoVzlhV0NxM2VlcG9Ud0RPZ0FFNFd0MVAyQ2dVczdEYjJLK1lLNUZ1cGY3NGpWa0o4aW5nSGRJUlpVWQpDSmQ1aFZCTXJRY0dFK2dyRFhDdlpMc29zZkp2M0dRdTc1QT0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo='
  ),
})

const deterministicSession: Session = Schema.decodeSync(SessionSchema)({
  version: 42,
  phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420777777777'),
  sessionCredentials: {
    publicKey: deterministicPrivateKey.publicKeyPemBase64,
    hash: 'snapshot-hash',
    signature: 'snapshot-signature',
  },
  privateKey: deterministicPrivateKey,
})

describe('writeSessionToStorage snapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('saves exact values into async and secret storage', async () => {
    const taskResult = await Effect.runPromise(
      writeSessionToStorage(deterministicSession).pipe(Effect.either)
    )

    expect(Either.isRight(taskResult)).toBe(true)
    expect(asyncStorageSetItemMock).toHaveBeenCalledTimes(1)
    expect(secretStoreSetItemAsyncMock).toHaveBeenCalledTimes(1)

    expect({
      asyncStorage: {
        key: asyncStorageSetItemMock.mock.calls.at(0)?.[0],
        value: asyncStorageSetItemMock.mock.calls.at(0)?.[1],
      },
      secretStorage: {
        key: secretStoreSetItemAsyncMock.mock.calls.at(0)?.[0],
        value: secretStoreSetItemAsyncMock.mock.calls.at(0)?.[1],
      },
    }).toMatchSnapshot()
  })
})
