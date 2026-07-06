import Foundation

/// Precomputed display name of a chat counterparty, synced by JS
/// (chat.otherSide.realLifeInfo?.userName or the deterministic anonymous
/// randomName - the seed-random generator is not reproducible in Swift).
public struct SenderNameEntry: Codable, Equatable, Sendable {
  public let inboxPublicKey: String
  public let senderPublicKey: String
  public let displayName: String

  public init(inboxPublicKey: String, senderPublicKey: String, displayName: String) {
    self.inboxPublicKey = inboxPublicKey
    self.senderPublicKey = senderPublicKey
    self.displayName = displayName
  }
}

/// Non-secret NSE metadata synced by JS into the app-group container as one
/// atomic JSON file (NseBridgeConstants.metadataFileName).
public struct NseMetadata: Codable, Equatable, Sendable {
  public let version: Int
  public let chatServiceUrl: String
  public let notificationServiceUrl: String?
  public let locale: String
  public let senderNames: [SenderNameEntry]

  public init(
    version: Int = NseBridgeConstants.metadataSchemaVersion,
    chatServiceUrl: String,
    notificationServiceUrl: String? = nil,
    locale: String,
    senderNames: [SenderNameEntry]
  ) {
    self.version = version
    self.chatServiceUrl = chatServiceUrl
    self.notificationServiceUrl = notificationServiceUrl
    self.locale = locale
    self.senderNames = senderNames
  }

  /// Public keys are compared as exact PemBase64 strings - never re-encoded.
  public func displayName(inbox: String, sender: String) -> String? {
    senderNames.first { entry in
      entry.inboxPublicKey == inbox && entry.senderPublicKey == sender
    }?.displayName
  }
}

public protocol MetadataStore: Sendable {
  /// Returns nil when the bridge has never synced (or after logout wipe).
  func loadMetadata() throws -> NseMetadata?
}

public struct AppGroupMetadataStore: MetadataStore {
  private let appGroupId: String

  public init(appGroupId: String) {
    self.appGroupId = appGroupId
  }

  public func loadMetadata() throws -> NseMetadata? {
    guard let container = FileManager.default.containerURL(
      forSecurityApplicationGroupIdentifier: appGroupId
    ) else {
      return nil
    }
    let fileUrl = container.appendingPathComponent(NseBridgeConstants.metadataFileName)
    guard let data = try? Data(contentsOf: fileUrl) else { return nil }

    let metadata = try JSONDecoder().decode(NseMetadata.self, from: data)
    guard metadata.version == NseBridgeConstants.metadataSchemaVersion else {
      // A newer bridge schema this binary does not understand: bail.
      return nil
    }
    return metadata
  }
}
