import {
  type NoteAdminId,
  type NoteRepostId,
} from '@vexl-next/domain/src/general/notes'
import {
  UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import updateNotePrivateParts from '@vexl-next/resources-utils/src/notes/updateNotePrivateParts'
import updateRepostNotePrivateParts from '@vexl-next/resources-utils/src/notes/updateRepostNotePrivateParts'
import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import {subtractArrays} from '@vexl-next/resources-utils/src/utils/array'
import {Array, Effect, Option, Schema} from 'effect'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import reportError from '../../../utils/reportError'
import {myNotesAtom, notesAtom} from '../../notes/atoms/notesState'
import {sessionDataOrDummyAtom} from '../../session'
import {NoteToConnectionsItems, type NoteToConnectionsItem} from '../domain'
import connectionStateAtom from './connectionStateAtom'
import {
  deleteRepostToConnectionsActionAtom,
  repostToConnectionsAtom,
} from './repostToConnectionsAtom'

const BACKGROUND_TIME_LIMIT_MS = 25_000

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
      noteToConnections: old.noteToConnections.filter(
        (one) => !Array.contains(adminIdsToDelete, one.adminId)
      ),
    }))
  }
)

// Drops records of deleted/expired notes and creates empty records for notes
// that miss one (notes created before connection tracking existed). An empty
// record makes the next update re-encrypt for every current connection —
// the server allows private parts duplicated against existing rows, so
// already-covered contacts are unaffected.
const ensureConnectionsRecordForEveryMyNoteActionAtom = atom(
  null,
  (get, set) => {
    const myNotes = get(myNotesAtom)

    set(noteToConnectionsAtom, (old) => ({
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

export const updateAndReencryptAllNotesConnectionsActionAtom = atom(
  null,
  (
    get,
    set,
    {
      isInBackground,
      onProgres,
    }: {
      isInBackground?: boolean
      onProgres?: (args: {
        noteI: number
        totalNotes: number
        progress: OfferEncryptionProgress
      }) => void
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

      const offerApi = get(apiAtom).offer
      const connectionState = get(connectionStateAtom)
      const session = get(sessionDataOrDummyAtom)

      const processMyNotes = pipe(
        noteConnections,
        Array.map((oneNoteConnections, i) =>
          updateNotePrivateParts({
            currentConnections: oneNoteConnections.connections,
            targetConnections: {
              firstLevel: connectionState.firstLevel,
              secondLevel: connectionState.secondLevel,
            },
            commonFriends: connectionState.commonFriends,
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
                encryptionErrors,
                newConnections,
                removedConnections,
                timeLimitReachedErrors,
              }) => {
                if (encryptionErrors.length > 0) {
                  reportError(
                    'error',
                    new Error(
                      'Error while encrypting new connections for note'
                    ),
                    {encryptionErrors}
                  )
                }
                if (timeLimitReachedErrors.length > 0) {
                  reportError(
                    'warn',
                    new Error(
                      `Note did not update fully due to time limit reached. Skipped: ${timeLimitReachedErrors.length}.`
                    ),
                    {timeLimitReachedErrors}
                  )
                }

                set(noteToConnectionsAtom, (old) => ({
                  noteToConnections: old.noteToConnections.map((one) =>
                    one.adminId === oneNoteConnections.adminId
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

                return {adminId: oneNoteConnections.adminId, success: true}
              }
            ),
            Effect.catchAll((e) =>
              Effect.sync(() => {
                reportError(
                  'warn',
                  new Error('Unable to update note connections'),
                  {e}
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
                    {encryptionErrors}
                  )
                }
                if (timeLimitReachedErrors.length > 0) {
                  reportError(
                    'warn',
                    new Error(
                      `Note repost did not update fully due to time limit reached. Skipped: ${timeLimitReachedErrors.length}.`
                    ),
                    {timeLimitReachedErrors}
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

                return {repostId: oneRepostConnections.repostId, success: true}
              }
            )
          )
        ),
        Effect.all
      )

      return yield* _(
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
    })
)
