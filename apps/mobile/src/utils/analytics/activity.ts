import {
  bucketClubCount,
  bucketOffersVisible,
  bucketStartDay,
  bucketTenure,
  type TenureBucket,
} from '@vexl-next/analytics-definitions/src/buckets'
import {
  markCoreAction,
  type CoreActionClass,
} from '@vexl-next/analytics-definitions/src/coreAction'
import {activityDailyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityDaily'
import {activityMonthlyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityMonthly'
import {
  activityWeeklyAggregation,
  type ActivityWeeklyState,
} from '@vexl-next/analytics-definitions/src/definitions/activityWeekly'
import {Option, identity} from 'effect'
import {type NotificationsEnabledSettings} from '../notifications'
import {analyticsActionAtom} from './analyticsActionAtom'
import {analyticsInstancesAtom, analyticsMarkersAtom} from './atoms'
import {findAggregationBucket} from './instances'
import {type CoreActionKind} from './onboarding'
import {reportPromptTargetReachedActionAtom} from './prompt'
import {aggregationReportActionAtom} from './report'

const activityDailyAtom = aggregationReportActionAtom(
  activityDailyAggregation,
  () => ({})
)
const activityMonthlyAtom = aggregationReportActionAtom(
  activityMonthlyAggregation,
  () => ({})
)
/** Installs without the `registeredAt` marker (re-logins, older installs) report `w14plus`. */
export const activityWeeklyAtom = aggregationReportActionAtom(
  activityWeeklyAggregation,
  (get, now): ActivityWeeklyState => ({
    tenure: Option.match(
      Option.fromNullable(get(analyticsMarkersAtom).registeredAt),
      {
        onNone: (): TenureBucket => 'w14plus',
        onSome: (registeredAt) => bucketTenure(new Date(registeredAt), now),
      }
    ),
  })
)

const bump = (count: number | undefined): number => (count ?? 0) + 1

/** Called on every foreground while logged in, which includes login. */
export const reportActivityOnForegroundActionAtom = analyticsActionAtom(
  (get, set, {clubsCount}: {clubsCount: number}) => {
    const firstForegroundToday = Option.isNone(
      findAggregationBucket(
        get(analyticsInstancesAtom),
        activityDailyAggregation.name,
        bucketStartDay('day', new Date())
      )
    )

    set(activityDailyAtom, identity)
    set(activityMonthlyAtom, identity)
    set(activityWeeklyAtom, (state) => ({
      ...state,
      ...(firstForegroundToday ? {activeDays: bump(state.activeDays)} : {}),
      clubs: state.clubs ?? bucketClubCount(clubsCount),
    }))
  }
)

const countCoreAction: Record<
  CoreActionKind,
  (state: ActivityWeeklyState) => ActivityWeeklyState
> = {
  offer: (state) => ({...state, offersCreated: bump(state.offersCreated)}),
  request: (state) => ({...state, requestsSent: bump(state.requestsSent)}),
  approval: (state) => ({
    ...state,
    requestsApproved: bump(state.requestsApproved),
  }),
}

export const reportActivityCoreActionActionAtom = analyticsActionAtom(
  (
    get,
    set,
    {kind, actionClass}: {kind: CoreActionKind; actionClass: CoreActionClass}
  ) => {
    const mark = markCoreAction(actionClass)
    set(activityDailyAtom, mark)
    set(activityMonthlyAtom, mark)
    set(activityWeeklyAtom, mark)
    // Separate update: a counter at its cap fails alone and keeps the mark.
    set(activityWeeklyAtom, countCoreAction[kind])
  }
)

export const reportOfferOpenedInWeekActionAtom = analyticsActionAtom(
  (get, set) => {
    set(activityWeeklyAtom, (state) => ({
      ...state,
      offersOpened: bump(state.offersOpened),
    }))
  }
)

export const reportOffersVisibleInWeekActionAtom = analyticsActionAtom(
  (get, set, mainOffersCount: number) => {
    set(activityWeeklyAtom, (state) => ({
      ...state,
      offersVisible:
        state.offersVisible ?? bucketOffersVisible(mainOffersCount),
    }))
  }
)

export const reportNotificationSettingsActionAtom = analyticsActionAtom(
  (
    get,
    set,
    {notifications, backgroundTasks}: NotificationsEnabledSettings
  ) => {
    set(activityWeeklyAtom, (state) => ({
      ...state,
      notificationsAllowed: state.notificationsAllowed ?? notifications,
    }))
    if (notifications)
      set(reportPromptTargetReachedActionAtom, 'enableNotifications')
    if (backgroundTasks)
      set(reportPromptTargetReachedActionAtom, 'enableBackgroundRefresh')
  }
)
