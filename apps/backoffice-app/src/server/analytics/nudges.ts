import {formatValue, type NudgesData} from '@/src/services/analytics/domain'
import {type NotificationCategory} from '@vexl-next/analytics-definitions/src/buckets'
import {activityWeeklyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityWeekly'
import {
  notificationOpenJourney,
  type NotificationOpenState,
} from '@vexl-next/analytics-definitions/src/definitions/notificationOpen'
import {
  promptJourney,
  type PromptId,
  type PromptState,
} from '@vexl-next/analytics-definitions/src/definitions/prompt'
import {Array, Effect} from 'effect'
import {
  addDays,
  bucketsOf,
  daysOf,
  formatSpan,
  rangeStartDay,
  snapshotOf,
  today,
} from './buckets'
import {
  countStates,
  sumMetric,
  sumValues,
  sumWhere,
  type QueryResult,
  type QueryScope,
} from './query'
import {countOrNull, inBucket, percentOrNull, seriesOf, shareRow} from './stats'

// `sendTaskType` of NOTIFICATION_SENT
const PUSH_TYPES: ReadonlyArray<readonly [string, string]> = [
  ['Chat message notice', 'NewChatMessageNoticeSendTask'],
  ['New user notice', 'NewUserNoticeSendTask'],
  ['New Club user notice', 'NewClubUserNoticeSendTask'],
  ['Admitted to Club', 'UserAdmittedToClubNoticeSendTask'],
  ['Inactivity reminder', 'UserInactivityNoticeSendTask'],
  ['Login on another device', 'UserLoginOnDifferentDeviceNoticeSendTask'],
  ['Club flagged', 'ClubFlaggedNoticeSendTask'],
  ['Club expired', 'ClubExpiredNoticeSendTask'],
  ['New content notice', 'NewContentNoticeSendTask'],
  ['Product notification', 'VexlProductNotificationSendTask'],
]

// Nudges first; the chat categories open the chat themselves
const OPEN_CATEGORIES: ReadonlyArray<
  readonly [string, NotificationCategory, {opensChat: boolean}]
> = [
  ['New offers', 'newOffers', {opensChat: false}],
  ['Marketplace ready', 'marketplaceReady', {opensChat: false}],
  ['Inactivity reminder', 'inactivityReminder', {opensChat: false}],
  ['Product news', 'productNews', {opensChat: false}],
  ['Club admission', 'clubAdmission', {opensChat: false}],
  ['Club deactivated', 'clubDeactivated', {opensChat: false}],
  ['Chat message', 'chatMessage', {opensChat: true}],
  ['Request received', 'requestReceived', {opensChat: true}],
  ['Request answered', 'requestAnswered', {opensChat: true}],
  ['Trade reminder', 'tradeReminder', {opensChat: true}],
  ['Other', 'other', {opensChat: false}],
]

const PROMPTS: ReadonlyArray<readonly [string, PromptId]> = [
  ['Import contacts', 'importContacts'],
  ['Import new contacts', 'importNewContacts'],
  ['Missing product categories', 'missingProductCategories'],
  ['Enable notifications', 'enableNotifications'],
  ['Enable background refresh', 'enableBackgroundRefresh'],
  ['Create your first offer', 'createOffer'],
]

export const loadNudges = (scope: QueryScope): QueryResult<NudgesData> =>
  Effect.gen(function* (_) {
    const {filters} = scope
    const openSnapshot = snapshotOf(
      filters.range,
      'notifications opened',
      notificationOpenJourney.lifetimeDays
    )
    const promptSnapshot = snapshotOf(
      filters.range,
      'prompts first shown',
      promptJourney.lifetimeDays
    )
    const weekBuckets = bucketsOf(
      {period: 'week', range: filters.range},
      activityWeeklyAggregation
    )

    const data = yield* _(
      Effect.all(
        {
          sent: sumMetric({
            name: 'NOTIFICATION_SENT',
            where: {channel: 'push'},
            by: 'sendTaskType',
            days: {
              from: rangeStartDay(filters.range),
              to: addDays(today(), 1),
            },
            dimensions: {platform: 'clientPlatform'},
            scope,
          }),
          opens: countStates(notificationOpenJourney.name, {
            state: notificationOpenJourney.payloadSchema,
            days: openSnapshot.days,
            scope,
          }),
          prompts: countStates(promptJourney.name, {
            state: promptJourney.payloadSchema,
            days: promptSnapshot.days,
            scope,
          }),
          weekly: countStates(activityWeeklyAggregation.name, {
            state: activityWeeklyAggregation.payloadSchema.pick(
              'notificationsAllowed'
            ),
            days: daysOf(weekBuckets),
            period: 'week',
            scope,
          }),
        },
        {concurrency: 'unbounded'}
      )
    )

    const opensWhere = (
      predicate: (state: NotificationOpenState) => boolean
    ): number => sumWhere(data.opens, (row) => predicate(row.state))
    const promptsWhere = (predicate: (state: PromptState) => boolean): number =>
      sumWhere(data.prompts, (row) => predicate(row.state))

    return {
      sentSpan: formatSpan(filters.range),
      openCohorts: openSnapshot.cohorts,
      promptCohorts: promptSnapshot.cohorts,
      pushSent: {
        headers: ['Notification type', 'Sent'],
        rows: Array.map(PUSH_TYPES, ([label, sendTaskType]) => [
          label,
          formatValue.count(
            countOrNull(
              sumValues(data.sent, (value) => value.key === sendTaskType)
            )
          ),
        ]),
      },
      opens: {
        headers: [
          'Category',
          'Opens',
          '→ Offer opened',
          '→ Offer created',
          '→ Request sent',
          '→ Chat opened',
        ],
        rows: Array.map(OPEN_CATEGORIES, ([label, category, {opensChat}]) => {
          const opened = (
            action: (state: NotificationOpenState) => boolean
          ): number =>
            opensWhere((state) => state.category === category && action(state))
          return shareRow(
            label,
            opened(() => true),
            [
              opened((state) => state.offerOpened === true),
              opened((state) => state.offerCreated === true),
              opened((state) => state.requestSent === true),
              opensChat ? null : opened((state) => state.chatOpened === true),
            ]
          )
        }),
      },
      prompts: {
        headers: [
          'Prompt',
          'Shown',
          'Closed',
          'Tapped',
          'Did it within 7 days',
        ],
        rows: Array.map(PROMPTS, ([label, promptId]) => {
          const shown = (predicate: (state: PromptState) => boolean): number =>
            promptsWhere(
              (state) => state.promptId === promptId && predicate(state)
            )
          return shareRow(
            label,
            shown(() => true),
            [
              shown((state) => state.outcome === 'dismissed'),
              shown((state) => state.outcome === 'tapped'),
              shown((state) => state.targetReached === true),
            ]
          )
        }),
      },
      notificationsAllowed: seriesOf(weekBuckets, (bucket) => {
        const rows = Array.filter(data.weekly, inBucket(bucket))
        return {
          allowed: percentOrNull(
            sumWhere(rows, (row) => row.state.notificationsAllowed === true),
            sumWhere(
              rows,
              (row) => row.state.notificationsAllowed !== undefined
            )
          ),
        }
      }),
    }
  })
