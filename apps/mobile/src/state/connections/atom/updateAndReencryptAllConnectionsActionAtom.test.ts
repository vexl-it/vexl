import {Effect, Option, Schema} from 'effect'
import {createStore} from 'jotai'
import {ConnectionsState} from '../domain'
import {updateAndReencryptAllNotesConnectionsActionAtom} from './noteToConnectionsAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from './offerToConnectionsAtom'
import {updateAndReencryptAllConnectionsActionAtom} from './updateAndReencryptAllConnectionsActionAtom'

jest.mock('./connectionStateAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {fetchConnectionsActionAtom: atom(null, () => mockFetchGraph())}
})
jest.mock('./offerToConnectionsAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    updateAndReencryptAllOffersConnectionsActionAtom: atom(
      null,
      jest.fn(() => Effect.succeed([]))
    ),
  }
})
jest.mock('./noteToConnectionsAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    updateAndReencryptAllNotesConnectionsActionAtom: atom(
      null,
      jest.fn(() => Effect.succeed([]))
    ),
  }
})

const mockFetchGraph = jest.fn<Effect.Effect<ConnectionsState, unknown>, []>()
const graph = Schema.decodeUnknownSync(ConnectionsState)({
  lastUpdate: 1,
  firstLevel: [],
  secondLevel: [],
  commonFriends: [],
  verifiedFriends: [],
})

beforeEach(() => {
  jest.clearAllMocks()
})

it.each([
  ['succeeds', Effect.succeed(graph), Option.some(graph)],
  ['fails', Effect.fail('offline'), Option.none()],
])(
  'fetches once and hands the outcome to offers and notes when the fetch %s',
  async (_, fetch, fetchedConnections) => {
    mockFetchGraph.mockReturnValue(fetch)
    const store = createStore()
    await Effect.runPromise(
      store.set(updateAndReencryptAllConnectionsActionAtom, {
        isInBackground: true,
      })
    )
    expect(mockFetchGraph).toHaveBeenCalledTimes(1)
    for (const action of [
      updateAndReencryptAllOffersConnectionsActionAtom,
      updateAndReencryptAllNotesConnectionsActionAtom,
    ])
      expect(jest.mocked(action.write).mock.lastCall?.[2]).toEqual(
        expect.objectContaining({isInBackground: true, fetchedConnections})
      )
  }
)
