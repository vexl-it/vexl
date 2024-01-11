import {pipe} from 'fp-ts/function'
import {
  aesDecrypt,
  type CryptoError,
  type ErrorReadingFromAsyncStorage,
  getItemFromAsyncStorage,
  getItemFromSecretStorage,
  type JsonParseError,
  parseJson,
  safeParse,
  type StoreEmpty,
  type ZodParseError,
  type ErrorReadingFromSecureStorage,
} from '../../utils/fpUtils'
import * as TE from 'fp-ts/TaskEither'
import {Session} from '../../brands/Session.brand'

export default function readSessionFromStorage({
  asyncStorageKey,
  secretStorageKey,
}: {
  asyncStorageKey: string
  secretStorageKey: string
}): TE.TaskEither<
  | StoreEmpty
  | ErrorReadingFromSecureStorage
  | ErrorReadingFromAsyncStorage
  | CryptoError
  | JsonParseError
  | ZodParseError<Session>,
  Session
> {
  return pipe(
    getItemFromAsyncStorage(asyncStorageKey),
    TE.bindTo('encryptedSessionJson'),
    TE.bindW('secretToken', () => getItemFromSecretStorage(secretStorageKey)),
    TE.chainW(({encryptedSessionJson, secretToken}) =>
      aesDecrypt(encryptedSessionJson, secretToken)
    ),
    TE.chainEitherKW(parseJson),
    TE.chainEitherKW(safeParse(Session))
  )
}
