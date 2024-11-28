import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {Session} from '../../../brands/Session.brand'
import {
  aesDecrypt,
  getItemFromAsyncStorageFp,
  getItemFromSecretStorageFp,
  parseJsonFp,
  safeParse,
  type CryptoError,
  type ErrorReadingFromAsyncStorage,
  type ErrorReadingFromSecureStorage,
  type JsonParseError,
  type StoreEmpty,
  type ZodParseError,
} from '../../../utils/fpUtils'

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
    getItemFromAsyncStorageFp(asyncStorageKey),
    TE.bindTo('encryptedSessionJson'),
    TE.bindW('secretToken', () => getItemFromSecretStorageFp(secretStorageKey)),
    TE.chainW(({encryptedSessionJson, secretToken}) =>
      aesDecrypt(encryptedSessionJson, secretToken)
    ),
    TE.chainEitherKW(parseJsonFp),
    TE.chainEitherKW(safeParse(Session))
  )
}
