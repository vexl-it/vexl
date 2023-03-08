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
        TE.chainFirstW(saveItemToSecretStorage(secretStorageKey))
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
        TE.chainEitherKW(stringifyToJson),
        TE.chainW((json) => aesEncrypt(json, privateKeyRaw)),
        TE.chainFirstW(saveItemToAsyncStorage(asyncStorageKey))
      )
    ),
    TE.map(() => undefined)
  )
}
