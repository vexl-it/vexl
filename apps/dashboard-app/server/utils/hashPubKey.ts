import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {hmacSign} from '@vexl-next/cryptography/src/operations/hmac'
import {Array, Context, Effect, Layer, pipe, Random, Schema} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {HashedPubKey} from '../../common/HashedPubKey'

const generateRandomSalt = (length: number): Effect.Effect<string> =>
  Effect.gen(function* () {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const array = Array.makeBy(length, (i) => '')

    return yield* pipe(
      array,
      Array.map(() =>
        Random.nextIntBetween(0, chars.length).pipe(Effect.map((i) => chars[i]))
      ),
      Effect.all,
      Effect.map(Array.join(''))
    )
  })

export class HasingSalt extends Context.Service<HasingSalt, string>()(
  'HasingSalt'
) {
  static readonly Live = Layer.effect(HasingSalt, generateRandomSalt(16))
}

export const secureHash = (
  data: PublicKeyPemBase64
): Effect.Effect<HashedPubKey, SchemaError, HasingSalt> =>
  HasingSalt.pipe(
    Effect.flatMap((salt) =>
      Effect.sync(() => hmacSign({password: salt, data}))
    ),
    Effect.flatMap((v) => Schema.decodeEffect(HashedPubKey)(v))
  )
