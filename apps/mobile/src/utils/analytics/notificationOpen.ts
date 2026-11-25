import {notificationOpenJourney} from '@vexl-next/analytics-definitions/src/definitions/notificationOpen'
import {analyticsActionAtom} from './analyticsActionAtom'
import {notificationCategoryFromData} from './notificationCategory'
import {reportReactivationNotificationOpenActionAtom} from './reactivation'
import {journeyReportActionAtom} from './report'

export const notificationOpenJourneyAtom = journeyReportActionAtom(
  notificationOpenJourney
)

/** Every open starts its own journey, even while another one runs. */
export const reportNotificationOpenedActionAtom = analyticsActionAtom(
  (get, set, notificationData: unknown) => {
    const category = notificationCategoryFromData(notificationData)
    set(notificationOpenJourneyAtom, {category}, {alwaysStart: true})
    set(reportReactivationNotificationOpenActionAtom, category)
  }
)
