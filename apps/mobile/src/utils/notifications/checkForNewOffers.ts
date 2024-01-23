import notifee from '@notifee/react-native'
import {
  UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {getDefaultStore} from 'jotai'
import {difference} from 'set-operations'
import {triggerOffersRefreshAtom} from '../../state/marketplace'
import {createFilteredOffersAtom} from '../../state/marketplace/atoms/filteredOffers'
import {offersFilterFromStorageAtom} from '../../state/marketplace/filterAtoms'
import {sessionHolderAtom, userLoggedInAtom} from '../../state/session'
import {loadSession} from '../../state/session/loadSession'
import {storage} from '../fpMmkv'
import {getLastTimeAppWasRunning} from '../lastTimeAppWasRunning'
import {translationAtom, type TFunction} from '../localization/I18nProvider'
import {notificationPreferencesAtom, preferencesAtom} from '../preferences'
import reportError from '../reportError'
import {getDefaultChannel} from './notificationChannels'
import {NEW_OFFERS_IN_MARKETPLACE} from './notificationTypes'
import {showDebugNotificationIfEnabled} from './showDebugNotificationIfEnabled'

const LAST_NEW_OFFERS_NOTIFICATION_KEY = 'lastNewOffersNotification'
const INTERVALS = {
  checkAfterInactivity: 1000 * 60 * 60 * 24 * 7, // 1 week
  minimalNotificationInterval: 1000 * 60 * 60 * 24 * 7, // 1 week
} as const

const INTERVALS_DEBUG = {
  // 5 hours
  checkAfterInactivity: 0,
  minimalNotificationInterval: 0,
} as const

function getIntervalValues(): typeof INTERVALS {
  return getDefaultStore().get(preferencesAtom)
    .enableNewOffersNotificationDevMode
    ? INTERVALS_DEBUG
    : INTERVALS
}

export function setLastNewOffersNotificationIssuedNow(): void {
  const now = unixMillisecondsNow()
  storage.set(LAST_NEW_OFFERS_NOTIFICATION_KEY)(now.toString())
}

export function getLastNewOffersNotificationIssuedAt(): UnixMilliseconds {
  return pipe(
    storage.getVerified(LAST_NEW_OFFERS_NOTIFICATION_KEY, UnixMilliseconds),
    E.getOrElse(() => UnixMilliseconds0)
  )
}

async function displayNotification(t: TFunction): Promise<void> {
  if (
    getLastNewOffersNotificationIssuedAt() +
      getIntervalValues().minimalNotificationInterval >
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
      pressAction: {
        id: 'default',
      },
    },
  })
}

export default async function checkForNewOffers(): Promise<void> {
  try {
    const store = getDefaultStore()
    const {t} = store.get(translationAtom)
    // check if user is logged in & preferences

    if (!(await loadSession())) {
      console.info('Session not loaded. Skipping check for new offers')
      return
    }

    const appWasInnactiveForLongTime =
      getLastTimeAppWasRunning() + getIntervalValues().checkAfterInactivity >
      unixMillisecondsNow()
    const userIsLoggedIn = store.get(userLoggedInAtom) // get logged in state is ready
    const newOffersInMarketpacePreference = store.get(
      notificationPreferencesAtom
    ).newOfferInMarketplace

    if (
      appWasInnactiveForLongTime ||
      !userIsLoggedIn ||
      !newOffersInMarketpacePreference
    ) {
      console.debug('Checking for new offers skipped. Reason: first condition')
      void showDebugNotificationIfEnabled({
        title: 'Not showing new offers notification',
        body: JSON.stringify({
          session: store.get(sessionHolderAtom).state,
          innactive: appWasInnactiveForLongTime,
          loggedIn: userIsLoggedIn,
          preference: newOffersInMarketpacePreference,
        }),
      })
      return
    }

    const previousOffersIds = store
      .get(createFilteredOffersAtom(store.get(offersFilterFromStorageAtom)))
      .map((one) => one.offerInfo.offerId)

    await store.set(triggerOffersRefreshAtom)
    const updatedOffersIds = store
      .get(createFilteredOffersAtom(store.get(offersFilterFromStorageAtom)))
      .map((one) => one.offerInfo.offerId)

    if (difference(updatedOffersIds, previousOffersIds).length > 0) {
      void showDebugNotificationIfEnabled({
        title: 'Showing first offer notification',
        body: 'SHowing new offers notification',
      })
      console.debug('New offers found. Displaying notification')
      await displayNotification(t)
    } else {
      void showDebugNotificationIfEnabled({
        title: 'Not showing new offers notification',
        body: 'No new offers',
      })
      console.debug('No new offers found')
    }
  } catch (e) {
    void showDebugNotificationIfEnabled({
      title: 'Error while checking new offers in background',
      body: `e ${(e as Error).message ?? '[no error message ]'}`,
    })
    reportError(
      'error',
      new Error('Error while checking new offers in background'),
      {e}
    )
  }
}
