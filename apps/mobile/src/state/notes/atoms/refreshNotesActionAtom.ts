import {
  type NoteId,
  type NoteInfo,
  type OneNoteInState,
} from '@vexl-next/domain/src/general/notes'
import {isoNow} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import decryptNote from '@vexl-next/resources-utils/src/notes/decryptNote'
import fetchAllPaginatedData from '@vexl-next/rest-api/src/fetchAllPaginatedData'
import {Array, Effect, Either, Fiber, Option, pipe} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import reportError from '../../../utils/reportError'
import {sessionDataOrDummyAtom} from '../../session'
import {notesAtom, notesNextPageParamAtom, notesStateAtom} from './notesState'

const NOTES_PAGE_LIMIT = 30
const EXPIRY_PURGE_GRACE_MS = 24 * 60 * 60 * 1000

// The server returns one entry per private part, so the same note can appear
// multiple times (delivered directly and via one or more reposts). Prefer the
// non-repost part so a direct trust tier / common friends are shown.
const dedupeIncomingNotesByNoteId = (
  notes: readonly NoteInfo[]
): readonly NoteInfo[] =>
  pipe(
    notes,
    Array.groupBy((one) => one.noteId),
    (grouped) => Object.values(grouped),
    Array.filterMap((group) =>
      pipe(
        Array.findFirst(group, (one) => !one.privatePart.viaRepost),
        Option.orElse(() => Array.head(group))
      )
    )
  )

const mergeIncomingNotesToState = ({
  incomingNotes,
  storedNotes,
  removedNoteIds,
}: {
  incomingNotes: readonly NoteInfo[]
  storedNotes: readonly OneNoteInState[]
  removedNoteIds: readonly NoteId[]
}): OneNoteInState[] =>
  pipe(
    Array.union(
      Array.map(incomingNotes, (one) => one.noteId),
      Array.map(storedNotes, (one) => one.noteInfo.noteId)
    ),
    Array.filterMap((noteId) => {
      const incomingO = Array.findFirst(
        incomingNotes,
        (one) => one.noteId === noteId
      )
      const inStateO = Array.findFirst(
        storedNotes,
        (one) => one.noteInfo.noteId === noteId
      )

      // Keep my own notes untouched - they are managed locally.
      if (
        inStateO.pipe(
          Option.flatMapNullable((one) => one.ownershipInfo?.adminId),
          Option.isSome
        )
      ) {
        return inStateO
      }

      // Preserve local flags / repostInfo across refreshes.
      if (Option.isSome(inStateO) && Option.isSome(incomingO)) {
        return Option.some({
          ...inStateO.value,
          noteInfo: incomingO.value,
        } satisfies OneNoteInState)
      }

      if (Option.isSome(incomingO)) {
        // The owner's private payload carries the adminId, so ownership can be
        // restored even without local state (reinstall / another device).
        const adminId = incomingO.value.privatePart.adminId
        return Option.some({
          noteInfo: incomingO.value,
          flags: {reported: false},
          ...(adminId ? {ownershipInfo: {adminId}} : {}),
        } satisfies OneNoteInState)
      }

      return inStateO
    }),
    // Drop removed notes (but never my own - they may still be re-uploaded).
    Array.filter(
      (one) =>
        !!one.ownershipInfo?.adminId ||
        !Array.contains(removedNoteIds, one.noteInfo.noteId)
    ),
    // Purge notes (incl. my own) long after expiry so storage does not grow
    // forever. The UI already hides expired notes at render time; the grace
    // period only guards against device clock skew.
    Array.filter(
      (one) => one.noteInfo.expiresAt > Date.now() - EXPIRY_PURGE_GRACE_MS
    )
  )

const runRefreshNotesActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)
    const updateStartedAt = isoNow()
    const storedNotes = get(notesAtom)

    const serverNotes = yield* _(
      fetchAllPaginatedData({
        fetchEffectToRun: (nextPageToken) =>
          api.offer.getNotesForMeModifiedOrCreatedAfterPaginated({
            nextPageToken: nextPageToken ?? get(notesNextPageParamAtom),
            limit: NOTES_PAGE_LIMIT,
          }),
        storeNextPageToken: (nextPageToken) => {
          set(notesNextPageParamAtom, nextPageToken)
        },
      })
    )

    const decryptResults = yield* _(
      serverNotes,
      Array.map((serverNote) =>
        Effect.either(
          decryptNote(session.privateKey, session.keyPairV2)(serverNote)
        )
      ),
      Effect.all
    )

    const incomingNotes = pipe(
      decryptResults,
      Array.filterMap((result) => {
        if (Either.isRight(result)) return Option.some(result.right)
        if (result.left._tag === 'DecryptingNoteError') {
          reportError('error', new Error('Error while decrypting note'), {
            error: result.left,
          })
        }
        return Option.none()
      }),
      dedupeIncomingNotesByNoteId
    )

    // Sync deletions / expiry for notes not owned by me.
    const knownForeignNoteIds = pipe(
      storedNotes,
      Array.filter((one) => !one.ownershipInfo?.adminId),
      Array.map((one) => one.noteInfo.noteId)
    )

    const removedNoteIds = yield* _(
      Array.isNonEmptyReadonlyArray(knownForeignNoteIds)
        ? api.offer
            .getRemovedNotes({noteIds: knownForeignNoteIds})
            .pipe(Effect.map((res) => res.noteIds))
        : Effect.succeed<readonly NoteId[]>([]),
      Effect.catchAll((e) => {
        reportError('error', new Error('Error fetching removed notes'), {e})
        return Effect.succeed<readonly NoteId[]>([])
      })
    )

    set(notesStateAtom, (old) => ({
      ...old,
      notes: mergeIncomingNotesToState({
        incomingNotes,
        storedNotes: old.notes,
        removedNoteIds,
      }),
      lastUpdatedAt: updateStartedAt,
    }))
  }).pipe(
    Effect.catchAll((e) => {
      reportError('error', new Error('Error refreshing notes'), {e})
      return Effect.void
    })
  )
)

const inFlightRefreshFiberAtom = atom<Fiber.RuntimeFiber<void> | null>(null)

export const refreshNotesActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    const inFlightRefresh = get(inFlightRefreshFiberAtom)
    if (inFlightRefresh) return yield* _(Fiber.join(inFlightRefresh))

    const refreshFiber = yield* _(
      set(runRefreshNotesActionAtom).pipe(
        Effect.ensuring(
          Effect.sync(() => {
            set(inFlightRefreshFiberAtom, null)
          })
        ),
        Effect.forkDaemon
      )
    )

    set(inFlightRefreshFiberAtom, refreshFiber)
    return yield* _(Fiber.join(refreshFiber))
  })
)
