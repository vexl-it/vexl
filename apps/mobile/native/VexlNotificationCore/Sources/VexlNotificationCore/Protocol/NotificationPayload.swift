import Foundation

/// The subset of `NewChatMessageNoticeNotificationData`
/// (packages/domain/src/general/notifications/index.ts) the NSE needs.
public struct ChatNotificationPayload: Equatable, Sendable {
  public let targetToken: String
  /// Unix milliseconds when the notification was issued (server clock). Used
  /// to pick the message THIS push is about instead of the globally newest
  /// one. Optional: missing/malformed values degrade to newest-message
  /// selection, never to a bail.
  public let sentAt: Int64?

  public init(targetToken: String, sentAt: Int64? = nil) {
    self.targetToken = targetToken
    self.sentAt = sentAt
  }
}

public enum NotificationPayloadParser {
  static let expectedTag = "NewChatMessageNoticeNotificationData"
  static let vexlTokenPrefix = "vexl_nt_"

  /// Extracts the chat-notification data from APNs `userInfo` as delivered by
  /// Expo, mirroring
  /// apps/mobile/src/utils/notifications/notificationReceivedHandler/extractDataFromNotification.ts:
  /// - the custom data dict lives under `userInfo["body"]`
  /// - if `body.dataString` is a JSON-object string it takes precedence,
  ///   otherwise `body` itself (minus `dataString`) is used
  ///
  /// Returns nil whenever the notification cannot be enriched (missing/legacy
  /// data, `targetCypher`-only payloads, wrong tag, malformed token) - the
  /// caller must then deliver the original generic content.
  public static func parse(userInfo: [AnyHashable: Any]) -> ChatNotificationPayload? {
    guard let body = userInfo["body"] as? [String: Any] else { return nil }
    let data = dataStringOrNotificationData(body)

    guard let tag = data["_tag"] as? String, tag == expectedTag else { return nil }

    // Design decision 1: only vexl_nt_ targetToken payloads are supported;
    // legacy targetCypher-only payloads bail to generic content.
    guard let targetToken = data["targetToken"] as? String,
          targetToken.hasPrefix(vexlTokenPrefix)
    else {
      return nil
    }

    return ChatNotificationPayload(
      targetToken: targetToken,
      sentAt: parseSentAt(data["sentAt"])
    )
  }

  /// `sentAt` is a NumberFromString on the wire (Expo push data records are
  /// all-strings), but accept a plain number too. Never fails the parse.
  static func parseSentAt(_ value: Any?) -> Int64? {
    if let string = value as? String { return Int64(string) }
    if let number = value as? NSNumber {
      // JSON booleans are NSNumbers too - they are not timestamps.
      if CFGetTypeID(number) == CFBooleanGetTypeID() { return nil }
      return number.int64Value
    }
    return nil
  }

  static func dataStringOrNotificationData(_ body: [String: Any]) -> [String: Any] {
    var withoutDataString = body
    withoutDataString.removeValue(forKey: "dataString")

    guard let dataString = body["dataString"] as? String else { return withoutDataString }

    guard let parsedData = try? JSONSerialization.jsonObject(with: Data(dataString.utf8)),
          let parsedObject = parsedData as? [String: Any]
    else {
      return withoutDataString
    }
    return parsedObject
  }
}
