import {Array, HashMap, Option, pipe} from 'effect'
import {atom} from 'jotai'
import messagingStateAtom from '../chat/atoms/messagingStateAtom'
import {type InboxInState} from '../chat/domain'
import {myOffersAtom} from '../marketplace/atoms/myOffers'
import {myNotesAtom} from '../notes/atoms/notesState'

const isUnlinkedRestoredInbox = (one: InboxInState): boolean =>
  !!one.restoredFromBackup && !one.inbox.offerId && !one.inbox.noteId

// A backup holds only keys. Once own offers and notes come back from the
// server, the inbox whose key is the offer's (or note's) public key is theirs.
export const linkRestoredInboxesToMyOffersAndNotesActionAtom = atom(
  null,
  (get, set): void => {
    const messagingState = get(messagingStateAtom)
    if (!Array.some(messagingState, isUnlinkedRestoredInbox)) return

    const offerIdsByPublicKey = HashMap.fromIterable(
      Array.map(get(myOffersAtom), (offer) => [
        offer.offerInfo.publicPart.offerPublicKey,
        offer.offerInfo.offerId,
      ])
    )
    const noteIdsByPublicKey = HashMap.fromIterable(
      Array.map(get(myNotesAtom), (note) => [
        note.noteInfo.publicPart.notePublicKey,
        note.noteInfo.noteId,
      ])
    )

    const linkInbox = (one: InboxInState): Option.Option<InboxInState> => {
      if (!isUnlinkedRestoredInbox(one)) return Option.none()
      const publicKey = one.inbox.privateKey.publicKeyPemBase64

      return pipe(
        HashMap.get(offerIdsByPublicKey, publicKey),
        Option.map((offerId) => ({...one, inbox: {...one.inbox, offerId}})),
        Option.orElse(() =>
          pipe(
            HashMap.get(noteIdsByPublicKey, publicKey),
            Option.map((noteId) => ({...one, inbox: {...one.inbox, noteId}}))
          )
        )
      )
    }

    const linked = Array.map(messagingState, (one) =>
      Option.getOrElse(linkInbox(one), () => one)
    )
    if (Array.every(linked, (one, i) => one === messagingState[i])) return

    set(messagingStateAtom, linked)
  }
)
