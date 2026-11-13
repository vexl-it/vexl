import {NoteAdminId} from '@vexl-next/domain/src/general/notes'
import {OfferId} from '@vexl-next/domain/src/general/offers'
import {Effect, HashMap, Option, Schema} from 'effect'
import {atom, getDefaultStore} from 'jotai'
import {needsFullContactsReplaceAfterContactEditAtom} from '../contacts/atom/contactsStore'
import {
  discardOldPhoneContactsActionAtom,
  forgetNotesToRecreateActionAtom,
  forgetReuploadedRestoredOfferActionAtom,
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
const mockReportError = jest.fn()
jest.mock('../../utils/reportError', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockReportError(...args),
}))

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
const mockStoredContactsAtom = atom<unknown>([])
jest.mock('../contacts/atom/contactsStore', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    needsFullContactsReplaceAfterContactEditAtom: atom(false),
    storedContactsAtom: atom(
      (get: (a: unknown) => unknown) => get(mockStoredContactsAtom),
      (
        get: (a: unknown) => unknown,
        set: (a: unknown, v: unknown) => void,
        update: (old: unknown) => unknown
      ) => {
        set(mockStoredContactsAtom, update(get(mockStoredContactsAtom)))
      }
    ),
  }
})
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
const mockRefreshOffers = jest.fn(() => true)
jest.mock('../marketplace/atoms/refreshOffersActionAtom', () => ({
  refreshOffersActionAtom: jest
    .requireActual('jotai')
    .atom(null, () =>
      jest.requireActual('effect').Effect.sync(mockRefreshOffers)
    ),
}))
// Fixture state. Atoms, so the code under test sees every change.
const mockNotesUpdatedAtAtom = atom(0)
const mockNotesAtom = atom<unknown>([])
const mockMyOffersAtom = atom<unknown>([])
const mockRefreshNotesSucceeds = jest.fn(() => true)
jest.mock('../notes/atoms/refreshNotesActionAtom', () => ({
  refreshNotesActionAtom: jest
    .requireActual('jotai')
    .atom(null, (_: unknown, set: (a: unknown, u: unknown) => void) =>
      jest.requireActual('effect').Effect.sync(() => {
        if (mockRefreshNotesSucceeds())
          set(mockNotesUpdatedAtAtom, (n: number) => n + 1)
      })
    ),
}))
jest.mock('../marketplace/atoms/myOffers', () => ({
  myOffersAtom: jest
    .requireActual('jotai')
    .atom((get: (a: unknown) => unknown) => get(mockMyOffersAtom)),
}))
jest.mock('../notes/atoms/notesState', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    notesAtom: atom(
      (get: (a: unknown) => unknown) => get(mockNotesAtom),
      (
        get: (a: unknown) => unknown,
        set: (a: unknown, v: unknown) => void,
        update: (old: unknown) => unknown
      ) => {
        set(mockNotesAtom, update(get(mockNotesAtom)))
      }
    ),
    myNotesAtom: atom((get: (a: unknown) => unknown) => get(mockNotesAtom)),
    notesStateAtom: atom((get: (a: unknown) => unknown) => ({
      lastUpdatedAt: get(mockNotesUpdatedAtAtom),
    })),
  }
})
jest.mock('../notes/atoms/createNoteActionAtom', () => ({
  noteConnectionsOf: (result: {adminId: string}) => ({
    adminId: result.adminId,
  }),
}))
const mockUpsertNoteConnections = jest.fn()
const mockNoteSyncSemaphore = Effect.unsafeMakeSemaphore(1)
jest.mock('../connections/atom/noteToConnectionsAtom', () => ({
  noteConnectionUpdatesSemaphoreAtom: jest
    .requireActual('jotai')
    .atom(() => mockNoteSyncSemaphore),
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
const mockReupload = jest.fn((_: readonly unknown[]) => Effect.void)

const myOffer = (n: number): unknown => ({
  ownershipInfo: {adminId: `admin-${n}`},
  offerInfo: {offerId: `offer-${n}`},
})
const myNote = (n: number, expiresAt: number): unknown => ({
  ownershipInfo: {adminId: `note-admin-${n}`},
  flags: {reported: false},
  noteInfo: {noteId: `note-${n}`, publicPart: {text: `note ${n}`}, expiresAt},
})
const recreatedNote = (n: number): unknown => ({
  ownershipInfo: {adminId: `note-admin-${n}`},
  flags: {reported: false},
  noteInfo: {noteId: `note-${n}`, recreated: true},
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
    store.set(mockMyOffersAtom, [myOffer(1), myOffer(2)])
    store.set(needsFullContactsReplaceAfterContactEditAtom, false)
    store.set(restoredOffersAndNotesNeedRebuildAtom, {
      needsRebuild: true,
      notesToRecreate: [],
      offerIdsToReupload: [],
    })
    mockRefreshOffers.mockReturnValue(true)
    mockRefreshNotesSucceeds.mockReturnValue(true)
    store.set(mockNotesAtom, [])
  })

  it('waits until the old phone contacts are replaced', async () => {
    store.set(needsFullContactsReplaceAfterContactEditAtom, true)

    const result = await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
    )

    expect(result).toEqual([])
    expect(mockRefreshOffers).not.toHaveBeenCalled()
    expect(mockDeleteOffer).not.toHaveBeenCalled()
    expect(store.get(restoredOffersAndNotesNeedRebuildAtom).needsRebuild).toBe(
      true
    )
  })

  it('does nothing without a restore', async () => {
    store.set(restoredOffersAndNotesNeedRebuildAtom, {
      needsRebuild: false,
      notesToRecreate: [],
      offerIdsToReupload: [],
    })

    const result = await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
    )

    expect(result).toEqual([])
    expect(mockDeleteOffer).not.toHaveBeenCalled()
  })

  it.each([
    ['offers', () => mockRefreshOffers.mockReturnValue(false)],
    ['notes', () => mockRefreshNotesSucceeds.mockReturnValue(false)],
  ])(
    'stays pending when the %s could not be fetched',
    async (_, failRefresh) => {
      failRefresh()

      await expect(
        Effect.runPromise(
          store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
        )
      ).rejects.toThrow()

      expect(mockDeleteOffer).not.toHaveBeenCalled()
      expect(
        store.get(restoredOffersAndNotesNeedRebuildAtom).needsRebuild
      ).toBe(true)
    }
  )

  it('keeps the note sync out while a note is recreated', async () => {
    store.set(mockNotesAtom, [myNote(1, Date.now() + 60_000)])
    mockCreateNote.mockImplementation(
      ({adminId, noteId}: {adminId: string; noteId: string}) =>
        Effect.gen(function* () {
          const syncCouldRun =
            yield* mockNoteSyncSemaphore.withPermitsIfAvailable(1)(Effect.void)
          expect(Option.isNone(syncCouldRun)).toBe(true)
          return {adminId, noteInfo: {noteId}}
        })
    )

    await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
    )

    expect(mockCreateNote).toHaveBeenCalledTimes(1)
  })

  it('deletes the offers for a reupload, recreates live notes under the same ids and finishes', async () => {
    const now = Date.now()
    store.set(mockNotesAtom, [myNote(1, now + 60_000), myNote(2, now - 60_000)])

    const result = await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
    )

    expect(result).toEqual([myOffer(1), myOffer(2)])
    expect(mockReupload).toHaveBeenCalledWith([myOffer(1), myOffer(2)])
    expect(mockRefreshOffers).toHaveBeenCalled()
    expect(mockDeleteOffer).toHaveBeenCalledWith({
      adminIds: ['admin-1', 'admin-2'],
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
    expect(store.get(mockNotesAtom)).toEqual([
      myNote(2, now - 60_000),
      recreatedNote(1),
    ])
    expect(mockUpsertNoteConnections).toHaveBeenCalledWith({
      adminId: 'note-admin-1',
    })
    expect(store.get(restoredOffersAndNotesNeedRebuildAtom)).toEqual({
      needsRebuild: false,
      notesToRecreate: [],
      offerIdsToReupload: ['offer-1', 'offer-2'],
    })
  })

  it('still hands over the offers when a note fails, and recreates the note on the retry', async () => {
    store.set(mockNotesAtom, [myNote(1, Date.now() + 60_000)])
    mockCreateNote.mockReturnValueOnce(Effect.fail(new Error('offline')))

    expect(
      await Effect.runPromise(
        store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
      )
    ).toEqual([myOffer(1), myOffer(2)])
    expect(
      store.get(restoredOffersAndNotesNeedRebuildAtom).notesToRecreate
    ).toHaveLength(1)
    expect(mockReportError).toHaveBeenCalledWith(
      'error',
      new Error('Error recreating a restored note'),
      expect.anything()
    )
    // The note sync drops the note the server no longer has.
    store.set(mockNotesAtom, [])
    // The offers weren't reuploaded yet, so they are handed over again.
    expect(
      await Effect.runPromise(
        store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
      )
    ).toEqual([myOffer(1), myOffer(2)])

    expect(mockRefreshOffers).toHaveBeenCalledTimes(1)
    expect(mockDeleteOffer).toHaveBeenCalledTimes(1)
    expect(mockCreateNote).toHaveBeenCalledTimes(2)
    expect(store.get(mockNotesAtom)).toEqual([recreatedNote(1)])
    expect(store.get(restoredOffersAndNotesNeedRebuildAtom)).toEqual({
      needsRebuild: false,
      notesToRecreate: [],
      offerIdsToReupload: ['offer-1', 'offer-2'],
    })
  })

  it('does nothing while an earlier run is still reuploading', async () => {
    let secondRun: readonly unknown[] | undefined
    mockReupload.mockImplementationOnce(() =>
      Effect.promise(async () => {
        secondRun = await Effect.runPromise(
          store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
        )
      })
    )

    await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
    )

    expect(secondRun).toEqual([])
    expect(mockReupload).toHaveBeenCalledTimes(1)
  })

  it('keeps handing over the offers until each is reuploaded', async () => {
    await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
    )
    store.set(
      forgetReuploadedRestoredOfferActionAtom,
      Schema.decodeSync(OfferId)('offer-1')
    )

    expect(
      await Effect.runPromise(
        store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
      )
    ).toEqual([myOffer(2)])
    // Gone from the phone, so no longer waiting.
    store.set(mockMyOffersAtom, [myOffer(1)])
    expect(
      await Effect.runPromise(
        store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
      )
    ).toEqual([])
    expect(
      await Effect.runPromise(
        store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
      )
    ).toEqual([])

    expect(mockRefreshOffers).toHaveBeenCalledTimes(1)
    expect(mockDeleteOffer).toHaveBeenCalledTimes(1)
  })

  it('stays pending when deleting the offers fails', async () => {
    mockDeleteOffer.mockReturnValue(Effect.fail(new Error('offline')))

    await expect(
      Effect.runPromise(
        store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
      )
    ).rejects.toThrow()

    expect(store.get(restoredOffersAndNotesNeedRebuildAtom).needsRebuild).toBe(
      true
    )
  })
})

describe('a restored note the user deletes', () => {
  const adminId = Schema.decodeSync(NoteAdminId)(
    '6f1c2b8e-4c1d-4f7e-9a2b-3c4d5e6f7a8b'
  )
  const note = {
    ownershipInfo: {adminId},
    flags: {reported: false},
    noteInfo: {
      noteId: 'note-x',
      publicPart: {},
      expiresAt: Date.now() + 60_000,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRefreshOffers.mockReturnValue(true)
    mockRefreshNotesSucceeds.mockReturnValue(true)
    mockDeleteOffer.mockReturnValue(Effect.void)
    mockDeleteNote.mockReturnValue(Effect.void)
    store.set(mockMyOffersAtom, [])
    store.set(mockNotesAtom, [note])
    store.set(needsFullContactsReplaceAfterContactEditAtom, false)
    store.set(restoredOffersAndNotesNeedRebuildAtom, {
      needsRebuild: true,
      notesToRecreate: [],
      offerIdsToReupload: [],
    })
  })

  it('is not recreated on the retry after the user deleted it', async () => {
    mockCreateNote.mockReturnValueOnce(Effect.fail(new Error('offline')))
    await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
    )

    store.set(forgetNotesToRecreateActionAtom, [adminId])
    await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
    )

    expect(mockCreateNote).toHaveBeenCalledTimes(1)
  })

  it('is deleted again when the user deleted it during its recreation', async () => {
    mockCreateNote.mockImplementation(() =>
      Effect.sync(() => {
        store.set(forgetNotesToRecreateActionAtom, [adminId])
        return {adminId, noteInfo: {noteId: 'note-x'}}
      })
    )

    await Effect.runPromise(
      store.set(rebuildRestoredOffersAndNotesActionAtom, mockReupload)
    )

    expect(mockDeleteNote).toHaveBeenCalledTimes(2)
    expect(mockUpsertNoteConnections).not.toHaveBeenCalled()
    expect(store.get(mockNotesAtom)).toEqual([note])
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

  it('unmarks contacts a failed import got through, so the next import sends them again', async () => {
    store.set(needsFullContactsReplaceAfterContactEditAtom, true)
    store.set(mockStoredContactsAtom, [
      {id: 1, flags: {seen: true, imported: true}},
      {id: 2, flags: {seen: false, imported: false}},
    ])

    await Effect.runPromise(store.set(discardOldPhoneContactsActionAtom))

    expect(store.get(mockStoredContactsAtom)).toEqual([
      {id: 1, flags: {seen: true, imported: false}},
      {id: 2, flags: {seen: false, imported: false}},
    ])
  })

  it('leaves the server contacts alone otherwise', async () => {
    store.set(needsFullContactsReplaceAfterContactEditAtom, false)

    await Effect.runPromise(store.set(discardOldPhoneContactsActionAtom))

    expect(mockImportContacts).not.toHaveBeenCalled()
  })
})
