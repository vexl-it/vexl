import {
  fromDate,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Match, Option, Order, pipe, Schema} from 'effect/index'
import {atom, type SetStateAction} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {notificationPreferencesAtom} from '../../../utils/preferences'
import {refreshNotificationBadgeCountActionAtom} from '../../BadgeCountManager'
import {
  NotificationCenterRecord,
  NotificationCenterRecordId,
  type NotificationCenterRecordData,
  type NotificationStatus,
} from './domain'

const notificationScreenDataStorageAtom = atomWithParsedMmkvStorage(
  'notificationScreenData',
  {notifications: []},
  Schema.Struct({
    notifications: Schema.Array(NotificationCenterRecord),
  })
)

export const notificationScreenData = atom(
  (get) => get(notificationScreenDataStorageAtom).notifications,
  (get, set, update: SetStateAction<readonly NotificationCenterRecord[]>) => {
    const newValue = pipe(
      // new value
      getValueFromSetStateActionOfAtom(update)(
        () => get(notificationScreenDataStorageAtom).notifications
      ),
      // dedupeById
      Array.dedupeWith((a, b) => a.id === b.id),
      Array.sortWith((a) => a.date, Order.reverse(Order.number))
    )
    set(notificationScreenDataStorageAtom, (o) => ({
      ...o,
      notifications: newValue,
    }))
  }
)

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

export const activeNotificationScreenDataAtom = atom(
  (get) =>
    pipe(
      get(notificationScreenData),
      Array.filter((notification) => !notification.status.isCancelled)
    ),
  (get, set, update: SetStateAction<readonly NotificationCenterRecord[]>) => {
    const notifications = get(notificationScreenData)
    const activeNotifications = pipe(
      notifications,
      Array.filter((notification) => !notification.status.isCancelled)
    )
    const cancelledNotifications = pipe(
      notifications,
      Array.filter((notification) => notification.status.isCancelled)
    )

    set(
      notificationScreenData,
      pipe(
        getValueFromSetStateActionOfAtom(update)(() => activeNotifications),
        Array.appendAll(cancelledNotifications)
      )
    )
  }
)

export const NotificationsAtomsAtom = splitAtom(
  activeNotificationScreenDataAtom,
  (notification) => notification.id
)

export const notSeenNotificationCountAtom = atom((get) =>
  pipe(
    get(activeNotificationScreenDataAtom),
    Array.filter((one) => !one.status.isSeen),
    Array.length
  )
)

export const areThereNotSeenNotificationsAtom = atom(
  (get) =>
    pipe(
      get(activeNotificationScreenDataAtom),
      Array.filter((one) => !one.status.isSeen),
      Array.length
    ) > 0
)
