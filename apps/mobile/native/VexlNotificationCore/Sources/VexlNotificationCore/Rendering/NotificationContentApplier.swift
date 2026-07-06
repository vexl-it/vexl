import Foundation
import UserNotifications

extension RenderedNotification {
  /// Applies the enriched preview to a mutable notification content:
  /// title/body/thread/category plus the userInfo marker fields.
  ///
  /// The marker fields go into `userInfo["body"]` (what expo-notifications
  /// surfaces as `content.data` on iOS) AND into its `dataString` JSON when
  /// present, because `extractDataFromNotification.ts` prefers `dataString`:
  /// - `vexlNseEnriched: "true"` - the JS cancel logic must skip these
  ///   (decision 7); only un-enriched generic notifications get cancelled.
  /// - `inbox` / `sender` / `type` - dismiss-parity with the JS-local
  ///   notifications matched via `ChatNotificationData`.
  public func apply(to content: UNMutableNotificationContent) {
    content.title = title
    content.body = body
    content.threadIdentifier = threadIdentifier
    content.categoryIdentifier = NseBridgeConstants.notificationCategoryIdentifier
    content.userInfo = Self.markUserInfoEnriched(
      content.userInfo,
      inbox: inboxPublicKey,
      sender: senderPublicKey,
      messageType: messageType
    )
  }

  static func markUserInfoEnriched(
    _ userInfo: [AnyHashable: Any],
    inbox: String,
    sender: String,
    messageType: String
  ) -> [AnyHashable: Any] {
    let markerFields: [String: String] = [
      NseBridgeConstants.enrichedUserInfoKey: NseBridgeConstants.enrichedUserInfoValue,
      "inbox": inbox,
      "sender": sender,
      "type": messageType,
    ]

    var updated = userInfo
    var body = (userInfo["body"] as? [String: Any]) ?? [:]

    for (key, value) in markerFields {
      body[key] = value
    }

    if let dataString = body["dataString"] as? String,
       let parsed = try? JSONSerialization.jsonObject(with: Data(dataString.utf8)),
       var dataObject = parsed as? [String: Any] {
      for (key, value) in markerFields {
        dataObject[key] = value
      }
      if let serialized = try? JSONSerialization.data(withJSONObject: dataObject),
         let serializedString = String(data: serialized, encoding: .utf8) {
        body["dataString"] = serializedString
      }
    }

    updated["body"] = body
    return updated
  }
}
