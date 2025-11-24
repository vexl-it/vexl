import {Effect, Either} from 'effect'
import {type Session} from '../../../brands/Session.brand'
import {
  aesEncrypt,
  saveItemToAsyncStorage,
  saveItemToSecretStorage,
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
): Effect.Effect<void, ErrorWritingToStore | JsonStringifyError | CryptoError> {
  return Effect.gen(function* (_) {
    const stringified = Either.match(stringifyToJson(session), {
      onLeft: (error) => {
        throw error
      },
      onRight: (value) => value,
    })

    const encrypted = yield* _(
      aesEncrypt(session.privateKey.privateKeyPemBase64)(stringified)
    )

    yield* _(saveItemToAsyncStorage(asyncStorageKey)(encrypted))
    yield* _(
      saveItemToSecretStorage(secretStorageKey)(
        session.privateKey.privateKeyPemBase64
      )
    )
  })
}
