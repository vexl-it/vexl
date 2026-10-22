import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {NoteId} from '@vexl-next/domain/src/general/notes'
import {OfferId} from '@vexl-next/domain/src/general/offers'
import {Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import messagingStateAtom from '../chat/atoms/messagingStateAtom'
import {
  dummyChatWithMessages,
  type ChatWithMessages,
  type InboxInState,
} from '../chat/domain'
import {vexlTokenToKeyHolderAtom} from '../notifications/vexlTokenToKeyHolderAtom'
import {linkRestoredInboxesToMyOffersAndNotesActionAtom} from './linkRestoredInboxesActionAtom'

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
jest.mock('url-join', () => jest.fn((...parts: string[]) => parts.join('/')))

const offerKey = generatePrivateKey()
const noteKey = generatePrivateKey()
const offerId = Schema.decodeSync(OfferId)('offer-id')
const noteId = Schema.decodeSync(NoteId)('7c9e6679-7425-40de-944b-e07fc1f90ae7')
// Older offers carry the token only in fcmCypher.
const mockMyOffer = {
  offerInfo: {
    offerId,
    publicPart: {
      offerPublicKey: offerKey.publicKeyPemBase64,
      fcmCypher: 'vexl_nt_offer',
    },
  },
}
const mockMyNote = {
  noteInfo: {
    noteId,
    publicPart: {
      notePublicKey: noteKey.publicKeyPemBase64,
      vexlNotificationToken: 'vexl_nt_note',
    },
  },
}
jest.mock('../marketplace/atoms/myOffers', () => ({
  myOffersAtom: jest.requireActual('jotai').atom(() => [mockMyOffer]),
}))
jest.mock('../notes/atoms/notesState', () => ({
  myNotesAtom: jest.requireActual('jotai').atom(() => [mockMyNote]),
}))

const store = getDefaultStore()

const recoveredChat = (inboxKey: typeof offerKey): ChatWithMessages => ({
  ...dummyChatWithMessages,
  chat: {
    ...dummyChatWithMessages.chat,
    inbox: {privateKey: inboxKey},
    origin: {type: 'unknown'},
  },
  restoredFromBackup: true,
})

const restoredInbox = (inboxKey: typeof offerKey): InboxInState => ({
  inbox: {privateKey: inboxKey},
  chats: [recoveredChat(inboxKey)],
  restoredFromBackup: true,
})

describe('linkRestoredInboxesToMyOffersAndNotesActionAtom', () => {
  beforeEach(() => {
    store.set(vexlTokenToKeyHolderAtom, {data: {}})
  })

  it('links restored inboxes to own offers and notes and fixes the origin of their recovered chats', () => {
    const otherInbox = restoredInbox(generatePrivateKey())
    store.set(messagingStateAtom, [
      restoredInbox(offerKey),
      restoredInbox(noteKey),
      otherInbox,
    ])

    store.set(linkRestoredInboxesToMyOffersAndNotesActionAtom)

    const [offerInbox, noteInbox, untouchedInbox] =
      store.get(messagingStateAtom)
    expect(offerInbox?.inbox.offerId).toBe(offerId)
    expect(offerInbox?.chats[0]?.chat.origin).toEqual({
      type: 'myOffer',
      offerId,
      offer: mockMyOffer,
    })
    expect(noteInbox?.inbox.noteId).toBe(noteId)
    expect(noteInbox?.chats[0]?.chat.origin).toEqual({
      type: 'myNote',
      noteId,
      note: mockMyNote,
    })
    expect(untouchedInbox).toBe(otherInbox)
  })

  it('maps the tokens of own offers and notes to their restored inboxes', () => {
    store.set(messagingStateAtom, [
      restoredInbox(offerKey),
      restoredInbox(noteKey),
    ])

    store.set(linkRestoredInboxesToMyOffersAndNotesActionAtom)

    expect(store.get(vexlTokenToKeyHolderAtom).data).toEqual({
      vexl_nt_offer: offerKey,
      vexl_nt_note: noteKey,
    })
  })

  it('leaves inboxes and tokens alone once linked', () => {
    const linkedInbox: InboxInState = {
      ...restoredInbox(offerKey),
      inbox: {privateKey: offerKey, offerId},
    }
    const messagingState = [linkedInbox]
    store.set(messagingStateAtom, messagingState)

    store.set(linkRestoredInboxesToMyOffersAndNotesActionAtom)

    expect(store.get(messagingStateAtom)).toBe(messagingState)
    expect(store.get(vexlTokenToKeyHolderAtom).data).toEqual({})
  })
})
