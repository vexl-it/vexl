import {type AfterOpenAction} from '@vexl-next/analytics-definitions/src/buckets'
import {type NotificationOpenState} from '@vexl-next/analytics-definitions/src/definitions/notificationOpen'
import {Option} from 'effect'
import {useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {analyticsActionAtom} from './analyticsActionAtom'
import {notificationOpenJourneyAtom} from './notificationOpen'
import {reactivationJourneyAtom} from './reactivation'

const notificationOpenField: Record<
  AfterOpenAction,
  Partial<NotificationOpenState>
> = {
  offerOpened: {offerOpened: true},
  offerCreated: {offerCreated: true},
  requestSent: {requestSent: true},
  chatOpened: {chatOpened: true},
}

/** What the user did after opening a notification or returning to the app. */
export const reportAfterOpenActionAtom = analyticsActionAtom(
  (get, set, action: AfterOpenAction) => {
    set(notificationOpenJourneyAtom, notificationOpenField[action], {
      onlyIfOpen: true,
    })
    set(
      reactivationJourneyAtom,
      (current) =>
        Option.exists(current, (state) => state.firstAction !== undefined)
          ? {}
          : {firstAction: action},
      {onlyIfOpen: true}
    )
  }
)

export function useReportChatOpened(): void {
  const reportAfterOpen = useSetAtom(reportAfterOpenActionAtom)
  useEffect(() => {
    reportAfterOpen('chatOpened')
  }, [reportAfterOpen])
}
