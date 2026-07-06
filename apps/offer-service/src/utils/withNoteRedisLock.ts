import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type NoteAdminId,
  type NoteRepostId,
} from '@vexl-next/domain/src/general/notes'
import {
  withRedisLock,
  type RedisLockError,
  type RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Array, Effect, pipe, type ConfigError} from 'effect'
import {hashNoteAdminId, hashNoteRepostId} from './hashNoteIds'

export const withNoteAdminActionRedisLock =
  <A, E, R>(
    noteAdminId: NoteAdminId | NoteAdminId[]
  ): ((
    fnc: Effect.Effect<A, E, R>
  ) => Effect.Effect<
    A,
    E | UnexpectedServerError | ConfigError.ConfigError | RedisLockError,
    R | ServerCrypto | RedisService
  >) =>
  (fnc) =>
    Effect.all(
      pipe(
        Array.isArray(noteAdminId) ? noteAdminId : [noteAdminId],
        Array.map(hashNoteAdminId)
      )
    ).pipe(
      Effect.map((hashedIds) =>
        withRedisLock<A, E, R>(
          pipe(
            Array.map(hashedIds, (id) => `noteAdminAction:${id}`),
            Array.dedupe
          ),
          10_000
        )
      ),
      Effect.flatMap((lockFunction) => lockFunction(fnc))
    )

export const withNoteRepostActionRedisLock =
  <A, E, R>(
    noteRepostId: NoteRepostId | NoteRepostId[]
  ): ((
    fnc: Effect.Effect<A, E, R>
  ) => Effect.Effect<
    A,
    E | UnexpectedServerError | ConfigError.ConfigError | RedisLockError,
    R | ServerCrypto | RedisService
  >) =>
  (fnc) =>
    Effect.all(
      pipe(
        Array.isArray(noteRepostId) ? noteRepostId : [noteRepostId],
        Array.map(hashNoteRepostId)
      )
    ).pipe(
      Effect.map((hashedIds) =>
        withRedisLock<A, E, R>(
          pipe(
            Array.map(hashedIds, (id) => `noteRepostAction:${id}`),
            Array.dedupe
          ),
          10_000
        )
      ),
      Effect.flatMap((lockFunction) => lockFunction(fnc))
    )
