import {Schema} from '@effect/schema'
import {Effect, HashMap, Layer, Ref} from 'effect'
import {
  RecordDoesNotExistsReddisError,
  type RedisOperations,
  RedisService,
} from '../RedisService'

export const mockedRedisLayer = Layer.effect(
  RedisService,
  Effect.gen(function* (_) {
    const state = yield* _(
      Ref.make<HashMap.HashMap<string, {expiration: number; value: string}>>(
        HashMap.empty()
      )
    )

    const toReturn: RedisOperations = {
      delete: (key: string) => Ref.update(state, HashMap.remove(key)),
      get: (schema) => (key: string) =>
        Ref.get(state).pipe(
          Effect.flatMap(HashMap.get(key)),
          Effect.catchTag(
            'NoSuchElementException',
            () => new RecordDoesNotExistsReddisError()
          ),
          Effect.filterOrFail(
            (val) => val.expiration === -1 || val.expiration > Date.now(),
            () => new RecordDoesNotExistsReddisError()
          ),
          Effect.flatMap((v) =>
            Schema.decode(Schema.parseJson(schema))(v.value)
          )
        ),
      set: (schema) => (key: string, value: any, opts) =>
        Schema.encode(Schema.parseJson(schema))(value).pipe(
          Effect.flatMap((encoded) =>
            Ref.update(
              state,
              HashMap.set(key, {
                expiration: opts?.expiresAt ?? -1,
                value: encoded,
              })
            )
          )
        ),
    }

    return toReturn
  })
)
