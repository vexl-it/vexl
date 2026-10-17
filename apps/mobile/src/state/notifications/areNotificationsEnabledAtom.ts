import {Effect, Option} from 'effect/index'
import {atom} from 'jotai'
import {reportNotificationSettingsActionAtom} from '../../utils/analytics'
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
    if (Option.isSome(status))
      set(reportNotificationSettingsActionAtom, status.value)
    return status
  })
})
