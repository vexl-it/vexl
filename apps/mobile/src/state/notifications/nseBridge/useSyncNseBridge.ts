import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {Platform} from 'react-native'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import messagingStateAtom from '../../chat/atoms/messagingStateAtom'
import {sessionAtom} from '../../session'
import {vexlTokenToKeyHolderAtom} from '../vexlTokenToKeyHolderAtom'
import {syncNseBridgeActionAtom} from './syncNseBridgeActionAtom'

const SYNC_DEBOUNCE_MS = 2_000

/**
 * Keeps the iOS notification service extension's copy of chat-preview data
 * (inbox keys, sender names, service URLs, locale) in sync. Runs on app
 * start and whenever one of the source atoms changes, debounced. When there
 * is no session it instead purges stale bridge storage (keychain items
 * survive app uninstall). The action atom itself deduplicates identical
 * payloads, so extra triggers are cheap. No-op on Android.
 */
export function useSyncNseBridge(): void {
  const syncNseBridge = useSetAtom(syncNseBridgeActionAtom)
  const tokenToKeyHolder = useAtomValue(vexlTokenToKeyHolderAtom)
  const messagingState = useAtomValue(messagingStateAtom)
  const session = useAtomValue(sessionAtom)
  const translation = useAtomValue(translationAtom)

  useEffect(() => {
    if (Platform.OS !== 'ios') return

    const timeout = setTimeout(() => {
      void syncNseBridge()
    }, SYNC_DEBOUNCE_MS)

    return () => {
      clearTimeout(timeout)
    }
  }, [syncNseBridge, tokenToKeyHolder, messagingState, session, translation])
}
