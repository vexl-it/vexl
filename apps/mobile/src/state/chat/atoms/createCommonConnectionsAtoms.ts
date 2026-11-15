import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe} from 'effect'
import {atom, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {importedContactsHashesAtom} from '../../contacts/atom/contactsStore'
import {offerForChatOriginAtom} from '../../marketplace/atoms/offersState'
import {
  deriveVisibleCommonFriendsForChat,
  deriveVisibleCommonFriendsForOffer,
} from '../../marketplace/utils/visibleCommonFriends'
import {noteForChatOriginAtom} from '../../notes/atoms/notesState'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export function createCommonConnectionsAtoms(
  chatWithMessagesAtom: Atom<ChatWithMessages>
): {
  offerForChatAtom: Atom<OneOfferInState | null | undefined>
  noteForChatAtom: Atom<OneNoteInState | undefined>
  requestMessageAtom: Atom<Option.Option<ChatMessageWithState>>
  commonConnectionsHashesAtom: Atom<readonly HashedPhoneNumber[]>
  verifiedConnectionsHashesAtom: Atom<readonly HashedPhoneNumber[]>
} {
  const originAtom = selectAtom(chatWithMessagesAtom, (o) => o?.chat.origin)
  const messagesAtom = selectAtom(
    chatWithMessagesAtom,
    (o) => o?.messages ?? []
  )

  const offerForChatAtom = atom((get) => {
    const origin = get(originAtom)
    return origin ? get(offerForChatOriginAtom(origin)) : null
  })

  const noteForChatAtom = atom((get) => {
    const origin = get(originAtom)
    return origin ? get(noteForChatOriginAtom(origin)) : undefined
  })

  const requestMessageAtom = atom((get) =>
    pipe(
      get(messagesAtom),
      Array.findFirst(
        (message) =>
          message.state === 'received' &&
          message.message.messageType === 'REQUEST_MESSAGING'
      )
    )
  )

  const commonConnectionsHashesAtom = atom((get) => {
    const offer = get(offerForChatAtom)
    const importedContactsHashes = get(importedContactsHashesAtom)
    const requestMessage = get(requestMessageAtom)
    const commonFriendsForMyOffer = pipe(
      requestMessage,
      Option.flatMap((message) =>
        Option.fromNullable(message.message.commonFriends)
      ),
      Option.getOrElse(() => [])
    )
    const verifiedCommonFriendsForMyOffer = pipe(
      requestMessage,
      Option.flatMap((message) =>
        Option.fromNullable(message.message.verifiedCommonFriends)
      ),
      Option.getOrElse(() => [])
    )

    if (!offer) {
      const note = get(noteForChatAtom)
      if (!note) return []

      // My note - the responder sent their common friends in the request
      // message. Their note - common friends are in the note's private part.
      return deriveVisibleCommonFriendsForChat({
        commonFriends: note.ownershipInfo
          ? commonFriendsForMyOffer
          : note.noteInfo.privatePart.commonFriends,
        verifiedCommonFriends: note.ownershipInfo
          ? verifiedCommonFriendsForMyOffer
          : note.noteInfo.privatePart.verifiedCommonFriends,
        importedContactsHashes,
      }).commonFriends
    }

    if (offer.ownershipInfo) {
      return deriveVisibleCommonFriendsForChat({
        commonFriends: commonFriendsForMyOffer,
        verifiedCommonFriends: verifiedCommonFriendsForMyOffer,
        importedContactsHashes,
      }).commonFriends
    }

    return deriveVisibleCommonFriendsForOffer({
      offerInfo: offer.offerInfo,
      importedContactsHashes,
    }).commonFriends
  })

  const verifiedConnectionsHashesAtom = atom((get) => {
    const offer = get(offerForChatAtom)
    const commonConnectionsHashes = get(commonConnectionsHashesAtom)
    const importedContactsHashes = get(importedContactsHashesAtom)
    const verifiedCommonFriendsForMyOffer = pipe(
      get(requestMessageAtom),
      Option.flatMap((message) =>
        Option.fromNullable(message.message.verifiedCommonFriends)
      ),
      Option.getOrElse(() => [])
    )

    if (!offer) {
      const note = get(noteForChatAtom)
      if (!note) return []

      return deriveVisibleCommonFriendsForChat({
        commonFriends: commonConnectionsHashes,
        verifiedCommonFriends: note.ownershipInfo
          ? verifiedCommonFriendsForMyOffer
          : note.noteInfo.privatePart.verifiedCommonFriends,
        importedContactsHashes,
      }).verifiedCommonFriends
    }

    if (offer.ownershipInfo) {
      return deriveVisibleCommonFriendsForChat({
        commonFriends: commonConnectionsHashes,
        verifiedCommonFriends: verifiedCommonFriendsForMyOffer,
        importedContactsHashes,
      }).verifiedCommonFriends
    }

    return deriveVisibleCommonFriendsForOffer({
      offerInfo: offer.offerInfo,
      importedContactsHashes,
    }).verifiedCommonFriends
  })

  return {
    offerForChatAtom,
    noteForChatAtom,
    requestMessageAtom,
    commonConnectionsHashesAtom,
    verifiedConnectionsHashesAtom,
  }
}
