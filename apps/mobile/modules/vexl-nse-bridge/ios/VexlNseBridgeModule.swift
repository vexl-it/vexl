import ExpoModulesCore
import Foundation
import Security

// MARK: - Storage contract shared with the NSE (targets/vexl-nse).
// The notification service extension reads what this module writes. These
// values are the write side of the contract owned by NseBridgeConstants in
// the VexlNotificationCore Swift package; they are duplicated here because a
// CocoaPods module cannot link a local SPM package. Any change must be made
// on both sides in lockstep - BridgeContractTests (VexlNotificationCoreTests)
// pins the exact strings/versions and fails if the two drift.
private enum NseBridgeStorage {
  /// Keychain service holding one generic-password item per vexl notification
  /// token. Account = the vexl token ("vexl_nt_..."), value = UTF-8 JSON
  /// {"privateKeyPemBase64": "...", "publicKeyPemBase64": "..."}.
  static let inboxKeysService = "it.vexl.nse.inboxKeys"
  /// Keychain service earlier development builds used for session credential
  /// headers. Never written anymore (the NSE endpoints need no security
  /// headers) - only purged so no stale secrets linger.
  static let legacySessionService = "it.vexl.nse.session"
  /// File inside the App Group container with the non-secret metadata.
  static let metadataFileName = "nse-metadata.json"
  /// Info.plist key (on the main app and on the NSE) holding the App Group
  /// identifier, e.g. "group.it.vexl.next.shared". The App Group id doubles
  /// as the keychain access group.
  static let appGroupInfoPlistKey = "VexlAppGroup"
  static let metadataSchemaVersion = 1
}

internal final class NseBridgeException: GenericException<String> {
  override var reason: String {
    "NSE bridge error: \(param)"
  }
}

internal struct NseInboxKeyEntry: Record {
  @Field var vexlToken: String = ""
  @Field var inboxPrivateKeyPemBase64: String = ""
  @Field var inboxPublicKeyPemBase64: String = ""
}

internal struct NseSenderNameEntry: Record {
  @Field var inboxPublicKey: String = ""
  @Field var senderPublicKey: String = ""
  @Field var displayName: String = ""
}

internal struct NseMetadata: Record {
  @Field var chatServiceUrl: String = ""
  @Field var notificationServiceUrl: String? = nil
  @Field var locale: String = "en"
  @Field var senderNames: [NseSenderNameEntry] = []
}

internal struct NseSyncPayload: Record {
  @Field var keys: [NseInboxKeyEntry] = []
  @Field var metadata: NseMetadata = NseMetadata()
}

public class VexlNseBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VexlNseBridge")

    AsyncFunction("syncAll") { (payload: NseSyncPayload) in
      try self.syncAll(payload: payload)
    }

    AsyncFunction("clear") {
      try self.clearAll()
    }
  }

  // MARK: - Sync (declarative replace-all)

  private func syncAll(payload: NseSyncPayload) throws {
    let appGroup = try appGroupId()

    // 1. Inbox keys: wipe the whole service, then add the current entries.
    try deleteAllKeychainItems(
      service: NseBridgeStorage.inboxKeysService,
      accessGroup: appGroup
    )
    for entry in payload.keys {
      guard !entry.vexlToken.isEmpty else {
        continue
      }
      let value: [String: String] = [
        "privateKeyPemBase64": entry.inboxPrivateKeyPemBase64,
        "publicKeyPemBase64": entry.inboxPublicKeyPemBase64,
      ]
      try addKeychainItem(
        service: NseBridgeStorage.inboxKeysService,
        account: entry.vexlToken,
        value: try jsonData(from: value),
        accessGroup: appGroup
      )
    }

    // 2. Purge the legacy session-headers item (written by earlier dev
    // builds; session credentials are deliberately not mirrored anymore).
    try deleteAllKeychainItems(
      service: NseBridgeStorage.legacySessionService,
      accessGroup: appGroup
    )

    // 3. Non-secret metadata: one atomically-replaced JSON file in the App
    // Group container.
    var metadataJson: [String: Any] = [
      "version": NseBridgeStorage.metadataSchemaVersion,
      "chatServiceUrl": payload.metadata.chatServiceUrl,
      "locale": payload.metadata.locale,
      "senderNames": payload.metadata.senderNames.map { entry in
        [
          "inboxPublicKey": entry.inboxPublicKey,
          "senderPublicKey": entry.senderPublicKey,
          "displayName": entry.displayName,
        ]
      },
    ]
    if let notificationServiceUrl = payload.metadata.notificationServiceUrl {
      metadataJson["notificationServiceUrl"] = notificationServiceUrl
    }

    let data = try jsonData(from: metadataJson)
    let fileUrl = try metadataFileUrl(appGroup: appGroup)
    do {
      try data.write(
        to: fileUrl,
        options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication]
      )
    } catch {
      throw NseBridgeException("Failed to write metadata file: \(error)")
    }
  }

  // MARK: - Clear

  private func clearAll() throws {
    let appGroup = try appGroupId()

    try deleteAllKeychainItems(
      service: NseBridgeStorage.inboxKeysService,
      accessGroup: appGroup
    )
    try deleteAllKeychainItems(
      service: NseBridgeStorage.legacySessionService,
      accessGroup: appGroup
    )

    let fileUrl = try metadataFileUrl(appGroup: appGroup)
    if FileManager.default.fileExists(atPath: fileUrl.path) {
      do {
        try FileManager.default.removeItem(at: fileUrl)
      } catch {
        throw NseBridgeException("Failed to remove metadata file: \(error)")
      }
    }
  }

  // MARK: - Helpers

  private func appGroupId() throws -> String {
    guard
      let appGroup = Bundle.main.object(
        forInfoDictionaryKey: NseBridgeStorage.appGroupInfoPlistKey
      ) as? String,
      !appGroup.isEmpty
    else {
      throw NseBridgeException(
        "Missing \(NseBridgeStorage.appGroupInfoPlistKey) Info.plist entry"
      )
    }
    return appGroup
  }

  private func metadataFileUrl(appGroup: String) throws -> URL {
    guard
      let containerUrl = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: appGroup
      )
    else {
      throw NseBridgeException(
        "App Group container not available for \(appGroup)"
      )
    }
    return containerUrl.appendingPathComponent(
      NseBridgeStorage.metadataFileName
    )
  }

  private func jsonData(from object: Any) throws -> Data {
    do {
      return try JSONSerialization.data(
        withJSONObject: object,
        options: [.sortedKeys]
      )
    } catch {
      throw NseBridgeException("Failed to serialize JSON: \(error)")
    }
  }

  private func deleteAllKeychainItems(
    service: String,
    accessGroup: String
  ) throws {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccessGroup as String: accessGroup,
    ]
    let status = SecItemDelete(query as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else {
      throw NseBridgeException(
        "Keychain delete failed for service \(service) (status \(status))"
      )
    }
  }

  private func addKeychainItem(
    service: String,
    account: String,
    value: Data,
    accessGroup: String
  ) throws {
    let attributes: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: account,
      kSecAttrAccessGroup as String: accessGroup,
      // The NSE runs while the device is locked (post first unlock).
      kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
      kSecValueData as String: value,
    ]
    let status = SecItemAdd(attributes as CFDictionary, nil)
    guard status == errSecSuccess else {
      throw NseBridgeException(
        "Keychain add failed for service \(service) (status \(status))"
      )
    }
  }
}
