import {
  fromDate,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Match, Option, pipe} from 'effect/index'
import {atom} from 'jotai'
import {notificationPreferencesAtom} from '../../../utils/preferences'
import {refreshNotificationBadgeCountActionAtom} from '../../BadgeCountManager'
import {
  NotificationCenterRecordId,
  type NotificationCenterRecord,
  type NotificationCenterRecordData,
  type NotificationStatus,
} from './domain'
import {notificationScreenData} from './notificationScreenDataAtoms'

export {
  activeNotificationScreenDataAtom,
  areThereNotSeenNotificationsAtom,
  NotificationsAtomsAtom,
  notificationScreenData,
  notSeenNotificationCountAtom,
} from './notificationScreenDataAtoms'

export const generateNotificationCenterRecordId = (
  data: NotificationCenterRecordData
): NotificationCenterRecordId =>
  Match.value(data).pipe(
    Match.tag('VexlProductNotificationData', (d) =>
      NotificationCenterRecordId.make(d.productNotification.uuid)
    ),
    Match.tag('ClubAdmissionNotificationData', (d) =>
      NotificationCenterRecordId.make(
        `clubAdmission_${d.pubKey}_${d.clubInfo.uuid}`
      )
    ),
    Match.tag('ClubDeactivationNotificationData', (d) =>
      NotificationCenterRecordId.make(
        `clubDeactivation_${d.pubKey}_${d.clubInfo.uuid}`
      )
    ),
    Match.exhaustive
  )

export const addNotificationToCenterActionAtom = atom(
  null,
  (get, set, data: NotificationCenterRecordData) => {
    const idToInsert = generateNotificationCenterRecordId(data)

    if (
      pipe(
        get(notificationScreenData),
        Array.findFirst((r) => r.id === idToInsert),
        Option.isSome
      )
    )
      // If notification already present do nothing
      return

    const initialStatus: NotificationStatus = {
      isCancelled: false,
      isSeen: false,
    }

    const notificationPreferences = get(notificationPreferencesAtom)

    const notificationToInsert: NotificationCenterRecord = Match.value(
      data
    ).pipe(
      Match.tag('VexlProductNotificationData', (d) => {
        const isCancelledByDefault =
          d.productNotification.type === 'MARKETING' &&
          !notificationPreferences.marketing
        return {
          id: idToInsert,
          date: fromDate(d.productNotification.date),
          data: d,
          status: {...initialStatus, isCancelled: isCancelledByDefault},
        }
      }),
      Match.tag('ClubAdmissionNotificationData', (d) => ({
        id: idToInsert,
        date: unixMillisecondsNow(),
        data: d,
        status: initialStatus,
      })),
      Match.tag('ClubDeactivationNotificationData', (d) => ({
        id: idToInsert,
        date: unixMillisecondsNow(),
        data: d,
        status: initialStatus,
      })),
      Match.exhaustive
    )

    set(notificationScreenData, Array.prepend(notificationToInsert))
    set(refreshNotificationBadgeCountActionAtom)
  }
)

export const markAllAsSeenActionAtom = atom(null, (_, set) => {
  set(
    notificationScreenData,
    Array.map((one) => ({...one, status: {...one.status, isSeen: true}}))
  )
})

export const cancelNotificationCenterRecordActionAtom = atom(
  null,
  (_, set, id: NotificationCenterRecordId) => {
    set(
      notificationScreenData,
      Array.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              status: {...notification.status, isCancelled: true},
            }
          : notification
      )
    )
  }
)
