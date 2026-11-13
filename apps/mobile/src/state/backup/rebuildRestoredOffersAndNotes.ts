import {MyNoteInState} from '@vexl-next/domain/src/general/notes'
import {type MyOfferInState} from '@vexl-next/domain/src/general/offers'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import createNewNoteForMyContacts from '@vexl-next/resources-utils/src/notes/createNewNoteForMyContacts'
import {Array, Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import reportError from '../../utils/reportError'
import {
  noteConnectionUpdatesSemaphoreAtom,
  upsertNoteToConnectionsActionAtom,
} from '../connections/atom/noteToConnectionsAtom'
import {needsFullContactsReplaceAfterContactEditAtom} from '../contacts/atom/contactsStore'
import {ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom} from '../contacts/atom/ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom'
import {myOffersAtom} from '../marketplace/atoms/myOffers'
import {refreshOffersActionAtom} from '../marketplace/atoms/refreshOffersActionAtom'
import {noteConnectionsOf} from '../notes/atoms/createNoteActionAtom'
import {myNotesAtom, notesAtom, notesStateAtom} from '../notes/atoms/notesState'
import {refreshNotesActionAtom} from '../notes/atoms/refreshNotesActionAtom'
import {sessionDataOrDummyAtom} from '../session'

// The backup doesn't say who the restored offers and notes were shared with,
// so they keep reaching the old phone's network until they are recreated.
export const restoredOffersAndNotesNeedRebuildAtom = atomWithParsedMmkvStorage(
  'restoredOffersAndNotesNeedRebuild',
  {needsRebuild: false, notesToRecreate: []},
  Schema.Struct({
    needsRebuild: Schema.Boolean,
    // Kept until recreated: once deleted on the server, the note sync drops
    // the note from the phone.
    notesToRecreate: Schema.optionalWith(Schema.Array(MyNoteInState), {
      default: () => [],
    }),
  })
)

export class RestoredOffersAndNotesNotFetchedError extends Schema.TaggedError<RestoredOffersAndNotesNotFetchedError>(
  'RestoredOffersAndNotesNotFetchedError'
)('RestoredOffersAndNotesNotFetchedError', {}) {}

// After a restore the server still has the old phone's contacts. Skipping the
// import must not keep them.
export const discardOldPhoneContactsActionAtom = atom(null, (get, set) => {
  if (!get(needsFullContactsReplaceAfterContactEditAtom)) return Effect.void

  return get(apiAtom)
    .contact.importContacts({contacts: [], replace: true})
    .pipe(
      Effect.tap(() => {
        set(needsFullContactsReplaceAfterContactEditAtom, false)
      }),
      Effect.asVoid
    )
})

const recreateNoteActionAtom = atom(null, (get, set, note: MyNoteInState) =>
  Effect.gen(function* (_) {
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)

    yield* _(api.offer.deleteNote({adminIds: [note.ownershipInfo.adminId]}))
    const result = yield* _(
      createNewNoteForMyContacts({
        offerApi: api.offer,
        contactApi: api.contact,
        noteId: note.noteInfo.noteId,
        adminId: note.ownershipInfo.adminId,
        publicPart: note.noteInfo.publicPart,
        expiresAt: note.noteInfo.expiresAt,
        ownerKeyPair: session.privateKey,
        ownerKeyPairV2: session.keyPairV2,
        serverToClientHashesToHashedPhoneNumbersMap: yield* _(
          set(ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom)
        ),
      })
    )

    const recreated = {...note, noteInfo: result.noteInfo}
    set(notesAtom, (notes) => [
      ...Array.filter(
        notes,
        (one) => one.noteInfo.noteId !== note.noteInfo.noteId
      ),
      recreated,
    ])
    set(upsertNoteToConnectionsActionAtom, noteConnectionsOf(result))
    set(restoredOffersAndNotesNeedRebuildAtom, (old) => ({
      ...old,
      notesToRecreate: Array.filter(
        old.notesToRecreate,
        (one) => one.noteInfo.noteId !== note.noteInfo.noteId
      ),
    }))
  }).pipe(
    // A note sync in between would get a 404 and drop the note from the phone.
    get(noteConnectionUpdatesSemaphoreAtom).withPermits(1)
  )
)

// Deletes the restored offers on the server and keeps the live notes to
// recreate. Returns the offers for the reupload.
const deleteRestoredOffersAndPickNotesActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    // The restore only started fetching them, and both refreshes swallow
    // their errors. Offers or notes missed now would never be rebuilt.
    const notesUpdatedBefore = get(notesStateAtom).lastUpdatedAt
    const offersFetched = yield* _(set(refreshOffersActionAtom))
    yield* _(set(refreshNotesActionAtom))
    if (
      !offersFetched ||
      get(notesStateAtom).lastUpdatedAt === notesUpdatedBefore
    )
      return yield* _(new RestoredOffersAndNotesNotFetchedError())

    const offers: readonly MyOfferInState[] = get(myOffersAtom)
    if (Array.isNonEmptyReadonlyArray(offers)) {
      yield* _(
        get(apiAtom).offer.deleteOffer({
          adminIds: Array.map(offers, (one) => one.ownershipInfo.adminId),
        })
      )
    }

    set(restoredOffersAndNotesNeedRebuildAtom, {
      needsRebuild: false,
      notesToRecreate: get(myNotesAtom),
    })
    return offers
  })
)

const rebuildInProgressAtom = atom(false)

// Returns the restored offers for the reupload, and recreates the notes right
// away.
export const rebuildRestoredOffersAndNotesActionAtom = atom(
  null,
  (get, set) => {
    const {needsRebuild, notesToRecreate} = get(
      restoredOffersAndNotesNeedRebuildAtom
    )
    // Before the contacts are replaced, recreating would share everything with
    // the old network again.
    if (
      (!needsRebuild && !Array.isNonEmptyReadonlyArray(notesToRecreate)) ||
      get(needsFullContactsReplaceAfterContactEditAtom) ||
      get(rebuildInProgressAtom)
    )
      return Effect.succeed<readonly MyOfferInState[]>([])
    set(rebuildInProgressAtom, true)

    return Effect.gen(function* (_) {
      const offers = needsRebuild
        ? yield* _(set(deleteRestoredOffersAndPickNotesActionAtom))
        : []

      const now = unixMillisecondsNow()
      set(restoredOffersAndNotesNeedRebuildAtom, (old) => ({
        ...old,
        notesToRecreate: Array.filter(
          old.notesToRecreate,
          (one) => one.noteInfo.expiresAt > now
        ),
      }))
      // A note that fails stays for the retry and must not hold back the
      // offers' reupload.
      yield* _(
        Effect.forEach(
          get(restoredOffersAndNotesNeedRebuildAtom).notesToRecreate,
          (note) =>
            set(recreateNoteActionAtom, note).pipe(
              Effect.catchAll((e) =>
                Effect.sync(() => {
                  reportError(
                    'error',
                    new Error('Error recreating a restored note'),
                    {e}
                  )
                })
              )
            )
        )
      )
      return offers
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          set(rebuildInProgressAtom, false)
        })
      )
    )
  }
)
