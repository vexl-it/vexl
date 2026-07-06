/**
 * Local Expo module (iOS only) that mirrors the data the notification
 * service extension (targets/vexl-nse) needs into shared storage:
 *
 * - vexl-token -> inbox-private-key entries go into the shared keychain
 *   access group (kSecAttrAccessibleAfterFirstUnlock so the NSE can read
 *   them while the device is locked),
 * - non-secret metadata (sender display names, service URLs, locale) goes
 *   into an atomically-replaced JSON file in the App Group container.
 *
 * `syncAll` has declarative replace-all semantics (idempotent). `clear`
 * wipes everything the bridge ever wrote. Both are no-ops on Android and in
 * environments where the native module is unavailable (tests, old builds).
 */
import {requireOptionalNativeModule} from 'expo'
import {Platform} from 'react-native'

export interface NseInboxKeyEntry {
  vexlToken: string
  inboxPrivateKeyPemBase64: string
  inboxPublicKeyPemBase64: string
}

export interface NseSenderNameEntry {
  inboxPublicKey: string
  senderPublicKey: string
  displayName: string
}

export interface NseMetadata {
  chatServiceUrl: string
  notificationServiceUrl?: string
  locale: string
  senderNames: NseSenderNameEntry[]
}

export interface NseSyncPayload {
  keys: NseInboxKeyEntry[]
  metadata: NseMetadata
}

interface VexlNseBridgeNativeModule {
  syncAll: (payload: NseSyncPayload) => Promise<void>
  clear: () => Promise<void>
}

const nativeModule =
  Platform.OS === 'ios'
    ? requireOptionalNativeModule<VexlNseBridgeNativeModule>('VexlNseBridge')
    : null

export async function syncAll(payload: NseSyncPayload): Promise<void> {
  if (!nativeModule) return
  await nativeModule.syncAll(payload)
}

export async function clear(): Promise<void> {
  if (!nativeModule) return
  await nativeModule.clear()
}
