import {Effect, Option} from 'effect/index'
import {atom} from 'jotai'
import {
  areNotificationsEnabledE,
  type NotificationsEnabledSettings,
} from '../../utils/notifications'

export const notificationsEnabledAtom = atom<
  Option.Option<NotificationsEnabledSettings>
>(Option.none())

export const checkAreNotificationsEnabledAtom = atom(null, (get, set) => {
  return Effect.gen(function* (_) {
    const status = yield* _(areNotificationsEnabledE(), Effect.option)

    set(notificationsEnabledAtom, status)
  })
})
