import {
  type DormancyBucket,
  type NotificationCategory,
} from '@vexl-next/analytics-definitions/src/buckets'
import {
  reactivationJourney,
  type ReactivationSource,
} from '@vexl-next/analytics-definitions/src/definitions/reactivation'
import {Option, pipe} from 'effect'
import {atom} from 'jotai'
import {analyticsActionAtom} from './analyticsActionAtom'
import {journeyReportActionAtom} from './report'

export const reactivationJourneyAtom =
  journeyReportActionAtom(reactivationJourney)

// The notification open and the foreground it causes arrive in either order,
// so each side looks for the other within this window.
const OPENED_FROM_WINDOW_MS = 10_000

const lastNotificationOpenAtom = atom<
  Option.Option<{category: NotificationCategory; at: number}>
>(Option.none())
const lastReturnAtAtom = atom<Option.Option<number>>(Option.none())

const isRecent = (at: number, now: number): boolean =>
  now - at < OPENED_FROM_WINDOW_MS

export const startReactivationActionAtom = analyticsActionAtom(
  (
    get,
    set,
    {dormantFor, clubMember}: {dormantFor: DormancyBucket; clubMember: boolean}
  ) => {
    const now = Date.now()
    const openedFrom = pipe(
      get(lastNotificationOpenAtom),
      Option.filter((open) => isRecent(open.at, now)),
      Option.match({
        onNone: (): ReactivationSource => 'direct',
        onSome: (open) => open.category,
      })
    )
    set(lastReturnAtAtom, Option.some(now))
    set(
      reactivationJourneyAtom,
      {dormantFor, openedFrom, clubMember},
      {alwaysStart: true}
    )
  }
)

export const reportReactivationNotificationOpenActionAtom = analyticsActionAtom(
  (get, set, category: NotificationCategory) => {
    const now = Date.now()
    set(lastNotificationOpenAtom, Option.some({category, at: now}))
    if (Option.exists(get(lastReturnAtAtom), (at) => isRecent(at, now)))
      set(reactivationJourneyAtom, {openedFrom: category}, {onlyIfOpen: true})
  }
)
