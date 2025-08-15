import notifee from '@notifee/react-native'
import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Array, Effect, flow, Option, Schema} from 'effect/index'
import {useStore} from 'jotai'
import {useCallback} from 'react'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorageE} from '../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {reportErrorE} from '../../utils/reportError'
import {useOnFocusAndAppState} from '../../utils/useFocusAndAppState'

const THIRTY_MINS_MS = 30 * 60 * 1000

const reportedNotificationsIdsAtom = atomWithParsedMmkvStorageE(
  'reportedUINotificationsIds',
  [],
  Schema.Array(Schema.String)
)

export function useReportUIChatNotifications(): void {
  const store = useStore()
  useOnFocusAndAppState(
    useCallback(() => {
      const reportedNotificationsIds = store.get(reportedNotificationsIdsAtom)
      Effect.promise(() => notifee.getDisplayedNotifications()).pipe(
        Effect.map(
          flow(
            Array.filter((one): one is typeof one & {id: string} => !!one.id),
            Array.filterMap(({notification, id}) =>
              Schema.decodeUnknownOption(NewChatMessageNoticeNotificationData)(
                notification
              ).pipe(Option.map((data) => ({data, id})))
            )
          )
        ),
        Effect.tap((notifications) =>
          Effect.sync(() => {
            store.set(
              reportedNotificationsIdsAtom,
              notifications.map((one) => one.id)
            )
          })
        ),
        // Now get notifications to report
        Effect.map(
          Array.filter(
            (one) =>
              // Report only notifications that were not already seen
              !Array.contains(one.id)(reportedNotificationsIds) &&
              // And notifications only older than 30mins
              unixMillisecondsNow() - one.data.sentAt >= THIRTY_MINS_MS
          )
        ),
        Effect.tap((toReport) =>
          Effect.log(`Reporting ${toReport.length} notifications`)
        ),
        Effect.flatMap((toReport) => {
          // Don't report if there is nothing to report
          if (toReport.length === 0) return Effect.void
          return store.get(apiAtom).metrics.reportNotificationInteraction({
            count: toReport.length,
            notificationType: 'Chat',
            type: 'UINotificationReceived',
            uuid: generateUuid(),
          })
        }),
        Effect.tapError((e) =>
          reportErrorE('warn', new Error('Error reporting UI notifications'), {
            e,
          })
        ),
        Effect.runFork
      )
    }, [store])
  )
}
