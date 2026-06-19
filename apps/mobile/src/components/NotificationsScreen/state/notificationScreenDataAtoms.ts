import {Array, Order, pipe, Schema} from 'effect/index'
import {atom, type SetStateAction} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {NotificationCenterRecord} from './domain'

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
