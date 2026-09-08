import {Effect, Option, pipe} from 'effect'
import {atom} from 'jotai'
import {
  areNotificationsEnabledE,
  type NotificationsEnabledSettings,
} from '../../utils/notifications'

export const notificationsEnabledAtom = atom<
  Option.Option<NotificationsEnabledSettings>
>(Option.none())

export const checkAreNotificationsEnabledAtom = atom(null, (get, set) => {
  return Effect.gen(function* () {
    const status = yield* pipe(areNotificationsEnabledE(), Effect.option)

    set(notificationsEnabledAtom, status)
    return status
  })
})
