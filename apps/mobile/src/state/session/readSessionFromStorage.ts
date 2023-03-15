import {pipe} from 'fp-ts/function'
import {
  aesDecrypt,
  type CryptoError,
  type ErrorReadingFromStore,
  getItemFromAsyncStorage,
  getItemFromSecretStorage,
  type JsonParseError,
  parseJson,
  safeParse,
  type StoreEmpty,
  type ZodParseError,
} from '../../utils/fpUtils'
import * as TE from 'fp-ts/TaskEither'
import {Session} from '../../brands/Session.brand'

export interface ParsingPrivateKeyError {
  _tag: 'errorParsingPrivateKey'
  error: unknown
}

export interface SecretStoreError {
  _tag: 'secretStoreError'
  error: unknown
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
    TE.chainW(({encryptedSessionJson, secretToken}) =>
      aesDecrypt(encryptedSessionJson, secretToken)
    ),
    TE.chainEitherKW(parseJson),
    TE.chainEitherKW(safeParse(Session))
  )
}
