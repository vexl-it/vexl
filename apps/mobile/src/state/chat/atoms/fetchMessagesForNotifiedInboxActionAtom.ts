import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {getKeyHolderForVexlTokenActionAtom} from '../../notifications/vexlTokenToKeyHolderAtom'
import fetchMessagesForAllInboxesAtom, {
  fetchAndStoreMessagesForInboxHandleNotificationsActionAtom,
} from './fetchNewMessagesActionAtom'

// A token the old device minted after the backup was exported has no local
// mapping on a restored device, so all inboxes are checked instead.
export const fetchMessagesForNotifiedInboxActionAtom = atom(
  null,
  (_, set, token: VexlNotificationToken): Effect.Effect<void> => {
    const keyHolder = set(getKeyHolderForVexlTokenActionAtom, token)
    if (!keyHolder) {
      console.info('Unknown notification target, fetching all inboxes')
      return Effect.asVoid(set(fetchMessagesForAllInboxesAtom))
    }

    return Effect.asVoid(
      set(fetchAndStoreMessagesForInboxHandleNotificationsActionAtom, {
        key: keyHolder.publicKeyPemBase64,
      })
    )
  }
)
