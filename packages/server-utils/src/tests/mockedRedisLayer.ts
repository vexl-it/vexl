import {Effect, HashMap, Layer, Ref, Schema} from 'effect'
import {isNonEmptyReadonlyArray} from 'effect/Array'
import {NoSuchElementException} from 'effect/Cause'
import {RedisService, type RedisOperations} from '../RedisService'

export const mockedRedisLayer = Layer.effect(
  RedisService,
  Effect.gen(function* (_) {
    const state = yield* _(
      Ref.make<HashMap.HashMap<string, {expiration: number; value: string}>>(
        HashMap.empty()
      )
    )

    const listState = yield* _(
      Ref.make<HashMap.HashMap<string, {value: readonly string[]}>>(
        HashMap.empty()
      )
    )

    const toReturn: RedisOperations = {
      delete: (key: string) => Ref.update(state, HashMap.remove(key)),
      exists: (key: string) =>
        Ref.get(state).pipe(Effect.map((hm) => HashMap.has(hm, key))),

      setExpiresAt: (key: string, expiresAt: number) =>
        Ref.update(state, (hm) =>
          HashMap.modify(hm, key, (v) => ({
            ...v,
            expiration: expiresAt,
          }))
        ),
      get: (schema) => (key: string) =>
        Ref.get(state).pipe(
          Effect.flatMap(HashMap.get(key)),
          Effect.filterOrFail(
            (val) => val.expiration === -1 || val.expiration > Date.now(),
            () => new NoSuchElementException()
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

      isInSet: (schema) => (key, value) =>
        Schema.encode(Schema.parseJson(schema))(value).pipe(
          Effect.flatMap((encoded) =>
            Ref.get(listState).pipe(
              Effect.flatMap(HashMap.get(key)),
              Effect.map((one) => one.value.includes(encoded))
            )
          ),
          Effect.catchTag('NoSuchElementException', () => Effect.succeed(false))
        ),
      insertToSet: (schema) => (key, values, opts) =>
        Schema.encode(Schema.Array(Schema.parseJson(schema)))(values).pipe(
          Effect.flatMap((encoded) =>
            Ref.update(listState, (hashMap) =>
              HashMap.has(hashMap, key)
                ? HashMap.modify(hashMap, key, (v) => ({
                    value: [...v.value, ...encoded],
                  }))
                : HashMap.set(hashMap, key, {value: encoded})
            )
          ),
          Effect.flatMap(() => {
            const expiresAt = opts?.expiresAt
            return expiresAt !== undefined
              ? Ref.update(state, (hm) =>
                  HashMap.has(hm, key)
                    ? HashMap.modify(hm, key, (v) => ({
                        ...v,
                        expiration: expiresAt,
                      }))
                    : HashMap.set(hm, key, {
                        expiration: expiresAt,
                        value: '',
                      })
                )
              : Effect.void
          })
        ),

      deleteFromSet: (schema) => (key, values) =>
        Schema.encode(Schema.Array(Schema.parseJson(schema)))(values).pipe(
          Effect.flatMap((encoded) =>
            Ref.update(listState, (hashMap) =>
              HashMap.has(hashMap, key)
                ? HashMap.modify(hashMap, key, (v) => ({
                    value: v.value.filter((item) => !encoded.includes(item)),
                  }))
                : hashMap
            )
          )
        ),

      readAndDeleteSet: (schema) => (key) =>
        Ref.get(listState).pipe(
          Effect.tap((a) => Effect.log('Got values', a)),
          Effect.flatMap(HashMap.get(key)),
          Effect.map((one) => one.value),
          Effect.flatMap(Schema.decode(Schema.Array(Schema.parseJson(schema)))),
          Effect.zipLeft(Ref.update(listState, HashMap.remove(key)))
        ),

      getSet: (schema) => (key) =>
        Ref.get(listState).pipe(
          Effect.flatMap(HashMap.get(key)),
          Effect.map((one) => one.value),
          Effect.flatMap(Schema.decode(Schema.Array(Schema.parseJson(schema)))),
          Effect.filterOrFail(isNonEmptyReadonlyArray)
        ),

      withLock: (effect) => () => effect,
    }

    return toReturn
  })
)
