import reportError from '../reportError'
import {getDefaultStore} from 'jotai'
import {userLoggedInAtom} from '../../state/session'
import {notificationPreferencesAtom} from '../preferences'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {offersAtomWithFilter} from '../../state/marketplace/atom'
import notifee from '@notifee/react-native'
import {type TFunction, translationAtom} from '../localization/I18nProvider'
import {getDefaultChannel} from '../notifications/showUINotificationFromRemoteMessage'
import {NEW_OFFERS_IN_MARKETPLACE} from '../notifications/notificationTypes'
import {offersFilterFromStorageAtom} from '../../state/offersFilter'
import {triggerOffersRefreshAtom} from '../../state/marketplace'
import {difference} from 'set-operations'
import {
  UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {storage} from '../fpMmkv'
import {safeParse} from '../fpUtils'
import {getLastTimeAppWasRunning} from '../lastTimeAppWasRunning'

const LAST_NEW_OFFERS_NOTIFICATION_KEY = 'lastNewOffersNotification'

export function setLastNewOffersNotificationIssuedNow(): void {
  const now = unixMillisecondsNow()
  storage.set(LAST_NEW_OFFERS_NOTIFICATION_KEY)(now.toString())
}

const CHECK_INTERVAL_TIME_MILLIS = 1000 * 60 * 60 * 24 * 7 // 1 week
const NOTIFICATION_MINIMAL_INTERVAL_MILLIS = 1000 * 60 * 60 * 24 * 7 // 1 WEEK

export function getLastNewOffersNotificationIssuedAt(): UnixMilliseconds {
  return pipe(
    localStorage.get(LAST_NEW_OFFERS_NOTIFICATION_KEY),
    E.chain(safeParse(UnixMilliseconds)),
    E.getOrElse(() => UnixMilliseconds0)
  )
}

async function displayNotification(t: TFunction): Promise<void> {
  if (
    getLastNewOffersNotificationIssuedAt() +
      NOTIFICATION_MINIMAL_INTERVAL_MILLIS >
    unixMillisecondsNow()
  ) {
    return // do not display notification if it was displayed recently
  }
  setLastNewOffersNotificationIssuedNow()

  await notifee.displayNotification({
    title: t('notifications.NEW_OFFERS_IN_MARKETPLACE.title'),
    body: t('notifications.NEW_OFFERS_IN_MARKETPLACE.body'),
    data: {
      type: NEW_OFFERS_IN_MARKETPLACE,
    },
    android: {
      channelId: await getDefaultChannel(),
    },
  })
}

export default async function checkForNewOffers(): Promise<void> {
  try {
    const store = getDefaultStore()
    const {t} = store.get(translationAtom)
    // check if user is logged in & preferences
    if (
      getLastTimeAppWasRunning() + CHECK_INTERVAL_TIME_MILLIS >
        unixMillisecondsNow() ||
      !store.get(userLoggedInAtom) ||
      !store.get(notificationPreferencesAtom).newOfferInMarketplace
    )
      return

    const previousOffersIds = store
      .get(offersAtomWithFilter(store.get(offersFilterFromStorageAtom)))
      .map((one) => one.offerInfo.offerId)

    await store.set(triggerOffersRefreshAtom)
    const updatedOffersIds = store
      .get(offersAtomWithFilter(store.get(offersFilterFromStorageAtom)))
      .map((one) => one.offerInfo.offerId)

    if (difference(updatedOffersIds, previousOffersIds).length > 0) {
      await displayNotification(t)
    }
  } catch (e) {
    reportError('error', 'Error while checking new offers in background', e)
  }
}
