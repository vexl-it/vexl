import {pipe} from 'fp-ts/function'
import {
  aesDecrypt,
  type CryptoError,
  type ErrorReadingFromStore,
  fsParseJson,
  fsSafeParseE,
  getItemFromAsyncStorage,
  getItemFromSecretStorage,
  type JsonParseError,
  type StoreEmpty,
  type ZodParseError,
} from '../../utils/fsUtils'
import * as TE from 'fp-ts/TaskEither'
import {Session} from '../../brands/Session.brand'
import * as crypto from '@vexl-next/cryptography'
import {KeyFormat, type PrivateKey} from '@vexl-next/cryptography'

export interface ParsingPrivateKeyError {
  _tag: 'errorParsingPrivateKey'
  error: unknown
}

export interface SecretStoreError {
  _tag: 'secretStoreError'
  error: unknown
}
function fsParseRawPrivateKey(
  rawKey: string
): TE.TaskEither<ParsingPrivateKeyError, PrivateKey> {
  return TE.tryCatch(
    async () => crypto.PrivateKey.import({key: rawKey, type: KeyFormat.RAW}),
    (e) => {
      return {_tag: 'errorParsingPrivateKey', error: e} as const
    }
  )
}
export default function readSessionFromStorage({
  asyncStorageKey,
  secretStorageKey,
}: {
  asyncStorageKey: string
  secretStorageKey: string
}): TE.TaskEither<
  | StoreEmpty
  | ErrorReadingFromStore
  | SecretStoreError
  | CryptoError
  | ParsingPrivateKeyError
  | JsonParseError
  | ZodParseError<Session>,
  Session
> {
  return pipe(
    getItemFromAsyncStorage(asyncStorageKey),
    TE.bindTo('encryptedSessionJson'),
    TE.bindW('secretToken', () =>
      pipe(
        getItemFromSecretStorage(secretStorageKey),
        TE.mapLeft((l) => {
          return {_tag: 'secretStoreError', error: l} as const
        })
      )
    ),
    TE.bindW('decryptedJson', ({encryptedSessionJson, secretToken}) =>
      aesDecrypt(encryptedSessionJson, secretToken)
    ),
    TE.bindW('privateKey', ({secretToken}) =>
      fsParseRawPrivateKey(secretToken)
    ),
    TE.bindW('decrypted', ({decryptedJson}) =>
      TE.fromEither(fsParseJson(decryptedJson))
    ),
    TE.map(({decrypted, privateKey}) => ({
      ...decrypted,
      sessionCredentials: {
        ...decrypted?.sessionCredentials,
        privateKey,
      },
    })),
    TE.chainEitherKW(fsSafeParseE(Session))
  )
}
