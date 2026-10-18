import {Effect} from 'effect'
import * as Notifications from 'expo-notifications'
import * as O from 'fp-ts/Option'
import {atom} from 'jotai'
import {clear as clearNseBridge} from '../../modules/vexl-nse-bridge'
import {globalDialogAtom} from '../components/GlobalDialog'
import clearMmkvStorageAndEmptyAtoms from '../utils/clearMmkvStorageAndEmptyAtoms'
import {deleteAllFiles} from '../utils/fsDirectories'
import {translationAtom} from '../utils/localization/I18nProvider'
import {clearBackgroundNotificationSocketActionAtom} from '../utils/notifications/backgroundNotificationSocket'
import {selectedChatTagFiltersAtom} from './chatTags/atoms'
import {clearPersistentDataAboutReachAndImportedContactsActionAtom} from './connections/atom/reachNumberWithoutClubsConnectionsMmkvAtom'
import {sessionAtom} from './session'

async function ignoreFailure(promise: Promise<unknown>): Promise<void> {
  await promise.catch(() => undefined)
}

/**
 * Removes all Vexl data from this device without calling any Vexl server.
 */
export const resetLocalDataActionAtom = atom(
  null,
  async (_get, set): Promise<void> => {
    set(selectedChatTagFiltersAtom, new Set())
    set(clearPersistentDataAboutReachAndImportedContactsActionAtom)

    await ignoreFailure(set(clearBackgroundNotificationSocketActionAtom))
    await ignoreFailure(Notifications.setBadgeCountAsync(0))

    set(sessionAtom, O.none)

    // NSE bridge (inbox keys + metadata shared with the iOS notification
    // service extension)
    await ignoreFailure(clearNseBridge())
    await clearMmkvStorageAndEmptyAtoms()
    await ignoreFailure(deleteAllFiles())
    await ignoreFailure(Notifications.unregisterForNotificationsAsync())
  }
)

/**
 * The account was restored on another device. Server data now belongs to that
 * device, so only this device is cleared.
 */
export const clearDeviceAfterLoginOnAnotherDeviceActionAtom = atom(
  null,
  async (get, set): Promise<void> => {
    await set(resetLocalDataActionAtom)

    const {t} = get(translationAtom)
    await Effect.runPromise(
      set(globalDialogAtom, {
        title: t('loggedInOnAnotherDevice.title'),
        subtitle: t('loggedInOnAnotherDevice.text'),
        positiveButtonText: t('common.gotIt'),
      }).pipe(Effect.ignore)
    )
  }
)
