import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ChatOrigin,
  type Inbox,
} from '@vexl-next/domain/src/general/messaging'
import {Array, HashMap, Option} from 'effect'
import {atom} from 'jotai'
import messagingStateAtom from '../chat/atoms/messagingStateAtom'
import {type InboxInState} from '../chat/domain'
import {myOffersAtom} from '../marketplace/atoms/myOffers'
import {myNotesAtom} from '../notes/atoms/notesState'

interface OwnResource {
  readonly link: Pick<Inbox, 'offerId' | 'noteId'>
  readonly origin: ChatOrigin
}

const isUnlinkedRestoredInbox = (one: InboxInState): boolean =>
  !!one.restoredFromBackup && !one.inbox.offerId && !one.inbox.noteId

// A backup holds only keys. Once own offers and notes come back from the
// server, the inbox whose key is the offer's (or note's) public key is theirs.
export const linkRestoredInboxesToMyOffersAndNotesActionAtom = atom(
  null,
  (get, set): void => {
    const messagingState = get(messagingStateAtom)
    if (!Array.some(messagingState, isUnlinkedRestoredInbox)) return

    const ownResourcesByPublicKey = HashMap.fromIterable([
      ...Array.map(
        get(myOffersAtom),
        (offer): [PublicKeyPemBase64, OwnResource] => [
          offer.offerInfo.publicPart.offerPublicKey,
          {
            link: {offerId: offer.offerInfo.offerId},
            origin: {type: 'myOffer', offerId: offer.offerInfo.offerId, offer},
          },
        ]
      ),
      ...Array.map(
        get(myNotesAtom),
        (note): [PublicKeyPemBase64, OwnResource] => [
          note.noteInfo.publicPart.notePublicKey,
          {
            link: {noteId: note.noteInfo.noteId},
            origin: {type: 'myNote', noteId: note.noteInfo.noteId, note},
          },
        ]
      ),
    ])

    // Chats recovered before the offer or note was back got no origin.
    const linkInbox = (one: InboxInState): Option.Option<InboxInState> => {
      if (!isUnlinkedRestoredInbox(one)) return Option.none()

      return Option.map(
        HashMap.get(
          ownResourcesByPublicKey,
          one.inbox.privateKey.publicKeyPemBase64
        ),
        ({link, origin}) => ({
          ...one,
          inbox: {...one.inbox, ...link},
          chats: Array.map(one.chats, (chat) => ({
            ...chat,
            chat: {
              ...chat.chat,
              inbox: {...chat.chat.inbox, ...link},
              origin:
                chat.chat.origin.type === 'unknown' ? origin : chat.chat.origin,
            },
          })),
        })
      )
    }

    const linked = Array.map(messagingState, (one) =>
      Option.getOrElse(linkInbox(one), () => one)
    )
    if (Array.every(linked, (one, i) => one === messagingState[i])) return

    set(messagingStateAtom, linked)
  }
)
