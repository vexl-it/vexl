import {isPublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {
  type NoteAdminId,
  type NoteRepostId,
} from '@vexl-next/domain/src/general/notes'
import {
  UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import updateNotePrivateParts from '@vexl-next/resources-utils/src/notes/updateNotePrivateParts'
import updateRepostNotePrivateParts from '@vexl-next/resources-utils/src/notes/updateRepostNotePrivateParts'
import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import {subtractArrays} from '@vexl-next/resources-utils/src/utils/array'
import {Array, Effect, HashMap, Option, Schema} from 'effect'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import reportError from '../../../utils/reportError'
import {
  myNotesAtom,
  notesAtom,
  notesStateAtom,
} from '../../notes/atoms/notesState'
import {sessionDataOrDummyAtom} from '../../session'
import {
  NoteToConnectionsItems,
  type ConnectionsState,
  type NoteToConnectionsItem,
} from '../domain'
import {getConnectionsToRefresh} from '../utils/getChangedConnectionPublicKeys'
import {resolveFetchedConnections} from '../utils/resolveFetchedConnections'
import {fetchConnectionsActionAtom} from './connectionStateAtom'
import {
  deleteRepostToConnectionsActionAtom,
  repostToConnectionsAtom,
} from './repostToConnectionsAtom'

const BACKGROUND_TIME_LIMIT_MS = 25_000
const noteConnectionUpdatesSemaphoreAtom = atom(() =>
  Effect.unsafeMakeSemaphore(1)
)

export const noteToConnectionsAtom = atomWithParsedMmkvStorage(
  'note-to-connections',
  {
    noteToConnections: [],
  },
  NoteToConnectionsItems
)

export const upsertNoteToConnectionsActionAtom = atom<
  null,
  [NoteToConnectionsItem],
  unknown
>(null, (get, set, newValue) => {
  set(noteToConnectionsAtom, (previousValue) => ({
    ...previousValue,
    noteToConnections: [
      ...previousValue.noteToConnections.filter(
        (one) => one.adminId !== newValue.adminId
      ),
      newValue,
    ],
  }))
})

export const deleteNoteToConnectionsActionAtom = atom(
  null,
  (get, set, adminIdsToDelete: readonly NoteAdminId[]) => {
    set(noteToConnectionsAtom, (old) => ({
      ...old,
      noteToConnections: old.noteToConnections.filter(
        (one) => !Array.contains(adminIdsToDelete, one.adminId)
      ),
    }))
  }
)

const filterNotExpiredNotes = <T extends {noteInfo: {expiresAt: number}}>(
  notes: readonly T[]
): readonly T[] => {
  const now = unixMillisecondsNow()
  return pipe(
    notes,
    Array.filter((note) => note.noteInfo.expiresAt > now)
  )
}

// Drops records of deleted/expired notes and creates empty records for notes
// that miss one (notes created before connection tracking existed). An empty
// record makes the next update re-encrypt for every current connection.
// Direct private parts are replaced without touching repost sharing paths.
const ensureConnectionsRecordForEveryMyNoteActionAtom = atom(
  null,
  (get, set) => {
    const myNotes = filterNotExpiredNotes(get(myNotesAtom))

    set(noteToConnectionsAtom, (old) => ({
      ...old,
      noteToConnections: pipe(
        myNotes,
        Array.map((note) =>
          pipe(
            Array.findFirst(
              old.noteToConnections,
              (one) => one.adminId === note.ownershipInfo.adminId
            ),
            Option.getOrElse(() => ({
              adminId: note.ownershipInfo.adminId,
              symmetricKey: note.noteInfo.privatePart.symmetricKey,
              pendingConnectionsToRefresh: [],
              connections: {
                firstLevel: [],
                secondLevel: [],
              },
            }))
          )
        )
      ),
    }))
  }
)

// Drops repost records that no longer match a reposted note in the state —
// the note was deleted/expired locally, the repost was undone, or the note
// was re-reposted under a new repostId.
const dropOrphanRepostConnectionsRecordsActionAtom = atom(null, (get, set) => {
  const notes = get(notesAtom)

  set(repostToConnectionsAtom, (old) => ({
    repostToConnections: pipe(
      old.repostToConnections,
      Array.filter((record) =>
        pipe(
          notes,
          Array.some(
            (note) =>
              note.noteInfo.noteId === record.noteId &&
              note.repostInfo?.repostId === record.repostId
          )
        )
      )
    ),
  }))
})

// Number of records `updateAndReencryptAllNotesConnectionsActionAtom` will
// process — one per own note plus one per tracked repost. Read up front by
// flows that need to size the notes part of an aggregated progress bar.
export const noteRecordsToReencryptCountAtom = atom(
  (get) =>
    filterNotExpiredNotes(get(myNotesAtom)).length +
    get(repostToConnectionsAtom).repostToConnections.length
)

export const updateAndReencryptAllNotesConnectionsActionAtom = atom(
  null,
  (
    get,
    set,
    {
      isInBackground,
      onProgres,
      fetchedConnections,
    }: {
      isInBackground?: boolean
      onProgres?: (args: {
        noteI: number
        totalNotes: number
        progress: OfferEncryptionProgress
      }) => void
      fetchedConnections?: Option.Option<ConnectionsState>
    }
  ): Effect.Effect<
    ReadonlyArray<
      | {readonly adminId: NoteAdminId; readonly success: boolean}
      | {readonly repostId: NoteRepostId; readonly success: boolean}
    >
  > =>
    Effect.gen(function* (_) {
      const stopProcessingAfter: UnixMilliseconds | undefined = isInBackground
        ? Schema.decodeSync(UnixMilliseconds)(
            unixMillisecondsNow() + BACKGROUND_TIME_LIMIT_MS
          )
        : undefined

      set(ensureConnectionsRecordForEveryMyNoteActionAtom)
      set(dropOrphanRepostConnectionsRecordsActionAtom)

      const noteConnections = get(noteToConnectionsAtom).noteToConnections
      const repostConnections = get(repostToConnectionsAtom).repostToConnections
      const totalRecords = noteConnections.length + repostConnections.length
      if (totalRecords === 0) return []

      console.info(
        `🗒️ Updating note connections. Total notes to update: ${noteConnections.length}. Total reposts to update: ${repostConnections.length}.`
      )

      const previous = get(noteToConnectionsAtom).connectionsState
      const fetched = yield* _(
        resolveFetchedConnections({
          fetchedConnections,
          baselineLastUpdate: previous?.lastUpdate ?? UnixMilliseconds0,
          fetch: () => set(fetchConnectionsActionAtom),
        })
      )
      const connectionState = Option.getOrElse(fetched, () => previous)
      if (!connectionState) {
        return [
          ...Array.map(noteConnections, ({adminId}) => ({
            adminId,
            success: false,
          })),
          ...Array.map(repostConnections, ({repostId}) => ({
            repostId,
            success: false,
          })),
        ]
      }
      const changedKeys = previous
        ? getConnectionsToRefresh(
            {...previous, verifiedFriends: HashMap.empty()},
            {...connectionState, verifiedFriends: HashMap.empty()}
          )
        : Array.filter(
            [...connectionState.firstLevel, ...connectionState.secondLevel],
            isPublicKeyV2
          )
      // Save the note baseline and each note's pending recipients together.
      // Offer refreshes never advance this baseline or consume these queues.
      set(noteToConnectionsAtom, (old) => ({
        ...old,
        connectionsState: connectionState,
        noteToConnections: Array.map(old.noteToConnections, (one) => {
          const recipients = new Set([
            ...one.connections.firstLevel,
            ...one.connections.secondLevel,
          ])
          return {
            ...one,
            pendingConnectionsToRefresh: Array.dedupe([
              ...one.pendingConnectionsToRefresh,
              ...Array.filter(changedKeys, (key) => recipients.has(key)),
            ]),
          }
        }),
      }))
      noteToConnectionsAtom.flushNow()

      const offerApi = get(apiAtom).offer
      const session = get(sessionDataOrDummyAtom)

      const processMyNotes = pipe(
        get(noteToConnectionsAtom).noteToConnections,
        Array.map((oneNoteConnections, i) =>
          updateNotePrivateParts({
            currentConnections: oneNoteConnections.connections,
            targetConnections: {
              firstLevel: connectionState.firstLevel,
              secondLevel: connectionState.secondLevel,
            },
            commonFriends: connectionState.commonFriends,
            connectionsToRefresh:
              oneNoteConnections.pendingConnectionsToRefresh,
            ownerPublicKeys: [
              session.privateKey.publicKeyPemBase64,
              session.keyPairV2.publicKey,
            ],
            adminId: oneNoteConnections.adminId,
            symmetricKey: oneNoteConnections.symmetricKey,
            stopProcessingAfter,
            api: offerApi,
            onProgress: onProgres
              ? (progress) => {
                  onProgres({
                    noteI: i,
                    totalNotes: totalRecords,
                    progress,
                  })
                }
              : undefined,
          }).pipe(
            Effect.map(
              ({
                noteNotFoundOnServer,
                updateSuccess,
                encryptionErrors,
                newConnections,
                removedConnections,
                timeLimitReachedErrors,
              }) => {
                if (noteNotFoundOnServer) {
                  set(deleteNoteToConnectionsActionAtom, [
                    oneNoteConnections.adminId,
                  ])
                  set(notesAtom, (notes) =>
                    Array.filter(
                      notes,
                      (one) =>
                        one.ownershipInfo?.adminId !==
                        oneNoteConnections.adminId
                    )
                  )
                  notesStateAtom.flushNow()
                  return {adminId: oneNoteConnections.adminId, success: true}
                }
                if (encryptionErrors.length > 0) {
                  reportError(
                    'error',
                    new Error(
                      'Error while encrypting new connections for note'
                    ),
                    {count: encryptionErrors.length}
                  )
                }
                if (timeLimitReachedErrors.length > 0) {
                  reportError(
                    'warn',
                    new Error(
                      `Note did not update fully due to time limit reached. Skipped: ${timeLimitReachedErrors.length}.`
                    ),
                    {count: timeLimitReachedErrors.length}
                  )
                }

                set(noteToConnectionsAtom, (old) => ({
                  ...old,
                  noteToConnections: Array.map(old.noteToConnections, (one) =>
                    one.adminId === oneNoteConnections.adminId
                      ? {
                          ...one,
                          pendingConnectionsToRefresh: updateSuccess
                            ? []
                            : one.pendingConnectionsToRefresh,
                          connections: {
                            firstLevel: subtractArrays(
                              [
                                ...one.connections.firstLevel,
                                ...newConnections.firstLevel,
                              ],
                              removedConnections
                            ),
                            secondLevel: subtractArrays(
                              [
                                ...one.connections.secondLevel,
                                ...newConnections.secondLevel,
                              ],
                              removedConnections
                            ),
                          },
                        }
                      : one
                  ),
                }))

                return {
                  adminId: oneNoteConnections.adminId,
                  success: updateSuccess,
                }
              }
            ),
            Effect.catchAll((e) =>
              Effect.sync(() => {
                reportError(
                  'warn',
                  new Error('Unable to update note connections'),
                  {errorTag: e._tag}
                )
                return {adminId: oneNoteConnections.adminId, success: false}
              })
            )
          )
        ),
        Effect.all
      )

      const processReposts = pipe(
        repostConnections,
        Array.map((oneRepostConnections, i) =>
          updateRepostNotePrivateParts({
            currentConnections: oneRepostConnections.connections,
            targetConnections: {
              firstLevel: connectionState.firstLevel,
              secondLevel: connectionState.secondLevel,
            },
            ownerPublicKeys: [
              session.privateKey.publicKeyPemBase64,
              session.keyPairV2.publicKey,
            ],
            repostId: oneRepostConnections.repostId,
            noteId: oneRepostConnections.noteId,
            symmetricKey: oneRepostConnections.symmetricKey,
            stopProcessingAfter,
            api: offerApi,
            onProgress: onProgres
              ? (progress) => {
                  onProgres({
                    noteI: noteConnections.length + i,
                    totalNotes: totalRecords,
                    progress,
                  })
                }
              : undefined,
          }).pipe(
            Effect.map(
              ({
                updateSuccess,
                encryptionErrors,
                newConnections,
                removedConnections,
                timeLimitReachedErrors,
                repostNotFoundOnServer,
              }) => {
                if (repostNotFoundOnServer) {
                  // The reposted note is gone on the server (deleted or
                  // expired) — drop the local record instead of retrying.
                  set(deleteRepostToConnectionsActionAtom, [
                    oneRepostConnections.repostId,
                  ])
                  return {
                    repostId: oneRepostConnections.repostId,
                    success: true,
                  }
                }

                if (encryptionErrors.length > 0) {
                  reportError(
                    'error',
                    new Error(
                      'Error while encrypting new connections for note repost'
                    ),
                    {count: encryptionErrors.length}
                  )
                }
                if (timeLimitReachedErrors.length > 0) {
                  reportError(
                    'warn',
                    new Error(
                      `Note repost did not update fully due to time limit reached. Skipped: ${timeLimitReachedErrors.length}.`
                    ),
                    {count: timeLimitReachedErrors.length}
                  )
                }

                set(repostToConnectionsAtom, (old) => ({
                  repostToConnections: old.repostToConnections.map((one) =>
                    one.repostId === oneRepostConnections.repostId
                      ? {
                          ...one,
                          connections: {
                            firstLevel: subtractArrays(
                              [
                                ...one.connections.firstLevel,
                                ...newConnections.firstLevel,
                              ],
                              removedConnections
                            ),
                            secondLevel: subtractArrays(
                              [
                                ...one.connections.secondLevel,
                                ...newConnections.secondLevel,
                              ],
                              removedConnections
                            ),
                          },
                        }
                      : one
                  ),
                }))

                return {
                  repostId: oneRepostConnections.repostId,
                  success: updateSuccess,
                }
              }
            ),
            Effect.catchAll((e) =>
              Effect.sync(() => {
                reportError(
                  'warn',
                  new Error('Unable to update repost connections'),
                  {errorTag: e._tag}
                )
                return {repostId: oneRepostConnections.repostId, success: false}
              })
            )
          )
        ),
        Effect.all
      )

      const results = yield* _(
        Effect.zipWith(
          processMyNotes,
          processReposts,
          (
            noteResults,
            repostResults
          ): ReadonlyArray<
            | {readonly adminId: NoteAdminId; readonly success: boolean}
            | {readonly repostId: NoteRepostId; readonly success: boolean}
          > => [...noteResults, ...repostResults]
        ),
        Effect.ensuring(
          Effect.sync(() => {
            // Server has been mutated for every processed note by now — force a
            // durable write so local records can't fall behind on a hard kill.
            noteToConnectionsAtom.flushNow()
            repostToConnectionsAtom.flushNow()
          })
        )
      )
      return Option.isSome(fetched)
        ? results
        : Array.map(results, (one) => ({...one, success: false}))
    }).pipe(get(noteConnectionUpdatesSemaphoreAtom).withPermits(1))
)
