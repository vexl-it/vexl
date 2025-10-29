import fetchAllPaginatedData from '@vexl-next/rest-api/src/fetchAllPaginatedData'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {FETCH_CONNECTIONS_PAGE_SIZE} from '../../../state/connections/atom/connectionStateAtom'

const NumberOfFriendsAtomState = Schema.Union(
  Schema.Struct({
    state: Schema.Literal('loading'),
  }),
  Schema.Struct({
    state: Schema.Literal('success'),
    firstLevelFriendsCount: Schema.Int,
    firstAndSecondLevelFriendsCount: Schema.Int,
  }),
  Schema.Struct({
    state: Schema.Literal('error'),
    error: Schema.Unknown,
  })
)

export type NumberOfFriendsAtomState = typeof NumberOfFriendsAtomState.Type

const numberOfFriendsStorageAtom = atom<NumberOfFriendsAtomState>({
  state: 'loading',
})

const numberOfFriendsAtom = atom(
  (get) => get(numberOfFriendsStorageAtom),
  (get, set) => {
    const api = get(apiAtom)

    return Effect.gen(function* (_) {
      const firstLevelConnections = yield* _(
        fetchAllPaginatedData({
          fetchEffectToRun: (nextPageToken) =>
            api.contact.fetchMyContactsPaginated({
              level: 'FIRST',
              limit: FETCH_CONNECTIONS_PAGE_SIZE,
              nextPageToken,
            }),
        })
      )

      const secondLevelConnections = yield* _(
        fetchAllPaginatedData({
          fetchEffectToRun: (nextPageToken) =>
            api.contact.fetchMyContactsPaginated({
              level: 'SECOND',
              limit: FETCH_CONNECTIONS_PAGE_SIZE,
              nextPageToken,
            }),
        })
      )

      set(numberOfFriendsStorageAtom, {
        state: 'success',
        firstLevelFriendsCount: firstLevelConnections.length,
        firstAndSecondLevelFriendsCount:
          firstLevelConnections.length + secondLevelConnections.length,
      })
    }).pipe(
      Effect.catchAll((error) => {
        set(numberOfFriendsStorageAtom, {state: 'error', error})
        return Effect.void
      })
    )
  }
)

numberOfFriendsAtom.onMount = (setAtom) => {
  setAtom()
}

export default numberOfFriendsAtom
