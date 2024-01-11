import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import * as O from 'fp-ts/Option'
import messaging from '@react-native-firebase/messaging'
import {sessionAtom} from './session'
import {deleteOffersActionAtom} from './marketplace'
import {myOffersAtom} from './marketplace/atoms/myOffers'
import notEmpty from '../utils/notEmpty'
import clearMmkvStorageAndEmptyAtoms from '../utils/clearMmkvStorageAndEmptyAtoms'
import {privateApiAtom} from '../api'
import deleteAllInboxesActionAtom from './chat/atoms/deleteAllInboxesActionAtom'
import reportError from '../utils/reportError'
import {loadingOverlayDisplayedAtom} from '../components/LoadingOverlayProvider'
import notifee from '@notifee/react-native'
import {deleteAllFiles} from '../utils/fsDirectories'
import {showDebugNotificationIfEnabled} from '../utils/notifications/showDebugNotificationIfEnabled'

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
    body: 'logging out from logout atom',
  })

  set(loadingOverlayDisplayedAtom, true)
  try {
    // offer service
    await failSilently(
      set(deleteOffersActionAtom, {
        adminIds: get(myOffersAtom)
          .map((offer) => offer.ownershipInfo?.adminId)
          .filter(notEmpty),
      })()
    )

    // chat service
    await failSilently(set(deleteAllInboxesActionAtom)())

    // contact service
    await failSilently(get(privateApiAtom).contact.deleteUser()())

    // User service
    await failSilently(get(privateApiAtom).user.deleteUser()())

    // Notification badge
    await failSilently(notifee.setBadgeCount(0))

    // session
    set(sessionAtom, O.none)

    // Local storage
    clearMmkvStorageAndEmptyAtoms()

    // files
    await failSilently(deleteAllFiles())

    // firebase token
    await failSilently(messaging().deleteToken())
  } catch (e) {
    reportError('error', 'Critical error while logging out', e)

    set(sessionAtom, O.none)
    clearMmkvStorageAndEmptyAtoms()
    await failSilently(messaging().deleteToken())
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
