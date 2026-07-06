import Foundation

/// Message types the NSE may render a preview for. Everything else (system /
/// bookkeeping messages, unknown future types) bails to generic content.
/// Mirrors the client-side notification rules in
/// apps/mobile/src/utils/notifications/chatNotifications.ts.
///
/// Keep in sync with scripts/generateNotificationLocalizations.mjs.
public enum RenderableMessageType: String, CaseIterable, Sendable {
  case message = "MESSAGE"
  case requestReveal = "REQUEST_REVEAL"
  case approveReveal = "APPROVE_REVEAL"
  case disapproveReveal = "DISAPPROVE_REVEAL"
  case requestMessaging = "REQUEST_MESSAGING"
  case approveMessaging = "APPROVE_MESSAGING"
  case disapproveMessaging = "DISAPPROVE_MESSAGING"
  case cancelRequestMessaging = "CANCEL_REQUEST_MESSAGING"
  case deleteChat = "DELETE_CHAT"
  case blockChat = "BLOCK_CHAT"
  case inboxDeleted = "INBOX_DELETED"
  case approveContactReveal = "APPROVE_CONTACT_REVEAL"
  case disapproveContactReveal = "DISAPPROVE_CONTACT_REVEAL"
  case requestContactReveal = "REQUEST_CONTACT_REVEAL"
  case tradeChecklistUpdate = "TRADE_CHECKLIST_UPDATE"
}

/// The fields of the decrypted `ChatMessagePayload` JSON
/// (packages/domain/src/general/messaging.ts) the NSE needs. Unknown fields
/// are ignored; the NSE must never surface anything beyond the sender name
/// and the message text.
public struct DecryptedChatMessage: Equatable, Sendable {
  public let uuid: String
  /// Unix milliseconds.
  public let time: Int64
  /// Raw wire value; may be an unknown future type.
  public let messageTypeRaw: String
  public let text: String?
  public let minimalRequiredVersion: String?

  public var renderableType: RenderableMessageType? {
    RenderableMessageType(rawValue: messageTypeRaw)
  }

  public init(
    uuid: String,
    time: Int64,
    messageTypeRaw: String,
    text: String?,
    minimalRequiredVersion: String?
  ) {
    self.uuid = uuid
    self.time = time
    self.messageTypeRaw = messageTypeRaw
    self.text = text
    self.minimalRequiredVersion = minimalRequiredVersion
  }

  /// Parses the decrypted plaintext JSON. Returns nil on any malformed input.
  public static func parse(plaintextJson: String) -> DecryptedChatMessage? {
    guard let object = try? JSONSerialization.jsonObject(with: Data(plaintextJson.utf8)),
          let dictionary = object as? [String: Any],
          let uuid = dictionary["uuid"] as? String,
          let messageType = dictionary["messageType"] as? String
    else {
      return nil
    }

    let time: Int64
    if let intTime = dictionary["time"] as? Int64 {
      time = intTime
    } else if let doubleTime = dictionary["time"] as? Double {
      time = Int64(doubleTime)
    } else {
      return nil
    }

    return DecryptedChatMessage(
      uuid: uuid,
      time: time,
      messageTypeRaw: messageType,
      text: dictionary["text"] as? String,
      minimalRequiredVersion: dictionary["minimalRequiredVersion"] as? String
    )
  }

  /// Mirrors `ensureCompatibleVersion` in parseChatMessage.ts: if
  /// `minimalRequiredVersion` is present and semver-greater than the running
  /// app version, the message must not be previewed (the JS app converts it
  /// to a REQUIRES_NEWER_VERSION pseudo-message, which is never notified).
  public func isPreviewable(appSemver: String?) -> Bool {
    guard renderableType != nil else { return false }
    guard let minimalRequiredVersion else { return true }
    guard let appSemver,
          let required = Semver(minimalRequiredVersion),
          let current = Semver(appSemver)
    else {
      // Unknown app version or unparseable constraint: bail rather than risk
      // rendering a message the app version cannot handle.
      return false
    }
    return required <= current
  }
}

/// Minimal semver ("major.minor.patch") - just enough for the
/// `minimalRequiredVersion` gate.
public struct Semver: Comparable, Equatable, Sendable {
  public let major: Int
  public let minor: Int
  public let patch: Int

  public init?(_ string: String) {
    let components = string.split(separator: ".", omittingEmptySubsequences: false)
    guard components.count == 3,
          let major = Int(components[0]),
          let minor = Int(components[1]),
          let patch = Int(components[2]),
          major >= 0, minor >= 0, patch >= 0
    else {
      return nil
    }
    self.major = major
    self.minor = minor
    self.patch = patch
  }

  public static func < (lhs: Semver, rhs: Semver) -> Bool {
    if lhs.major != rhs.major { return lhs.major < rhs.major }
    if lhs.minor != rhs.minor { return lhs.minor < rhs.minor }
    return lhs.patch < rhs.patch
  }
}
