import {Effect, HashMap} from 'effect'
import {getDefaultStore} from 'jotai'
import {needsFullContactsReplaceAfterContactEditAtom} from '../contacts/atom/contactsStore'
import {
  discardOldPhoneContactsActionAtom,
  rebuildRestoredOffersAndNotesActionAtom,
  restoredOffersAndNotesNeedRebuildAtom,
} from './rebuildRestoredOffersAndNotes'

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
jest.mock('url-join', () => jest.fn((...parts: string[]) => parts.join('/')))

const mockDeleteOffer = jest.fn()
const mockDeleteNote = jest.fn()
const mockImportContacts = jest.fn()
jest.mock('../../api', () => ({
  apiAtom: jest.requireActual('jotai').atom(() => ({
    offer: {deleteOffer: mockDeleteOffer, deleteNote: mockDeleteNote},
    contact: {importContacts: mockImportContacts},
  })),
}))
jest.mock('../session', () => ({
  sessionDataOrDummyAtom: jest
    .requireActual('jotai')
    .atom(() => ({privateKey: 'v1', keyPairV2: 'v2'})),
}))
jest.mock('../contacts/atom/contactsStore', () => ({
  needsFullContactsReplaceAfterContactEditAtom: jest
    .requireActual('jotai')
    .atom(false),
}))
jest.mock(
  '../contacts/atom/ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom',
  () => ({
    ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom: jest
      .requireActual('jotai')
      .atom(null, () =>
        jest
          .requireActual('effect')
          .Effect.succeed(jest.requireActual('effect').HashMap.empty())
      ),
  })
)
const mockRefreshOffers = jest.fn()
jest.mock('../marketplace/atoms/refreshOffersActionAtom', () => ({
  refreshOffersActionAtom: jest
    .requireActual('jotai')
    .atom(null, () =>
      jest.requireActual('effect').Effect.sync(mockRefreshOffers)
    ),
}))
jest.mock('../notes/atoms/refreshNotesActionAtom', () => ({
  refreshNotesActionAtom: jest
    .requireActual('jotai')
    .atom(null, () => jest.requireActual('effect').Effect.void),
}))
const mockMyOffers = jest.fn((): unknown[] => [])
jest.mock('../marketplace/atoms/myOffers', () => ({
  myOffersAtom: jest.requireActual('jotai').atom(() => mockMyOffers()),
}))
// Stand-ins for persisted state the rebuild reads and updates.
// The rebuild only ever writes them with updater functions.
let mockMissingOffers: unknown = {}
let mockNotes: unknown = []
jest.mock('../marketplace/atoms/offersMissingOnServer', () => ({
  offersMissingOnServerStorageAtom: jest.requireActual('jotai').atom(
    () => mockMissingOffers,
    (_: unknown, __: unknown, update: (old: unknown) => unknown) => {
      mockMissingOffers = update(mockMissingOffers)
    }
  ),
}))
jest.mock('../notes/atoms/notesState', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    notesAtom: atom(
      () => mockNotes,
      (_: unknown, __: unknown, update: (old: unknown) => unknown) => {
        mockNotes = update(mockNotes)
      }
    ),
    myNotesAtom: atom(() => mockNotes),
  }
})
jest.mock('../notes/atoms/createNoteActionAtom', () => ({
  noteConnectionsOf: (result: {adminId: string}) => ({
    adminId: result.adminId,
  }),
}))
const mockUpsertNoteConnections = jest.fn()
jest.mock('../connections/atom/noteToConnectionsAtom', () => ({
  upsertNoteToConnectionsActionAtom: jest
    .requireActual('jotai')
    .atom(null, (_: unknown, __: unknown, record: unknown) => {
      mockUpsertNoteConnections(record)
    }),
}))
const mockCreateNote = jest.fn()
jest.mock(
  '@vexl-next/resources-utils/src/notes/createNewNoteForMyContacts',
  () => ({
    __esModule: true,
    default: (params: unknown) => mockCreateNote(params),
  })
)

const store = getDefaultStore()

const myOffer = (n: number): unknown => ({
  ownershipInfo: {adminId: `admin-${n}`},
  offerInfo: {offerId: `offer-${n}`},
})
const myNote = (n: number, expiresAt: number): unknown => ({
  ownershipInfo: {adminId: `note-admin-${n}`},
  flags: {reported: false},
  noteInfo: {noteId: `note-${n}`, publicPart: {text: `note ${n}`}, expiresAt},
})

describe('rebuild of restored offers and notes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDeleteOffer.mockReturnValue(Effect.void)
    mockDeleteNote.mockReturnValue(Effect.void)
    mockImportContacts.mockReturnValue(Effect.succeed({imported: true}))
    mockCreateNote.mockImplementation(
      ({adminId, noteId}: {adminId: string; noteId: string}) =>
        Effect.succeed({adminId, noteInfo: {noteId, recreated: true}})
    )
    mockMyOffers.mockReturnValue([myOffer(1), myOffer(2)])
    store.set(needsFullContactsReplaceAfterContactEditAtom, false)
    store.set(restoredOffersAndNotesNeedRebuildAtom, {needsRebuild: true})
    mockMissingOffers = {offerIds: ['already-missing']}
    mockNotes = []
  })

  it('waits until the old phone contacts are replaced', async () => {
    store.set(needsFullContactsReplaceAfterContactEditAtom, true)

    const result = await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom)
    )

    expect(result).toBe(false)
    expect(mockRefreshOffers).not.toHaveBeenCalled()
    expect(mockDeleteOffer).not.toHaveBeenCalled()
    expect(store.get(restoredOffersAndNotesNeedRebuildAtom).needsRebuild).toBe(
      true
    )
  })

  it('does nothing without a restore', async () => {
    store.set(restoredOffersAndNotesNeedRebuildAtom, {needsRebuild: false})

    const result = await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom)
    )

    expect(result).toBe(false)
    expect(mockDeleteOffer).not.toHaveBeenCalled()
  })

  it('deletes the offers for a reupload, recreates live notes under the same ids and finishes', async () => {
    const now = Date.now()
    mockNotes = [myNote(1, now + 60_000), myNote(2, now - 60_000)]

    const result = await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom)
    )

    expect(result).toBe(true)
    expect(mockRefreshOffers).toHaveBeenCalled()
    expect(mockDeleteOffer).toHaveBeenCalledWith({
      adminIds: ['admin-1', 'admin-2'],
    })
    expect(mockMissingOffers).toEqual({
      offerIds: ['already-missing', 'offer-1', 'offer-2'],
    })

    expect(mockDeleteNote).toHaveBeenCalledTimes(1)
    expect(mockDeleteNote).toHaveBeenCalledWith({adminIds: ['note-admin-1']})
    expect(mockCreateNote).toHaveBeenCalledTimes(1)
    expect(mockCreateNote).toHaveBeenCalledWith(
      expect.objectContaining({
        noteId: 'note-1',
        adminId: 'note-admin-1',
        publicPart: {text: 'note 1'},
        expiresAt: now + 60_000,
        serverToClientHashesToHashedPhoneNumbersMap: HashMap.empty(),
      })
    )
    expect(
      Math.min(...mockCreateNote.mock.invocationCallOrder)
    ).toBeGreaterThan(Math.max(...mockDeleteNote.mock.invocationCallOrder))
    expect(mockNotes).toEqual([
      {
        ownershipInfo: {adminId: 'note-admin-1'},
        flags: {reported: false},
        noteInfo: {noteId: 'note-1', recreated: true},
      },
      myNote(2, now - 60_000),
    ])
    expect(mockUpsertNoteConnections).toHaveBeenCalledWith({
      adminId: 'note-admin-1',
    })
    expect(store.get(restoredOffersAndNotesNeedRebuildAtom).needsRebuild).toBe(
      false
    )
  })

  it('stays pending when deleting the offers fails', async () => {
    mockDeleteOffer.mockReturnValue(Effect.fail(new Error('offline')))

    await expect(
      Effect.runPromise(store.set(rebuildRestoredOffersAndNotesActionAtom))
    ).rejects.toThrow()

    expect(mockMissingOffers).toEqual({offerIds: ['already-missing']})
    expect(store.get(restoredOffersAndNotesNeedRebuildAtom).needsRebuild).toBe(
      true
    )
  })
})

describe('discarding the old phone contacts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockImportContacts.mockReturnValue(Effect.succeed({imported: true}))
  })

  it('empties the contacts on the server once after a restore', async () => {
    store.set(needsFullContactsReplaceAfterContactEditAtom, true)

    await Effect.runPromise(store.set(discardOldPhoneContactsActionAtom))
    await Effect.runPromise(store.set(discardOldPhoneContactsActionAtom))

    expect(mockImportContacts).toHaveBeenCalledTimes(1)
    expect(mockImportContacts).toHaveBeenCalledWith({
      contacts: [],
      replace: true,
    })
    expect(store.get(needsFullContactsReplaceAfterContactEditAtom)).toBe(false)
  })

  it('leaves the server contacts alone otherwise', async () => {
    store.set(needsFullContactsReplaceAfterContactEditAtom, false)

    await Effect.runPromise(store.set(discardOldPhoneContactsActionAtom))

    expect(mockImportContacts).not.toHaveBeenCalled()
  })
})
