import notifee from '@notifee/react-native'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect} from 'effect'
import * as Notifications from 'expo-notifications'
import * as O from 'fp-ts/Option'
import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {apiAtom} from '../api'
import {loadingOverlayDisplayedAtom} from '../components/LoadingOverlayProvider'
import clearMmkvStorageAndEmptyAtoms from '../utils/clearMmkvStorageAndEmptyAtoms'
import {deleteAllFiles} from '../utils/fsDirectories'
import notEmpty from '../utils/notEmpty'
import {showDebugNotificationIfEnabled} from '../utils/notifications/showDebugNotificationIfEnabled'
import reportError from '../utils/reportError'
import deleteAllInboxesActionAtom from './chat/atoms/deleteAllInboxesActionAtom'
import {deleteOffersActionAtom} from './marketplace/atoms/deleteOffersActionAtom'
import {myOffersAtom} from './marketplace/atoms/myOffers'
import {sessionAtom} from './session'

async function failSilently<T>(promise: Promise<T>): Promise<
  | {success: true; result: T}
  | {
      success: false
      error: unknown
    }
> {
  return await promise
    .then((result) => ({success: true as const, result}))
    .catch((e) => {
      return {success: false as const, error: e as unknown}
    })
}

export const logoutActionAtom = atom(null, async (get, set) => {
  void showDebugNotificationIfEnabled({
    title: 'Logging out',
    subtitle: 'logoutAtom',
    body: 'logging out from logout atom',
  })

  set(loadingOverlayDisplayedAtom, true)
  try {
    // offer service
    await failSilently(
      Effect.runPromise(
        set(deleteOffersActionAtom, {
          adminIds: get(myOffersAtom)
            .map((offer) => offer.ownershipInfo?.adminId)
            .filter(notEmpty),
        })
      )
    )

    // chat service
    await failSilently(set(deleteAllInboxesActionAtom)())

    // contact service
    await failSilently(effectToTaskEither(get(apiAtom).contact.deleteUser())())

    // User service
    await failSilently(effectToTaskEither(get(apiAtom).user.deleteUser())())

    // Notification badge
    await failSilently(notifee.setBadgeCount(0))

    // session
    set(sessionAtom, O.none)

    // Local storage
    clearMmkvStorageAndEmptyAtoms()

    // files
    await failSilently(deleteAllFiles())

    // firebase token
    await failSilently(Notifications.unregisterForNotificationsAsync())
  } catch (e) {
    reportError('error', new Error('Critical error while logging out'), {e})

    set(sessionAtom, O.none)
    clearMmkvStorageAndEmptyAtoms()
    await failSilently(Notifications.unregisterForNotificationsAsync())
  } finally {
    set(loadingOverlayDisplayedAtom, false)
  }
})

export function useLogout(): () => Promise<void> {
  const logout = useSetAtom(logoutActionAtom)

  return useCallback(async () => {
    await logout()
  }, [logout])
}
