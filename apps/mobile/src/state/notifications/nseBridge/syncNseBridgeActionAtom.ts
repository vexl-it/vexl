import {curves} from '@vexl-next/cryptography/src/KeyHolder/Curve.brand'
import {getCurveName} from '@vexl-next/cryptography/src/KeyHolder/keyUtils'
import {Array, Either, Option, pipe, Record} from 'effect'
import {atom} from 'jotai'
import {Platform} from 'react-native'
import {
  clear,
  syncAll,
  type NseInboxKeyEntry,
  type NseSenderNameEntry,
  type NseSyncPayload,
} from '../../../../modules/vexl-nse-bridge'
import {apiEnv} from '../../../api'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import messagingStateAtom from '../../chat/atoms/messagingStateAtom'
import {getOtherSideData} from '../../chat/atoms/selectOtherSideDataAtom'
import {sessionAtom} from '../../session'
import {vexlTokenToKeyHolderAtom} from '../vexlTokenToKeyHolderAtom'

/**
 * JSON snapshot of the last successfully synced payload. Used to
 * short-circuit repeated syncs when nothing relevant changed.
 */
const lastSyncedPayloadJsonAtom = atom<string | undefined>(undefined)

/**
 * Sentinel snapshot marking "bridge storage cleared". Never collides with a
 * real payload snapshot (those are JSON objects).
 */
const CLEARED_SNAPSHOT = 'cleared'

/**
 * Assembles everything the iOS notification service extension needs to
 * render rich chat notification previews and hands it to the vexl-nse-bridge
 * local module, which mirrors it into the shared keychain access group and
 * the App Group container.
 *
 * Additive one-way sync - MMKV state stays the single source of truth. Any
 * failure is reported and swallowed; the NSE falls back to the generic
 * notification content when its copy is missing or stale.
 */
export const syncNseBridgeActionAtom = atom(
  null,
  async (get, set): Promise<void> => {
    if (Platform.OS !== 'ios') return

    const session = get(sessionAtom)

    // iOS keychain items survive app uninstall. If the app starts without a
    // session (fresh install / after account wipe), purge whatever a previous
    // install may have left in the shared access group so inbox private keys
    // never outlive the account. Logout additionally wipes the bridge storage
    // explicitly (see useLogout).
    if (session.state === 'loggedOut') {
      if (get(lastSyncedPayloadJsonAtom) === CLEARED_SNAPSHOT) return
      set(lastSyncedPayloadJsonAtom, CLEARED_SNAPSHOT)
      try {
        await clear()
      } catch (error) {
        // Allow a retry on the next trigger.
        set(lastSyncedPayloadJsonAtom, undefined)
        reportError('warn', new Error('Failed to clear NSE bridge data'), {
          error,
        })
      }
      return
    }

    // Session still loading - nothing to do yet.
    if (session.state !== 'loggedIn') return

    // The NSE only supports secp256k1 inbox keys - keys on other curves are
    // not synced (the extension shows the generic content for them).
    const keys: NseInboxKeyEntry[] = pipe(
      Record.toEntries(get(vexlTokenToKeyHolderAtom).data),
      Array.filterMap(([vexlToken, keyHolder]) =>
        pipe(
          Either.try(() => getCurveName(keyHolder.privateKeyPemBase64)),
          Either.getRight,
          Option.filter((curve) => curve === curves.secp256k1),
          Option.map(() => ({
            vexlToken,
            inboxPrivateKeyPemBase64: keyHolder.privateKeyPemBase64,
            inboxPublicKeyPemBase64: keyHolder.publicKeyPemBase64,
          }))
        )
      )
    )

    // Counterparty display names exactly as the app would show them
    // (revealed identity name or the deterministic anonymous name).
    const senderNames: NseSenderNameEntry[] = pipe(
      get(messagingStateAtom),
      Array.flatMap((inboxInState) =>
        pipe(
          inboxInState.chats,
          Array.map((chatWithMessages) => ({
            inboxPublicKey: inboxInState.inbox.privateKey.publicKeyPemBase64,
            senderPublicKey: chatWithMessages.chat.otherSide.publicKey,
            displayName: getOtherSideData(chatWithMessages.chat).userName,
          }))
        )
      )
    )

    // NOTE: session credentials are deliberately NOT mirrored into the
    // bridge storage - the NSE endpoints (createChallenge/retrieveMessages)
    // need no security headers and copying auth secrets into the shared
    // keychain would only enlarge the leak surface (data minimization).
    const {t} = get(translationAtom)

    const payload: NseSyncPayload = {
      keys,
      metadata: {
        chatServiceUrl: apiEnv.chatMs,
        notificationServiceUrl: apiEnv.notificationMs,
        locale: t('localeName'),
        senderNames,
      },
    }

    const payloadJson = JSON.stringify(payload)
    if (get(lastSyncedPayloadJsonAtom) === payloadJson) return
    set(lastSyncedPayloadJsonAtom, payloadJson)

    try {
      await syncAll(payload)
    } catch (error) {
      // Allow a retry on the next trigger.
      set(lastSyncedPayloadJsonAtom, undefined)
      reportError('warn', new Error('Failed to sync NSE bridge data'), {error})
    }
  }
)
