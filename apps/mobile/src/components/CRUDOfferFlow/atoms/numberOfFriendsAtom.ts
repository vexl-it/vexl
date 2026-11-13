import {fetchMyConnections} from '@vexl-next/resources-utils/src/offers/utils/fetchContactsForOffer'
import {Array, Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {ownPublicKeysAtom} from '../../../api/contactApiForSession'

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

let resolveNumberOfFriends: (value: boolean) => void = () => {}
const resolveNumberOfFriendsPromise = new Promise<boolean>(
  (resolve) => (resolveNumberOfFriends = resolve)
)
export const numberOfFriendsLoadedEffect = Effect.promise<boolean>(
  async () => await resolveNumberOfFriendsPromise
)

const numberOfFriendsAtom = atom(
  (get) => get(numberOfFriendsStorageAtom),
  (get, set) => {
    const api = get(apiAtom)

    return Effect.gen(function* (_) {
      const ownPublicKeys = get(ownPublicKeysAtom)
      const firstLevelConnections = yield* _(
        fetchMyConnections({
          contactApi: api.contact,
          level: 'FIRST',
          ownPublicKeys,
        })
      )

      const secondLevelConnections = yield* _(
        fetchMyConnections({
          contactApi: api.contact,
          level: 'SECOND',
          ownPublicKeys,
        })
      )

      const firstAndSecondLevelFriendsDeduped = Array.dedupe([
        ...firstLevelConnections,
        ...secondLevelConnections,
      ])

      set(numberOfFriendsStorageAtom, {
        state: 'success',
        firstLevelFriendsCount: firstLevelConnections.length,
        firstAndSecondLevelFriendsCount:
          firstAndSecondLevelFriendsDeduped.length,
      })
    })
      .pipe(
        Effect.catchAll((error) => {
          set(numberOfFriendsStorageAtom, {state: 'error', error})
          return Effect.void
        })
      )
      .pipe(
        Effect.tap(() => {
          resolveNumberOfFriends?.(true)
        })
      )
  }
)

numberOfFriendsAtom.onMount = (setAtom) => {
  Effect.runFork(setAtom())
}

export default numberOfFriendsAtom
