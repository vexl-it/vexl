import Foundation

/// Single source of truth for the JS-bridge <-> NSE storage contract.
///
/// The write side lives in the local Expo module
/// (apps/mobile/modules/vexl-nse-bridge) which cannot link this package, so
/// these exact strings are duplicated there. The contract test in
/// VexlNotificationCoreTests pins them - change both sides together.
public enum NseBridgeConstants {
  /// Keychain service for per-token inbox key items. One
  /// kSecClassGenericPassword item per vexl token:
  /// account = the `vexl_nt_...` token, value = JSON
  /// `{"privateKeyPemBase64": "...", "publicKeyPemBase64": "..."}`,
  /// accessible after first unlock, in the shared app-group access group.
  public static let keychainInboxKeysService = "it.vexl.nse.inboxKeys"

  /// Metadata JSON file inside the app-group container (atomic replace-all
  /// writes; see NseMetadata for the schema).
  public static let metadataFileName = "nse-metadata.json"
  public static let metadataSchemaVersion = 1

  /// userInfo["body"] key marking an NSE-enriched notification. The JS cancel
  /// logic must skip notifications carrying this marker (decision 7). Values
  /// are strings to match the all-strings push data record convention.
  public static let enrichedUserInfoKey = "vexlNseEnriched"
  public static let enrichedUserInfoValue = "true"

  /// Category assigned to enriched notifications so JS can register a
  /// `hiddenPreviewsBodyPlaceholder` for it (decision 8).
  public static let notificationCategoryIdentifier = "vexl-chat-preview"

  /// Thread identifier shared by all REQUEST_MESSAGING notifications (parity
  /// with apps/mobile/src/utils/notifications/chatNotifications.ts).
  public static let requestMessagingThreadIdentifier = "request-group-id"

  /// App group id derived from the MAIN APP bundle id, e.g.
  /// "it.vexl.next" -> "group.it.vexl.next.shared". On iOS the app-group id
  /// doubles as the keychain access group (no team-id prefix at runtime).
  public static func appGroupId(forAppBundleId appBundleId: String) -> String {
    "group.\(appBundleId).shared"
  }

  /// Suffix appended to the main app bundle id for the NSE target.
  public static let nseBundleIdSuffix = ".nse"

  /// App group id for the NSE process itself: strips the ".nse" suffix from
  /// the extension bundle id, then derives the group id.
  public static func appGroupId(forExtensionBundleId extensionBundleId: String) -> String {
    var appBundleId = extensionBundleId
    if appBundleId.hasSuffix(nseBundleIdSuffix) {
      appBundleId = String(appBundleId.dropLast(nseBundleIdSuffix.count))
    }
    return appGroupId(forAppBundleId: appBundleId)
  }
}
