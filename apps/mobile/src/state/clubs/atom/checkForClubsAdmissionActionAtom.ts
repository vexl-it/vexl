import {Array, Effect, Option} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {getNotificationTokenE} from '../../../utils/notifications'
import {showInternalNotificationForClubAdmission} from '../../../utils/notifications/clubNotifications'
import {keysWaitingForAdmissionAtom, myClubsStorageAtom} from './clubsStore'
import {clubsWithMembersAtom} from './clubsWithMembersAtom'

export const checkForClubsAdmissionActionAtom = atom(null, (get, set) => {
  return Effect.gen(function* (_) {
    const api = get(apiAtom)

    const keysWaitingForAdmission = get(keysWaitingForAdmissionAtom)
    const notificationToken = yield* _(
      getNotificationTokenE(),
      Effect.map(Option.fromNullable)
    )

    yield* _(
      keysWaitingForAdmission,
      Array.map((key) =>
        Effect.gen(function* (_) {
          const {clubInfoForUser} = yield* _(
            api.contact.getClubInfo({
              keyPair: key,
              notificationToken,
            })
          )

          set(myClubsStorageAtom, (data) => ({
            ...data,
            data: {...data.data, [clubInfoForUser.club.uuid]: key},
            waitingForAdmission: Array.filter(
              data.waitingForAdmission,
              (k) => k.privateKeyPemBase64 === key.privateKeyPemBase64
            ),
          }))

          yield* _(set(clubsWithMembersAtom))

          yield* _(
            showInternalNotificationForClubAdmission(
              get(translationAtom).t,
              clubInfoForUser.club
            )
          )
        }).pipe(Effect.ignore)
      ),
      Effect.all
    )
  })
})
