import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {type Session} from '../../../brands/Session.brand'
import {
  aesEncrypt,
  saveItemToAsyncStorageFp,
  saveItemToSecretStorageFp,
  stringifyToJson,
  type CryptoError,
  type ErrorWritingToStore,
  type JsonStringifyError,
} from '../../../utils/fpUtils'

// TODO refactor to ReaderTaskEither to remove sideeffects
export default function writeSessionToStorage(
  session: Session,
  {
    asyncStorageKey,
    secretStorageKey,
  }: {asyncStorageKey: string; secretStorageKey: string}
): TE.TaskEither<ErrorWritingToStore | JsonStringifyError | CryptoError, void> {
  return pipe(
    TE.right(session),
    TE.bindTo('session'),
    TE.chainW(({session}) =>
      pipe(
        TE.right(session),
        TE.chainEitherKW(stringifyToJson),
        TE.chainW(aesEncrypt(session.privateKey.privateKeyPemBase64)),
        TE.chainFirstW(saveItemToAsyncStorageFp(asyncStorageKey)),
        TE.chainFirstW(() =>
          saveItemToSecretStorageFp(secretStorageKey)(
            session.privateKey.privateKeyPemBase64
          )
        )
      )
    ),

    TE.map(() => undefined)
  )
}
