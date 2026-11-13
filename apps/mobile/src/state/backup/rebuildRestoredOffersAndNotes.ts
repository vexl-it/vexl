import {
  MyNoteInState,
  type NoteAdminId,
} from '@vexl-next/domain/src/general/notes'
import {
  OfferId,
  type MyOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import createNewNoteForMyContacts from '@vexl-next/resources-utils/src/notes/createNewNoteForMyContacts'
import {Array, Effect, Schema} from 'effect'
import {atom, type Atom} from 'jotai'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import reportError from '../../utils/reportError'
import {
  noteConnectionUpdatesSemaphoreAtom,
  upsertNoteToConnectionsActionAtom,
} from '../connections/atom/noteToConnectionsAtom'
import {
  needsFullContactsReplaceAfterContactEditAtom,
  storedContactsAtom,
} from '../contacts/atom/contactsStore'
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
  {needsRebuild: false, notesToRecreate: [], offerIdsToReupload: []},
  Schema.Struct({
    needsRebuild: Schema.Boolean,
    // Kept until recreated: once deleted on the server, the note sync drops
    // the note from the phone.
    notesToRecreate: Schema.optionalWith(Schema.Array(MyNoteInState), {
      default: () => [],
    }),
    // Deleted on the server, kept until reuploaded.
    offerIdsToReupload: Schema.optionalWith(Schema.Array(OfferId), {
      default: () => [],
    }),
  })
)

export const forgetReuploadedRestoredOfferActionAtom = atom(
  null,
  (get, set, offerId: OfferId) => {
    set(restoredOffersAndNotesNeedRebuildAtom, (old) => ({
      ...old,
      offerIdsToReupload: Array.filter(
        old.offerIdsToReupload,
        (one) => one !== offerId
      ),
    }))
  }
)

export class RestoredOffersAndNotesNotFetchedError extends Schema.TaggedError<RestoredOffersAndNotesNotFetchedError>(
  'RestoredOffersAndNotesNotFetchedError'
)('RestoredOffersAndNotesNotFetchedError', {}) {}

// After a restore the server still has the old phone's contacts. Skipping the
// import must not keep them, nor contacts a failed import got through.
export const discardOldPhoneContactsActionAtom = atom(null, (get, set) => {
  if (!get(needsFullContactsReplaceAfterContactEditAtom)) return Effect.void

  return get(apiAtom)
    .contact.importContacts({contacts: [], replace: true})
    .pipe(
      Effect.tap(() => {
        set(
          storedContactsAtom,
          Array.map((one) => ({...one, flags: {...one.flags, imported: false}}))
        )
        set(needsFullContactsReplaceAfterContactEditAtom, false)
      }),
      Effect.asVoid
    )
})

// A note the user deleted meanwhile must not come back.
export const forgetNotesToRecreateActionAtom = atom(
  null,
  (get, set, adminIds: readonly NoteAdminId[]) => {
    set(restoredOffersAndNotesNeedRebuildAtom, (old) => ({
      ...old,
      notesToRecreate: Array.filter(
        old.notesToRecreate,
        (one) => !Array.contains(adminIds, one.ownershipInfo.adminId)
      ),
    }))
  }
)

const isNoteToRecreateAtom = (note: MyNoteInState): Atom<boolean> =>
  atom((get) =>
    Array.some(
      get(restoredOffersAndNotesNeedRebuildAtom).notesToRecreate,
      (one) => one.noteInfo.noteId === note.noteInfo.noteId
    )
  )

const recreateNoteActionAtom = atom(null, (get, set, note: MyNoteInState) =>
  Effect.gen(function* (_) {
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)
    const isNoteToRecreate = isNoteToRecreateAtom(note)
    if (!get(isNoteToRecreate)) return

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

    if (!get(isNoteToRecreate)) {
      yield* _(api.offer.deleteNote({adminIds: [note.ownershipInfo.adminId]}))
      return
    }

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
      offerIdsToReupload: Array.map(offers, (one) => one.offerInfo.offerId),
    })
  })
)

const rebuildInProgressAtom = atom(false)

// Returns the restored offers waiting for the reupload, and recreates the
// notes right away.
export const rebuildRestoredOffersAndNotesActionAtom = atom(
  null,
  (get, set) => {
    const {needsRebuild, notesToRecreate, offerIdsToReupload} = get(
      restoredOffersAndNotesNeedRebuildAtom
    )
    // Before the contacts are replaced, recreating would share everything with
    // the old network again.
    if (
      (!needsRebuild &&
        !Array.isNonEmptyReadonlyArray(notesToRecreate) &&
        !Array.isNonEmptyReadonlyArray(offerIdsToReupload)) ||
      get(needsFullContactsReplaceAfterContactEditAtom) ||
      get(rebuildInProgressAtom)
    )
      return Effect.succeed<readonly MyOfferInState[]>([])
    set(rebuildInProgressAtom, true)

    return Effect.gen(function* (_) {
      if (needsRebuild)
        yield* _(set(deleteRestoredOffersAndPickNotesActionAtom))

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

      // Offers the user deleted meanwhile are no longer waiting.
      const offers: readonly MyOfferInState[] = Array.filter(
        get(myOffersAtom),
        (one) =>
          Array.contains(
            get(restoredOffersAndNotesNeedRebuildAtom).offerIdsToReupload,
            one.offerInfo.offerId
          )
      )
      set(restoredOffersAndNotesNeedRebuildAtom, (old) => ({
        ...old,
        offerIdsToReupload: Array.map(offers, (one) => one.offerInfo.offerId),
      }))
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
