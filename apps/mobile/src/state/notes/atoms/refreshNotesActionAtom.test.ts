import {NoteInfo} from '@vexl-next/domain/src/general/notes'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import decryptNote, {
  DecryptingNoteError,
} from '@vexl-next/resources-utils/src/notes/decryptNote'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {ServerNote} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {Effect, Schema} from 'effect'
import {createStore} from 'jotai'
import {apiAtom} from '../../../api'
import {notesStateAtom} from './notesState'
import {refreshNotesActionAtom} from './refreshNotesActionAtom'

jest.mock('@vexl-next/resources-utils/src/notes/decryptNote', () => ({
  ...jest.requireActual('@vexl-next/resources-utils/src/notes/decryptNote'),
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('../../../utils/atomUtils/atomWithParsedMmkvStorage', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    atomWithParsedMmkvStorage: (_key: string, initial: unknown) =>
      Object.assign(atom(initial), {flushNow: jest.fn()}),
  }
})
jest.mock('../../../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    apiAtom: atom({
      offer: {
        getNotesForMeModifiedOrCreatedAfterPaginated: jest.fn(),
        getRemovedNotes: jest.fn(),
      },
    }),
  }
})
jest.mock('../../session', () => {
  const {atom} = jest.requireActual('jotai')
  return {sessionDataOrDummyAtom: atom({privateKey: {}, keyPairV2: {}})}
})
jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const previousCursor = Schema.decodeSync(Base64String)('cHJldmlvdXM=')
const nextCursor = Schema.decodeSync(Base64String)('bmV4dA==')
const serverNote = Schema.decodeUnknownSync(ServerNote)({
  id: 1,
  noteId: 'da518798-45d4-4d09-9b12-de3fc9f19ec7',
  expiresAt: Date.now() + 86_400_000,
  publicPayload: '0encrypted-public',
  privatePayload: '0encrypted-private',
  createdAt: '2026-09-18T00:00:00.000Z',
  modifiedAt: '2026-09-18T00:00:00.000Z',
})
const note = Schema.decodeUnknownSync(NoteInfo)({
  ...serverNote,
  publicPart: {
    notePublicKey: 'test-public-key',
    text: 'A note from a direct friend',
    allowRepost: false,
  },
  privatePart: {
    commonFriends: [],
    friendLevel: ['FIRST_DEGREE'],
    symmetricKey: 'test-key',
    viaRepost: false,
  },
})

function setup(): {
  store: ReturnType<typeof createStore>
  fetchNotes: jest.MockedFunction<
    OfferApi['getNotesForMeModifiedOrCreatedAfterPaginated']
  >
} {
  const store = createStore()
  const api = store.get(apiAtom).offer
  const fetchNotes = jest.mocked(
    api.getNotesForMeModifiedOrCreatedAfterPaginated
  )
  fetchNotes.mockReset().mockReturnValue(
    Effect.succeed({
      items: [serverNote],
      nextPageToken: nextCursor,
      hasNext: false,
      limit: 30,
    })
  )
  jest
    .mocked(api.getRemovedNotes)
    .mockReturnValue(Effect.succeed({noteIds: []}))
  jest.mocked(decryptNote).mockReturnValue(() => Effect.succeed(note))
  store.set(notesStateAtom, (old) => ({
    ...old,
    notesNextPageParam: previousCursor,
    notes: [],
  }))
  return {store, fetchNotes}
}

it('commits the cursor together with the decrypted notes', async () => {
  const {store, fetchNotes} = setup()
  jest.mocked(decryptNote).mockReturnValue(() =>
    Effect.sync(() => {
      expect(store.get(notesStateAtom).notesNextPageParam).toBe(previousCursor)
      return note
    })
  )
  await Effect.runPromise(store.set(refreshNotesActionAtom))
  expect(fetchNotes).toHaveBeenCalledWith({
    nextPageToken: previousCursor,
    limit: 30,
  })
  expect(store.get(notesStateAtom).notes).toEqual([
    {noteInfo: note, flags: {reported: false}},
  ])
  expect(store.get(notesStateAtom).notesNextPageParam).toBe(nextCursor)
})

it('advances the cursor past a note that cannot be decrypted', async () => {
  const {store} = setup()
  jest.mocked(decryptNote).mockReturnValue(() =>
    Effect.fail(
      new DecryptingNoteError({
        message: 'Undecryptable note',
        cause: undefined,
        serverNote,
      })
    )
  )
  await Effect.runPromise(store.set(refreshNotesActionAtom))
  expect(store.get(notesStateAtom).notes).toEqual([])
  expect(store.get(notesStateAtom).notesNextPageParam).toBe(nextCursor)
})
