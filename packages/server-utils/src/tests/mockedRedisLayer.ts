import {Effect, flow, HashMap, Layer, Option, Ref, Schema} from 'effect'
import {isReadonlyArrayNonEmpty} from 'effect/Array'
import {NoSuchElementError} from 'effect/Cause'
import {RedisService, type RedisOperations} from '../RedisService'

export const mockedRedisLayer = Layer.effect(
  RedisService,
  Effect.gen(function* () {
    const state = yield* Ref.make<
      HashMap.HashMap<string, {expiration: number; value: string}>
    >(HashMap.empty())

    const listState = yield* Ref.make<
      HashMap.HashMap<string, {value: readonly string[]}>
    >(HashMap.empty())

    const sortedSetState = yield* Ref.make<
      HashMap.HashMap<
        string,
        {value: ReadonlyArray<{item: string; score: number}>}
      >
    >(HashMap.empty())

    const valueExists = (
      hm: HashMap.HashMap<string, {expiration: number; value: string}>,
      key: string
    ): boolean =>
      HashMap.get(hm, key).pipe(
        Option.match({
          onNone: () => false,
          onSome: (value) =>
            value.expiration === -1 || value.expiration > Date.now(),
        })
      )

    const toReturn: RedisOperations = {
      delete: (key: string) => Ref.update(state, HashMap.remove(key)),
      exists: (key: string) =>
        Ref.get(state).pipe(Effect.map((hm) => valueExists(hm, key))),

      setExpiresAt: (key: string, expiresAt: number) =>
        Ref.update(state, (hm) =>
          HashMap.modify(hm, key, (v) => ({
            ...v,
            expiration: expiresAt,
          }))
        ),
      get: (schema) => (key: string) =>
        Ref.get(state).pipe(
          Effect.flatMap(flow(HashMap.get(key), Effect.fromOption)),
          Effect.filterOrFail(
            (val) => val.expiration === -1 || val.expiration > Date.now(),
            () => new NoSuchElementError()
          ),
          Effect.flatMap((v) =>
            Schema.decodeEffect(Schema.fromJsonString(schema))(v.value)
          )
        ),
      set: (schema) => (key: string, value: any, opts) =>
        Schema.encodeEffect(Schema.fromJsonString(schema))(value).pipe(
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
      setIfNotExists: (schema) => (key: string, value: any, opts) =>
        Schema.encodeEffect(Schema.fromJsonString(schema))(value).pipe(
          Effect.flatMap((encoded) =>
            Ref.modify(state, (hm) =>
              valueExists(hm, key)
                ? [false, hm]
                : [
                    true,
                    HashMap.set(hm, key, {
                      expiration: opts?.expiresAt ?? -1,
                      value: encoded,
                    }),
                  ]
            )
          )
        ),

      isInSet: (schema) => (key, value) =>
        Schema.encodeEffect(Schema.fromJsonString(schema))(value).pipe(
          Effect.flatMap((encoded) =>
            Ref.get(listState).pipe(
              Effect.flatMap(flow(HashMap.get(key), Effect.fromOption)),
              Effect.map((one) => one.value.includes(encoded))
            )
          ),
          Effect.catchTag('NoSuchElementError', () => Effect.succeed(false))
        ),
      insertToSet: (schema) => (key, values, opts) =>
        Schema.encodeEffect(Schema.Array(Schema.fromJsonString(schema)))(
          values
        ).pipe(
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
        Schema.encodeEffect(Schema.Array(Schema.fromJsonString(schema)))(
          values
        ).pipe(
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
          Effect.flatMap(flow(HashMap.get(key), Effect.fromOption)),
          Effect.map((one) => one.value),
          Effect.flatMap(
            Schema.decodeEffect(Schema.Array(Schema.fromJsonString(schema)))
          ),
          Effect.tap(Ref.update(listState, HashMap.remove(key)))
        ),

      getSet: (schema) => (key) =>
        Ref.get(listState).pipe(
          Effect.flatMap(flow(HashMap.get(key), Effect.fromOption)),
          Effect.map((one) => one.value),
          Effect.flatMap(
            Schema.decodeEffect(Schema.Array(Schema.fromJsonString(schema)))
          ),
          Effect.filterOrFail(isReadonlyArrayNonEmpty)
        ),

      addIntoSortedSet: (schema) => (key, value, score) =>
        Schema.encodeEffect(Schema.fromJsonString(schema))(value).pipe(
          Effect.flatMap((encoded) =>
            Ref.update(sortedSetState, (hashMap) =>
              HashMap.has(hashMap, key)
                ? HashMap.modify(hashMap, key, (v) => ({
                    value: [...v.value, {item: encoded, score}],
                  }))
                : HashMap.set(hashMap, key, {value: [{item: encoded, score}]})
            )
          )
        ),

      getSortedSet: (schema) => (key, order) =>
        Ref.get(sortedSetState).pipe(
          Effect.flatMap(flow(HashMap.get(key), Effect.fromOption)),
          Effect.map((one) =>
            [...one.value]
              .sort((a, b) =>
                order === 'asc' ? a.score - b.score : b.score - a.score
              )
              .map((v) => v.item)
          ),
          Effect.flatMap(
            Schema.decodeEffect(Schema.Array(Schema.fromJsonString(schema)))
          ),
          Effect.catchTag('NoSuchElementError', () => Effect.succeed([]))
        ),

      clearSortedSet: (key) => Ref.update(sortedSetState, HashMap.remove(key)),

      removeFromSortedSet: (schema) => (key, values) =>
        Schema.encodeEffect(Schema.Array(Schema.fromJsonString(schema)))(
          values
        ).pipe(
          Effect.flatMap((encoded) =>
            Ref.update(sortedSetState, (hashMap) =>
              HashMap.has(hashMap, key)
                ? HashMap.modify(hashMap, key, (v) => ({
                    value: v.value.filter(
                      (member) => !encoded.includes(member.item)
                    ),
                  }))
                : hashMap
            )
          )
        ),

      trimSortedSetToNewest: (key, maxCount) =>
        Ref.update(sortedSetState, (hashMap) =>
          HashMap.modify(hashMap, key, (v) => ({
            value: [...v.value]
              .sort((a, b) => b.score - a.score)
              .slice(0, maxCount),
          }))
        ),

      getAndDropSortedSet: (schema) => (key, order) =>
        Ref.get(sortedSetState).pipe(
          Effect.flatMap(flow(HashMap.get(key), Effect.fromOption)),
          Effect.map((one) =>
            [...one.value]
              .sort((a, b) =>
                order === 'asc' ? a.score - b.score : b.score - a.score
              )
              .map((v) => v.item)
          ),
          Effect.flatMap(
            Schema.decodeEffect(Schema.Array(Schema.fromJsonString(schema)))
          ),
          Effect.tap(Ref.update(sortedSetState, HashMap.remove(key))),
          Effect.catchTag('NoSuchElementError', () => Effect.succeed([]))
        ),

      withLock: (effect) => () => effect,
    }

    return toReturn
  })
)
