import {type NoteAdminId} from '@vexl-next/domain/src/general/notes'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import reportError from '../../../utils/reportError'
import {notesAtom} from './notesState'

export const deleteNoteActionAtom = atom<
  null,
  [{adminIds: readonly NoteAdminId[]}],
  Effect.Effect<void, Effect.Effect.Error<ReturnType<OfferApi['deleteNote']>>>
>(null, (get, set, {adminIds}) => {
  const api = get(apiAtom)

  return Effect.gen(function* (_) {
    yield* _(api.offer.deleteNote({adminIds}))

    // The note keypair inbox is cleaned up lazily by
    // checkAndDeleteEmptyInboxesWithoutOfferInAppLoadingTask once the note is
    // gone and there are no open chats (chats from the note survive).
    set(
      notesAtom,
      Array.filter(
        (note) =>
          !note.ownershipInfo?.adminId ||
          !Array.contains(adminIds, note.ownershipInfo.adminId)
      )
    )
  }).pipe(
    Effect.mapError((e) => {
      reportError('error', new Error('Error while deleting note'), {e})
      return e
    })
  )
})
