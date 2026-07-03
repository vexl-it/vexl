import {type NoteId} from '@vexl-next/domain/src/general/notes'
import repostNote, {
  type ApiErrorWhileRepostingNote,
} from '@vexl-next/resources-utils/src/notes/repostNote'
import {type NotePrivatePartEncryptionError} from '@vexl-next/resources-utils/src/notes/utils/encryptNotePrivatePart'
import {type ApiErrorFetchingContactsForOffer} from '@vexl-next/resources-utils/src/offers/utils/fetchContactsForOffer'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import reportError from '../../../utils/reportError'
import {ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom} from '../../contacts/atom/ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom'
import {sessionDataOrDummyAtom} from '../../session'
import {NoteNotFoundError} from '../domainErrors'
import {notesAtom, singleNoteAtom} from './notesState'

export const repostNoteActionAtom = atom<
  null,
  [{noteId: NoteId}],
  Effect.Effect<
    void,
    | ApiErrorFetchingContactsForOffer
    | ApiErrorWhileRepostingNote
    | NotePrivatePartEncryptionError
    | NoteNotFoundError
  >
>(null, (get, set, {noteId}) => {
  return Effect.gen(function* (_) {
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)
    const note = get(singleNoteAtom(noteId))

    if (!note) {
      return yield* _(Effect.fail(new NoteNotFoundError({noteId})))
    }

    const serverToClientHashesToHashedPhoneNumbersMap = yield* _(
      set(ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom)
    )

    const {repostInfo, encryptionErrors} = yield* _(
      repostNote({
        offerApi: api.offer,
        contactApi: api.contact,
        noteId,
        symmetricKey: note.noteInfo.privatePart.symmetricKey,
        ownerKeyPair: session.privateKey,
        ownerKeyPairV2: session.keyPairV2,
        serverToClientHashesToHashedPhoneNumbersMap,
      })
    )

    if (encryptionErrors.length > 0) {
      reportError('error', new Error('Error while encrypting note repost'), {
        errors: encryptionErrors,
      })
    }

    set(
      notesAtom,
      Array.map((one) =>
        one.noteInfo.noteId === noteId ? {...one, repostInfo} : one
      )
    )
  })
})

export const undoRepostNoteActionAtom = atom<
  null,
  [{noteId: NoteId}],
  Effect.Effect<
    void,
    | Effect.Effect.Error<ReturnType<OfferApi['undoRepostNote']>>
    | NoteNotFoundError
  >
>(null, (get, set, {noteId}) => {
  return Effect.gen(function* (_) {
    const api = get(apiAtom)
    const note = get(singleNoteAtom(noteId))

    if (!note?.repostInfo) {
      return yield* _(Effect.fail(new NoteNotFoundError({noteId})))
    }

    yield* _(api.offer.undoRepostNote({repostIds: [note.repostInfo.repostId]}))

    set(
      notesAtom,
      Array.map((one) => {
        if (one.noteInfo.noteId !== noteId) return one
        const {repostInfo: _removed, ...rest} = one
        return rest
      })
    )
  }).pipe(
    Effect.mapError((e) => {
      reportError('error', new Error('Error while undoing note repost'), {e})
      return e
    })
  )
})
