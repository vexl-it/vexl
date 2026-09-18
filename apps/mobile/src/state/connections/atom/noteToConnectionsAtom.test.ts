import {
  generatePrivateKey,
  PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  generateNoteAdminId,
  generateNoteRepostId,
  MyNoteInState,
  newNoteId,
} from '@vexl-next/domain/src/general/notes'
import updateNotePrivateParts from '@vexl-next/resources-utils/src/notes/updateNotePrivateParts'
import updateRepostNotePrivateParts from '@vexl-next/resources-utils/src/notes/updateRepostNotePrivateParts'
import {Array, Effect, HashMap, Schema} from 'effect'
import {createStore} from 'jotai'
import {notesAtom} from '../../notes/atoms/notesState'
import {ConnectionsState, NoteToConnectionsItems} from '../domain'
import {fetchConnectionsActionAtom} from './connectionStateAtom'
import {
  noteToConnectionsAtom,
  updateAndReencryptAllNotesConnectionsActionAtom,
} from './noteToConnectionsAtom'
import {repostToConnectionsAtom} from './repostToConnectionsAtom'

jest.mock('./connectionStateAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {fetchConnectionsActionAtom: atom(null, jest.fn())}
})
jest.mock('@vexl-next/resources-utils/src/notes/updateNotePrivateParts')
jest.mock('@vexl-next/resources-utils/src/notes/updateRepostNotePrivateParts')
jest.mock('../../../utils/atomUtils/atomWithParsedMmkvStorage', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    atomWithParsedMmkvStorage: (_key: string, initial: unknown) =>
      Object.assign(atom(initial), {flushNow: jest.fn()}),
  }
})
jest.mock('../../../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {apiAtom: atom({offer: {}})}
})
jest.mock('../../session', () => {
  const {atom} = jest.requireActual('jotai')
  return {sessionDataOrDummyAtom: atom({privateKey: {}, keyPairV2: {}})}
})
jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('../../notes/atoms/notesState', () => {
  const {atom} = jest.requireActual('jotai')
  const {Array, Schema} = jest.requireActual('effect')
  const {MyNoteInState} = jest.requireActual(
    '@vexl-next/domain/src/general/notes'
  )
  const notesAtom = atom([])
  return {
    notesStateAtom: {flushNow: jest.fn()},
    notesAtom,
    myNotesAtom: atom((get: (a: unknown) => unknown[]) =>
      Array.filter(get(notesAtom), Schema.is(MyNoteInState))
    ),
  }
})
const publicKey = Schema.decodeSync(PublicKeyV2)('V2_PUB_recipient')
const decodedGraph = Schema.decodeUnknownSync(ConnectionsState)({
  lastUpdate: 1,
  firstLevel: [publicKey],
  secondLevel: [],
  commonFriends: [],
  verifiedFriends: [],
})
const graph = {
  ...decodedGraph,
  firstLevel: [...decodedGraph.firstLevel],
  secondLevel: [...decodedGraph.secondLevel],
  commonFriends: HashMap.map(decodedGraph.commonFriends, (friends) => [
    ...friends,
  ]),
  verifiedFriends: HashMap.map(decodedGraph.verifiedFriends, (friends) => [
    ...friends,
  ]),
}
const note = Schema.decodeUnknownSync(MyNoteInState)({
  noteInfo: {
    id: 1,
    noteId: newNoteId(),
    expiresAt: Date.now() + 600_000,
    createdAt: '2026-09-14T00:00:00.000Z',
    modifiedAt: '2026-09-14T00:00:00.000Z',
    publicPart: {
      notePublicKey: generatePrivateKey().publicKeyPemBase64,
      text: 'note',
      allowRepost: true,
    },
    privatePart: {
      symmetricKey: 'key',
      commonFriends: [],
      friendLevel: [],
      viaRepost: false,
    },
  },
  flags: {},
  ownershipInfo: {adminId: generateNoteAdminId()},
})
const repostId = generateNoteRepostId()
const commonResult = {
  noteNotFoundOnServer: false,
  encryptionErrors: [],
  timeLimitReachedErrors: [],
  removedConnections: [],
  newConnections: {firstLevel: [], secondLevel: []},
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(fetchConnectionsActionAtom.write).mockReturnValue(
    Effect.succeed({
      ...graph,
      firstLevel: [...graph.firstLevel],
      secondLevel: [...graph.secondLevel],
    })
  )
  jest
    .mocked(updateNotePrivateParts)
    .mockReset()
    .mockReturnValue(Effect.succeed({...commonResult, updateSuccess: true}))
  jest
    .mocked(updateRepostNotePrivateParts)
    .mockReset()
    .mockReturnValue(
      Effect.succeed({
        ...commonResult,
        updateSuccess: true,
        repostNotFoundOnServer: false,
      })
    )
})

function setup(): ReturnType<typeof createStore> {
  const store = createStore()
  store.set(notesAtom, [
    note,
    {
      ...note,
      ownershipInfo: undefined,
      noteInfo: {...note.noteInfo, noteId: newNoteId()},
      repostInfo: {repostId, repostedAt: note.noteInfo.expiresAt},
    },
  ])
  store.set(
    noteToConnectionsAtom,
    Schema.decodeUnknownSync(NoteToConnectionsItems)({
      noteToConnections: [
        {
          adminId: note.ownershipInfo.adminId,
          symmetricKey: note.noteInfo.privatePart.symmetricKey,
          connections: {firstLevel: [publicKey], secondLevel: []},
        },
      ],
    })
  )
  const repost = store.get(notesAtom)[1]
  if (!repost) throw new Error('Expected repost')
  store.set(repostToConnectionsAtom, {
    repostToConnections: [
      {
        repostId,
        noteId: repost.noteInfo.noteId,
        symmetricKey: note.noteInfo.privatePart.symmetricKey,
        connections: {firstLevel: [publicKey], secondLevel: []},
      },
    ],
  })
  return store
}

function run(
  store: ReturnType<typeof createStore>
): Promise<ReadonlyArray<{success: boolean}>> {
  return Effect.runPromise(
    store.set(updateAndReencryptAllNotesConnectionsActionAtom, {})
  )
}

it.each(['note', 'repost'])('reports incomplete %s uploads', async (kind) => {
  const store = setup()
  if (kind === 'note')
    jest
      .mocked(updateNotePrivateParts)
      .mockReturnValueOnce(
        Effect.succeed({...commonResult, updateSuccess: false})
      )
  else
    jest.mocked(updateRepostNotePrivateParts).mockReturnValueOnce(
      Effect.succeed({
        ...commonResult,
        updateSuccess: false,
        repostNotFoundOnServer: false,
      })
    )
  expect(await run(store)).toEqual([
    {adminId: note.ownershipInfo.adminId, success: kind !== 'note'},
    {repostId, success: kind !== 'repost'},
  ])
  expect(noteToConnectionsAtom.flushNow).toHaveBeenCalled()
  expect(repostToConnectionsAtom.flushNow).toHaveBeenCalled()
})

it('passes the snapshot and changed recipients to notes and keeps failed repost revocations retryable', async () => {
  const store = setup()
  jest
    .mocked(updateRepostNotePrivateParts)
    .mockReturnValueOnce(Effect.fail(new NotFoundError()))
  await run(store)
  expect(jest.mocked(updateNotePrivateParts).mock.lastCall?.[0]).toEqual(
    expect.objectContaining({
      commonFriends: graph.commonFriends,
      connectionsToRefresh: [publicKey],
    })
  )
  expect(
    store.get(repostToConnectionsAtom).repostToConnections[0]?.connections
      .firstLevel
  ).toEqual([publicKey])
})

it('drops an authored note missing on the server so the next round does not retry it', async () => {
  const store = setup()
  jest.mocked(updateNotePrivateParts).mockReturnValueOnce(
    Effect.succeed({
      ...commonResult,
      updateSuccess: false,
      noteNotFoundOnServer: true,
    })
  )
  expect(await run(store)).toEqual([
    {adminId: note.ownershipInfo.adminId, success: true},
    {repostId, success: true},
  ])
  expect(store.get(noteToConnectionsAtom).noteToConnections).toEqual([])
  await run(store)
  expect(updateNotePrivateParts).toHaveBeenCalledTimes(1)
})

it('retries pending recipients after a partial failure even when the graph is unchanged', async () => {
  const store = setup()
  jest
    .mocked(updateNotePrivateParts)
    .mockReturnValueOnce(
      Effect.succeed({...commonResult, updateSuccess: false})
    )
  await run(store)
  await run(store)
  expect(
    jest.mocked(updateNotePrivateParts).mock.lastCall?.[0].connectionsToRefresh
  ).toEqual([publicKey])
  await run(store)
  expect(
    jest.mocked(updateNotePrivateParts).mock.lastCall?.[0].connectionsToRefresh
  ).toEqual([])
})

it('refreshes changed common friends independently and keeps retries when the graph reverts', async () => {
  const store = setup()
  await run(store)
  const friend = Schema.decodeSync(HashedPhoneNumber)('friend')
  jest.mocked(fetchConnectionsActionAtom.write).mockReturnValueOnce(
    Effect.succeed({
      ...graph,
      firstLevel: [...graph.firstLevel],
      secondLevel: [],
      commonFriends: HashMap.make([publicKey, [friend]]),
    })
  )
  jest
    .mocked(updateNotePrivateParts)
    .mockReturnValueOnce(
      Effect.succeed({...commonResult, updateSuccess: false})
    )
  await run(store)
  expect(
    jest.mocked(updateNotePrivateParts).mock.lastCall?.[0].connectionsToRefresh
  ).toEqual([publicKey])
  await run(store)
  expect(jest.mocked(updateNotePrivateParts).mock.lastCall?.[0]).toEqual(
    expect.objectContaining({
      connectionsToRefresh: [publicKey],
      commonFriends: graph.commonFriends,
    })
  )
})

it('does not refresh note payloads for verified-friend-only changes', async () => {
  const store = setup()
  await run(store)
  const friend = Schema.decodeSync(HashedPhoneNumber)('friend')
  jest.mocked(fetchConnectionsActionAtom.write).mockReturnValueOnce(
    Effect.succeed({
      ...graph,
      firstLevel: [...graph.firstLevel],
      secondLevel: [],
      verifiedFriends: HashMap.make([publicKey, [friend]]),
    })
  )
  await run(store)
  expect(
    jest.mocked(updateNotePrivateParts).mock.lastCall?.[0].connectionsToRefresh
  ).toEqual([])
})

it('keeps retries on the failed note without refreshing successful notes again', async () => {
  const store = setup()
  const secondNote = {
    ...note,
    ownershipInfo: {adminId: generateNoteAdminId()},
    noteInfo: {...note.noteInfo, noteId: newNoteId()},
  }
  store.set(notesAtom, (notes) => [...notes, secondNote])
  store.set(noteToConnectionsAtom, (state) => ({
    ...state,
    noteToConnections: [
      ...state.noteToConnections,
      {
        adminId: secondNote.ownershipInfo.adminId,
        symmetricKey: secondNote.noteInfo.privatePart.symmetricKey,
        pendingConnectionsToRefresh: [],
        connections: {firstLevel: [publicKey], secondLevel: []},
      },
    ],
  }))
  jest
    .mocked(updateNotePrivateParts)
    .mockReturnValueOnce(
      Effect.succeed({...commonResult, updateSuccess: false})
    )
  await run(store)
  expect(store.get(noteToConnectionsAtom).noteToConnections).toEqual([
    expect.objectContaining({
      adminId: note.ownershipInfo.adminId,
      pendingConnectionsToRefresh: [publicKey],
    }),
    expect.objectContaining({
      adminId: secondNote.ownershipInfo.adminId,
      pendingConnectionsToRefresh: [],
    }),
  ])
  jest.mocked(updateNotePrivateParts).mockClear()
  await run(store)
  expect(
    jest.mocked(updateNotePrivateParts).mock.calls[0]?.[0].connectionsToRefresh
  ).toEqual([publicKey])
  expect(
    jest.mocked(updateNotePrivateParts).mock.calls[1]?.[0].connectionsToRefresh
  ).toEqual([])
})

it('clears a successful note queue even when a repost fails', async () => {
  const store = setup()
  jest.mocked(updateRepostNotePrivateParts).mockReturnValueOnce(
    Effect.succeed({
      ...commonResult,
      updateSuccess: false,
      repostNotFoundOnServer: false,
    })
  )
  await run(store)
  expect(
    store.get(noteToConnectionsAtom).noteToConnections[0]
      ?.pendingConnectionsToRefresh
  ).toEqual([])
  await run(store)
  expect(
    jest.mocked(updateNotePrivateParts).mock.lastCall?.[0].connectionsToRefresh
  ).toEqual([])
})

it('reads existing stored note records with an empty retry queue and no baseline', () => {
  const state = Schema.decodeUnknownSync(NoteToConnectionsItems)({
    noteToConnections: [
      {
        adminId: note.ownershipInfo.adminId,
        symmetricKey: note.noteInfo.privatePart.symmetricKey,
        connections: {firstLevel: [publicKey], secondLevel: []},
      },
    ],
  })
  expect(state.connectionsState).toBeUndefined()
  expect(state.noteToConnections[0]?.pendingConnectionsToRefresh).toEqual([])
})

it('refreshes common friends only for V2 recipients on initialization, changes, and retries', async () => {
  const store = setup()
  const legacyPublicKey = generatePrivateKey().publicKeyPemBase64
  const mixedGraph = {
    ...graph,
    firstLevel: [publicKey, legacyPublicKey],
  }
  store.set(noteToConnectionsAtom, (state) => ({
    ...state,
    noteToConnections: Array.map(state.noteToConnections, (one) => ({
      ...one,
      connections: {firstLevel: mixedGraph.firstLevel, secondLevel: []},
    })),
  }))
  jest
    .mocked(fetchConnectionsActionAtom.write)
    .mockReturnValue(Effect.succeed(mixedGraph))

  await run(store)
  expect(
    jest.mocked(updateNotePrivateParts).mock.lastCall?.[0].connectionsToRefresh
  ).toEqual([publicKey])

  const friend = Schema.decodeSync(HashedPhoneNumber)('new-friend')
  jest.mocked(fetchConnectionsActionAtom.write).mockReturnValue(
    Effect.succeed({
      ...mixedGraph,
      commonFriends: HashMap.set(
        HashMap.set(mixedGraph.commonFriends, publicKey, [friend]),
        legacyPublicKey,
        [friend]
      ),
    })
  )
  jest
    .mocked(updateNotePrivateParts)
    .mockReturnValueOnce(
      Effect.succeed({...commonResult, updateSuccess: false})
    )
  await run(store)
  expect(
    jest.mocked(updateNotePrivateParts).mock.lastCall?.[0].connectionsToRefresh
  ).toEqual([publicKey])
  expect(
    store.get(noteToConnectionsAtom).noteToConnections[0]
      ?.pendingConnectionsToRefresh
  ).toEqual([publicKey])

  await run(store)
  expect(jest.mocked(updateNotePrivateParts).mock.lastCall?.[0]).toEqual(
    expect.objectContaining({
      connectionsToRefresh: [publicKey],
      targetConnections: {
        firstLevel: [publicKey, legacyPublicKey],
        secondLevel: [],
      },
    })
  )
  expect(
    store.get(noteToConnectionsAtom).noteToConnections[0]
      ?.pendingConnectionsToRefresh
  ).toEqual([])
})
