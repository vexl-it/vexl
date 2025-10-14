import {Effect} from 'effect/index'
import {atom} from 'jotai'
import {isBackgroundFetchEnabled} from '../../utils/notifications'

export const isBackgroundFetchEnabledAtom = atom<boolean>(true)

export const checkIsBackgroundFetchEnabledActionAtom = atom(
  null,
  (get, set) => {
    return Effect.gen(function* (_) {
      const isEnabled = yield* _(isBackgroundFetchEnabled())

      set(isBackgroundFetchEnabledAtom, isEnabled)
    })
  }
)
