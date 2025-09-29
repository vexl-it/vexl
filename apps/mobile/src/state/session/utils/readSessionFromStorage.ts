import {
  aesCTRDecrypt,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Schema, type ParseResult} from 'effect/index'
import {SessionE, type Session} from '../../../brands/Session.brand'
import {
  getItemFromAsyncStorage,
  getItemFromSecretStorage,
  type ErrorReadingFromAsyncStorage,
  type ErrorReadingFromSecureStorage,
  type StoreEmpty,
} from '../../../utils/fpUtils'

export function readSessionFromStorageE({
  asyncStorageKey,
  secretStorageKey,
}: {
  asyncStorageKey: string
  secretStorageKey: string
}): Effect.Effect<
  Session,
  | StoreEmpty
  | ErrorReadingFromSecureStorage
  | ErrorReadingFromAsyncStorage
  | CryptoError
  | ParseResult.ParseError
> {
  return Effect.gen(function* (_) {
    const encryptedSessionJson = yield* _(
      getItemFromAsyncStorage(asyncStorageKey)
    )
    const secretToken = yield* _(getItemFromSecretStorage(secretStorageKey))

    return yield* _(
      aesCTRDecrypt(secretToken)(encryptedSessionJson),
      Effect.flatMap(Schema.decode(Schema.parseJson(SessionE)))
    )
  })
}
