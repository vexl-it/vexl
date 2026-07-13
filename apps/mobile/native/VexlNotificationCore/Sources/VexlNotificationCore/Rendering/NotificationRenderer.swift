import Foundation

/// Everything the NSE needs to replace the generic notification content.
/// Deliberately contains nothing beyond the sender display name, the message
/// text (or a localized generic string) and grouping/marker metadata.
public struct RenderedNotification: Equatable, Sendable {
  public let title: String
  public let body: String
  public let threadIdentifier: String
  /// Wire message type, for the JS dismiss-parity userInfo field.
  public let messageType: String
  public let inboxPublicKey: String
  public let senderPublicKey: String
}

public enum NotificationRenderer {
  /// Renders the preview for a decrypted message, mirroring
  /// apps/mobile/src/utils/notifications/chatNotifications.ts:
  /// - MESSAGE: title = display name (fallback localized title), body = text
  ///   (fallback localized body)
  /// - other renderable types: localized title/body with `{{them}}`
  ///   interpolation (empty string when the name is unknown)
  /// - threadIdentifier: "request-group-id" for REQUEST_MESSAGING, else
  ///   base64(SHA256(utf8(inboxPem + senderPem)))
  ///
  /// Returns nil for non-renderable types or when localization is missing.
  public static func render(
    message: DecryptedChatMessage,
    inboxPublicKey: String,
    senderPublicKey: String,
    displayName: String?,
    locale: String,
    localization: NotificationLocalization
  ) -> RenderedNotification? {
    guard let type = message.renderableType else { return nil }
    guard let localized = localization.entry(for: type, locale: locale) else { return nil }

    let them = displayName ?? ""

    let title: String
    let body: String
    if type == .message {
      title = displayName ?? interpolateThem(localized.title, them: them)
      // Empty or whitespace-only text carries no preview, so fall back to the
      // localized generic body rather than render a blank notification. The
      // text comes from decrypted, externally-controlled ciphertext, so an
      // empty string is reachable.
      let hasPreviewText =
        message.text?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
      body = (hasPreviewText ? message.text : nil) ?? interpolateThem(localized.body, them: them)
    } else {
      title = interpolateThem(localized.title, them: them)
      body = interpolateThem(localized.body, them: them)
    }

    let threadIdentifier: String =
      type == .requestMessaging
        ? NseBridgeConstants.requestMessagingThreadIdentifier
        : sha256Base64(inboxPublicKey + senderPublicKey)

    return RenderedNotification(
      title: title,
      body: body,
      threadIdentifier: threadIdentifier,
      messageType: message.messageTypeRaw,
      inboxPublicKey: inboxPublicKey,
      senderPublicKey: senderPublicKey
    )
  }
}
