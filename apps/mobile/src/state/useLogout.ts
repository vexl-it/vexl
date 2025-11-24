import notifee from '@notifee/react-native'
import {Array, Effect, Option, pipe, Record} from 'effect'
import * as Notifications from 'expo-notifications'
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
import {clubsToKeyHolderAtom} from './clubs/atom/clubsToKeyHolderAtom'
import {clubsWithMembersAtom} from './clubs/atom/clubsWithMembersAtom'
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

    await failSilently(
      pipe(
        get(clubsWithMembersAtom),
        Array.filterMap((club) =>
          Record.get(get(clubsToKeyHolderAtom), club.club.uuid).pipe(
            Option.map((keyPair) =>
              get(apiAtom)
                .contact.leaveClub({clubUuid: club.club.uuid, keyPair})
                .pipe(Effect.ignore)
            )
          )
        ),
        Effect.all,
        Effect.runPromise
      )
    )

    // chat service
    await failSilently(set(deleteAllInboxesActionAtom)())

    // contact service
    await failSilently(Effect.runPromise(get(apiAtom).contact.deleteUser()))

    // User service
    await failSilently(Effect.runPromise(get(apiAtom).user.deleteUser()))

    // Notification badge
    await failSilently(notifee.setBadgeCount(0))

    // session
    set(sessionAtom, Option.none())

    // Local storage
    clearMmkvStorageAndEmptyAtoms()

    // files
    await failSilently(deleteAllFiles())

    // firebase token
    await failSilently(Notifications.unregisterForNotificationsAsync())
  } catch (e) {
    reportError('error', new Error('Critical error while logging out'), {e})

    set(sessionAtom, Option.none())
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
