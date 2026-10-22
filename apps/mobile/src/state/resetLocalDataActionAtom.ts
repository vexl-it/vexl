import {Effect} from 'effect'
import * as Notifications from 'expo-notifications'
import * as O from 'fp-ts/Option'
import {atom} from 'jotai'
import {clear as clearNseBridge} from '../../modules/vexl-nse-bridge'
import clearMmkvStorageAndEmptyAtoms from '../utils/clearMmkvStorageAndEmptyAtoms'
import {deleteAllFiles} from '../utils/fsDirectories'
import {clearBackgroundNotificationSocketActionAtom} from '../utils/notifications/backgroundNotificationSocket'
import {
  markAccountMovedNoticePending,
  showAccountMovedNoticeIfPendingActionAtom,
} from './accountMovedNotice'
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
  async (_get, set): Promise<void> => {
    await set(resetLocalDataActionAtom)
    markAccountMovedNoticePending()
    await Effect.runPromise(set(showAccountMovedNoticeIfPendingActionAtom))
  }
)
