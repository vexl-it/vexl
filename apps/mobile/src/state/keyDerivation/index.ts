import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubKeys} from '@vexl-next/domain/src/general/clubs'
import {
  KeyDerivationIndex,
  type MasterSeed,
} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {
  type NoteId,
  type NoteRepostId,
} from '@vexl-next/domain/src/general/notes'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  deriveClubKeys,
  deriveInboxPrivateKey,
  deriveNoteRepostId,
} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {Effect, Either, Fiber, Option, Schema} from 'effect'
import {atom, type Getter} from 'jotai'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorageWithImmediateSaveOption} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {KEY_DERIVATION_COUNTERS_MMKV_KEY} from '../../utils/mmkv/criticalMmkvKeys'
import {storage} from '../../utils/mmkv/effectMmkv'
import {getNotificationTokenWithTimeoutE} from '../../utils/notifications'
import {sessionAtom} from '../session'
import {findClubUuidOfMember, scanClubs, scanInboxes} from './scanDerivedKeys'

export const KeyDerivationCounters = Schema.Struct({
  nextInboxIndex: KeyDerivationIndex,
  nextClubIndex: KeyDerivationIndex,
})
export type KeyDerivationCounters = typeof KeyDerivationCounters.Type

const keyDerivationCountersStorage =
  atomWithParsedMmkvStorageWithImmediateSaveOption(
    KEY_DERIVATION_COUNTERS_MMKV_KEY,
    {
      nextInboxIndex: KeyDerivationIndex.make(0),
      nextClubIndex: KeyDerivationIndex.make(0),
    },
    KeyDerivationCounters
  )

export const keyDerivationCountersAtom = atom((get) =>
  get(keyDerivationCountersStorage.atom)
)

// Raises the counters to at least the given values, never lowers them.
export const raiseKeyDerivationCountersActionAtom = atom(
  null,
  (_, set, minimal: KeyDerivationCounters) => {
    set(keyDerivationCountersStorage.setAndSaveImmediatelyAtom, (current) => ({
      nextInboxIndex: KeyDerivationIndex.make(
        Math.max(current.nextInboxIndex, minimal.nextInboxIndex)
      ),
      nextClubIndex: KeyDerivationIndex.make(
        Math.max(current.nextClubIndex, minimal.nextClubIndex)
      ),
    }))
  }
)

// For a new seed, where no index has been used yet.
export const initializeKeyDerivationCountersActionAtom = atom(
  null,
  (_, set) => {
    set(raiseKeyDerivationCountersActionAtom, {
      nextInboxIndex: KeyDerivationIndex.make(0),
      nextClubIndex: KeyDerivationIndex.make(0),
    })
  }
)

// Deriving from the dummy session's seed would silently create keys that
// can't be restored, so a missing session is treated as a bug.
const loggedInMasterSeed = (get: Getter): Effect.Effect<MasterSeed> => {
  const session = get(sessionAtom)
  return session.state === 'loggedIn'
    ? Effect.succeed(session.session.masterSeed)
    : Effect.dieMessage('Keys can only be derived for a logged in user')
}

export class KeyDerivationCountersRecoveryError extends Schema.TaggedError<KeyDerivationCountersRecoveryError>(
  'KeyDerivationCountersRecoveryError'
)('KeyDerivationCountersRecoveryError', {
  cause: Schema.Unknown,
}) {}

const areCountersStored = (): boolean =>
  Either.isRight(
    storage.getVerified(KEY_DERIVATION_COUNTERS_MMKV_KEY, KeyDerivationCounters)
  )

// Counters lost while the session survived: continue past the keys that still
// exist on the server, same as after a restore.
const recoverCountersFromServerActionAtom = atom(
  null,
  (get, set): Effect.Effect<void, KeyDerivationCountersRecoveryError> =>
    Effect.gen(function* () {
      const masterSeed = yield* loggedInMasterSeed(get)
      const api = get(apiAtom)
      const notificationToken = yield* getNotificationTokenWithTimeoutE()

      const [inboxes, clubs] = yield* Effect.all(
        [
          scanInboxes({masterSeed, chatApi: api.chat}),
          scanClubs({
            masterSeed,
            findClubUuid: findClubUuidOfMember({
              contactApi: api.contact,
              notificationToken,
            }),
          }),
        ],
        {concurrency: 'unbounded'}
      )

      set(raiseKeyDerivationCountersActionAtom, {
        nextInboxIndex: inboxes.nextIndex,
        nextClubIndex: clubs.nextIndex,
      })
    }).pipe(
      Effect.mapError(
        (cause) => new KeyDerivationCountersRecoveryError({cause})
      )
    )
)

const countersRecoveryFiberAtom = atom<
  Option.Option<Fiber.RuntimeFiber<void, KeyDerivationCountersRecoveryError>>
>(Option.none())

export const ensureKeyDerivationCountersActionAtom = atom(
  null,
  (get, set): Effect.Effect<void, KeyDerivationCountersRecoveryError> =>
    Effect.gen(function* () {
      if (areCountersStored()) return

      const inFlightRecovery = get(countersRecoveryFiberAtom)
      if (Option.isSome(inFlightRecovery))
        return yield* Fiber.join(inFlightRecovery.value)

      const recoveryFiber = yield* set(
        recoverCountersFromServerActionAtom
      ).pipe(
        Effect.ensuring(
          Effect.sync(() => {
            set(countersRecoveryFiberAtom, Option.none())
          })
        ),
        Effect.forkDaemon
      )
      set(countersRecoveryFiberAtom, Option.some(recoveryFiber))
      return yield* Fiber.join(recoveryFiber)
    })
)

// The incremented counter is persisted synchronously before the index is
// handed out, so an index is never reused even if the app dies right after.
const allocateIndexActionAtom = atom(
  null,
  (
    get,
    set,
    counter: keyof KeyDerivationCounters
  ): Effect.Effect<KeyDerivationIndex, KeyDerivationCountersRecoveryError> =>
    set(ensureKeyDerivationCountersActionAtom).pipe(
      Effect.map(() => {
        const counters = get(keyDerivationCountersStorage.atom)
        const index = counters[counter]
        set(keyDerivationCountersStorage.setAndSaveImmediatelyAtom, {
          ...counters,
          [counter]: KeyDerivationIndex.make(index + 1),
        })
        return index
      })
    )
)

export const createInboxPrivateKeyActionAtom = atom(
  null,
  (
    get,
    set
  ): Effect.Effect<
    PrivateKeyHolder,
    CryptoError | KeyDerivationCountersRecoveryError
  > =>
    Effect.gen(function* () {
      const masterSeed = yield* loggedInMasterSeed(get)
      return yield* deriveInboxPrivateKey(
        masterSeed,
        yield* set(allocateIndexActionAtom, 'nextInboxIndex')
      )
    })
)

export const createClubKeysActionAtom = atom(
  null,
  (
    get,
    set
  ): Effect.Effect<
    ClubKeys,
    CryptoError | KeyDerivationCountersRecoveryError
  > =>
    Effect.gen(function* () {
      const masterSeed = yield* loggedInMasterSeed(get)
      return yield* deriveClubKeys(
        masterSeed,
        yield* set(allocateIndexActionAtom, 'nextClubIndex')
      )
    })
)

export const noteRepostIdActionAtom = atom(
  null,
  (get, _, noteId: NoteId): Effect.Effect<NoteRepostId> =>
    Effect.map(loggedInMasterSeed(get), (masterSeed) =>
      deriveNoteRepostId(masterSeed, noteId)
    )
)
