import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ChatOrigin,
  type Inbox,
} from '@vexl-next/domain/src/general/messaging'
import {
  isVexlNotificationToken,
  type VexlNotificationToken,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type OfferPublicPart} from '@vexl-next/domain/src/general/offers'
import {Array, HashMap, Option} from 'effect'
import {atom} from 'jotai'
import messagingStateAtom from '../chat/atoms/messagingStateAtom'
import {type InboxInState} from '../chat/domain'
import {myOffersAtom} from '../marketplace/atoms/myOffers'
import {myNotesAtom} from '../notes/atoms/notesState'
import {registerVexlTokenActionAtom} from '../notifications/vexlTokenToKeyHolderAtom'

interface OwnResource {
  readonly link: Pick<Inbox, 'offerId' | 'noteId'>
  readonly origin: ChatOrigin
  readonly vexlNotificationToken: VexlNotificationToken | undefined
}

const offerVexlToken = ({
  vexlNotificationToken,
  fcmCypher,
}: OfferPublicPart): VexlNotificationToken | undefined =>
  vexlNotificationToken ??
  (isVexlNotificationToken(fcmCypher) ? fcmCypher : undefined)

const isUnlinkedRestoredInbox = (one: InboxInState): boolean =>
  !!one.restoredFromBackup && !one.inbox.offerId && !one.inbox.noteId

// A backup holds only keys. Once own offers and notes come back from the
// server, the inbox whose key is the offer's (or note's) public key is theirs,
// and so are the notifications for the token the offer (or note) hands out.
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
            vexlNotificationToken: offerVexlToken(offer.offerInfo.publicPart),
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
            vexlNotificationToken:
              note.noteInfo.publicPart.vexlNotificationToken,
          },
        ]
      ),
    ])

    const ownResourceOf = (one: InboxInState): Option.Option<OwnResource> =>
      isUnlinkedRestoredInbox(one)
        ? HashMap.get(
            ownResourcesByPublicKey,
            one.inbox.privateKey.publicKeyPemBase64
          )
        : Option.none()

    // Chats recovered before the offer or note was back got no origin.
    const linkInbox = (
      one: InboxInState,
      {link, origin}: OwnResource
    ): InboxInState => ({
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

    const newlyLinked = Array.filterMap(messagingState, (one) =>
      Option.map(ownResourceOf(one), (resource) => ({one, resource}))
    )
    if (!Array.isNonEmptyArray(newlyLinked)) return

    set(
      messagingStateAtom,
      Array.map(messagingState, (one) =>
        Option.match(ownResourceOf(one), {
          onNone: () => one,
          onSome: (resource) => linkInbox(one, resource),
        })
      )
    )
    Array.forEach(newlyLinked, ({one, resource: {vexlNotificationToken}}) => {
      if (vexlNotificationToken)
        set(registerVexlTokenActionAtom, {
          vexlToken: vexlNotificationToken,
          keyHolder: one.inbox.privateKey,
        })
    })
  }
)
