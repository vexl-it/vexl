import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {Array, Option, pipe, Schema} from 'effect'
import {
  dismissNotificationAsync,
  getPresentedNotificationsAsync,
  setNotificationCategoryAsync,
  type Notification,
} from 'expo-notifications'
import {useEffect} from 'react'
import {Platform} from 'react-native'
import {useTranslation} from '../localization/I18nProvider'
import reportError from '../reportError'

/**
 * JS-side glue for notifications enriched by the iOS notification service
 * extension (apps/mobile/targets/vexl-nse + native/VexlNotificationCore).
 *
 * The NSE marks every enriched notification with `vexlNseEnriched: 'true'`
 * plus `inbox` / `sender` / `type` in its data payload (decision 7 - see
 * NotificationContentApplier.swift). Keep the field names in sync.
 */

// Must match NseBridgeConstants.notificationCategoryIdentifier in
// native/VexlNotificationCore (pinned by its BridgeContractTests).
export const NSE_CHAT_PREVIEW_CATEGORY = 'vexl-chat-preview'

const NseEnrichedNotificationData = Schema.Struct({
  vexlNseEnriched: Schema.Literal('true'),
})

const NseEnrichedChatNotificationData = Schema.Struct({
  vexlNseEnriched: Schema.Literal('true'),
  inbox: Schema.String,
  sender: Schema.String,
})

export const isNseEnrichedNotification = (n: Notification): boolean =>
  Option.isSome(
    Schema.decodeUnknownOption(NseEnrichedNotificationData)(
      n.request.content.data
    )
  )

/**
 * Dismisses presented NSE-enriched notifications for one conversation. Called
 * right before the JS side shows its own (richer, per-message) local
 * notification for that conversation, so the user never sees the same
 * message twice (the enriched remote + the JS local one).
 */
export async function dismissNseEnrichedNotificationsForChat({
  inbox,
  sender,
}: {
  inbox: PublicKeyPemBase64
  sender: PublicKeyPemBase64
}): Promise<void> {
  if (Platform.OS !== 'ios') return

  const presentedNotifications = await getPresentedNotificationsAsync()
  await Promise.all(
    pipe(
      presentedNotifications,
      Array.filter((notification) =>
        pipe(
          Schema.decodeUnknownOption(NseEnrichedChatNotificationData)(
            notification.request.content.data
          ),
          Option.exists(
            (data) => data.inbox === inbox && data.sender === sender
          )
        )
      ),
      Array.map(async (notification) => {
        await dismissNotificationAsync(notification.request.identifier)
      })
    )
  )
}

/**
 * Registers the notification category the NSE assigns to enriched
 * notifications so iOS shows a sensible placeholder instead of the message
 * text when the system "Show Previews" setting hides previews (decision 8).
 */
export function useRegisterNseChatPreviewCategory(): void {
  const {t} = useTranslation()

  useEffect(() => {
    if (Platform.OS !== 'ios') return

    setNotificationCategoryAsync(NSE_CHAT_PREVIEW_CATEGORY, [], {
      previewPlaceholder: t('notifications.MESSAGE.title'),
    }).catch((error: unknown) => {
      reportError(
        'warn',
        new Error('Failed to register NSE chat preview notification category'),
        {error}
      )
    })
  }, [t])
}
