import {type Session} from '../../brands/Session.brand'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {
  aesEncrypt,
  type CryptoError,
  type ErrorWritingToStore,
  stringifyToJson,
  type JsonStringifyError,
  saveItemToAsyncStorage,
  saveItemToSecretStorage,
} from '../../utils/fpUtils'

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
        TE.chainFirstW(saveItemToAsyncStorage(asyncStorageKey)),
        TE.chainFirstW(() =>
          saveItemToSecretStorage(secretStorageKey)(
            session.privateKey.privateKeyPemBase64
          )
        )
      )
    ),

    TE.map(() => undefined)
  )
}
