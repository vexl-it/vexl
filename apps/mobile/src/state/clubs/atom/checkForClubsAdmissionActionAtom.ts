import {Array, Effect, Option, Record} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {getNotificationTokenE} from '../../../utils/notifications'
import {showInternalNotificationForClubAdmission} from '../../../utils/notifications/clubNotifications'
import {ignoreReportErrors} from '../../../utils/reportError'
import {type ClubWithMembers} from '../domain'
import {fetchClubWithMembersReportApiErrors} from '../utils'
import {
  clubsKeyHolderStorageAtom,
  keysWaitingForAdmissionAtom,
} from './clubsToKeyHolderAtom'
import {upsertClubWithMembersActionAtom} from './clubsWithMembersAtom'

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
          const clubWithMembers: ClubWithMembers = yield* _(
            fetchClubWithMembersReportApiErrors({
              keyPair: key,
              contactApi: api.contact,
              notificationToken,
            })
          )

          if (
            Record.has(
              get(clubsKeyHolderStorageAtom).data,
              clubWithMembers.club.uuid
            )
          ) {
            console.log(
              'Trying to get admission for a club that is already in the key holder state. Removing key from admissions and leaving club as this key'
            )

            // Leaving club
            yield* _(
              api.contact.leaveClub({
                keyPair: key,
                clubUuid: clubWithMembers.club.uuid,
              }),
              ignoreReportErrors(
                'warn',
                'Error leaving club in checkForAdmission'
              )
            )

            // removing key that is waiting for admission
            set(clubsKeyHolderStorageAtom, (data) => ({
              ...data,
              waitingForAdmission: Array.filter(
                data.waitingForAdmission,
                (k) => k.privateKeyPemBase64 !== key.privateKeyPemBase64
              ),
            }))
            return
          }

          set(clubsKeyHolderStorageAtom, (data) => ({
            ...data,
            data: {...data.data, [clubWithMembers.club.uuid]: key},
            waitingForAdmission: Array.filter(
              data.waitingForAdmission,
              (k) => k.privateKeyPemBase64 === key.privateKeyPemBase64
            ),
          }))

          set(upsertClubWithMembersActionAtom, clubWithMembers)

          yield* _(
            showInternalNotificationForClubAdmission(
              get(translationAtom).t,
              clubWithMembers.club
            )
          )
        }).pipe(
          Effect.catchTag('ClubNotFoundError', () => Effect.void),
          Effect.ignore
        )
      ),
      Effect.all
    )
  })
})
