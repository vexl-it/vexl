import {type Session} from '../../brands/Session.brand'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {
  aesEncrypt,
  type CryptoError,
  type ErrorWritingToStore,
  fsStringifyJson,
  type JsonStringifyError,
  saveItemToAsyncStorage,
  saveItemToSecretStorage,
} from '../../utils/fsUtils'
import {KeyFormat} from '@vexl-next/cryptography'

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
    TE.bindW('privateKeyRaw', ({session}) =>
      pipe(
        TE.right(
          session.sessionCredentials.privateKey.exportPrivateKey(KeyFormat.RAW)
        ),
        TE.chainFirstW((privateKeyRaw) =>
          saveItemToSecretStorage(secretStorageKey, privateKeyRaw)
        )
      )
    ),
    TE.bindW('jsonStringToSave', ({session, privateKeyRaw}) =>
      pipe(
        TE.right({
          ...session,
          sessionCredentials: {
            ...session.sessionCredentials,
            privateKey: undefined,
          },
        }),
        TE.chainEitherKW(fsStringifyJson),
        TE.chainW((json) => aesEncrypt(json, privateKeyRaw)),
        TE.chainFirstW((toSave) =>
          saveItemToAsyncStorage(asyncStorageKey, toSave)
        )
      )
    ),
    TE.map(() => undefined)
  )
}
