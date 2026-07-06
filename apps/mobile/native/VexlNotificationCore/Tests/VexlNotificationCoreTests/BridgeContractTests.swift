import XCTest

@testable import VexlNotificationCore

/// Pins the exact strings of the JS-bridge <-> NSE storage contract. The
/// write side (apps/mobile/modules/vexl-nse-bridge) duplicates these
/// constants because it cannot link this package - if this test needs a
/// change, change the bridge module in lockstep.
final class BridgeContractTests: XCTestCase {
  func testKeychainContract() {
    XCTAssertEqual(NseBridgeConstants.keychainInboxKeysService, "it.vexl.nse.inboxKeys")
  }

  func testMetadataFileContract() {
    XCTAssertEqual(NseBridgeConstants.metadataFileName, "nse-metadata.json")
    XCTAssertEqual(NseBridgeConstants.metadataSchemaVersion, 1)
  }

  func testEnrichedMarkerContract() {
    XCTAssertEqual(NseBridgeConstants.enrichedUserInfoKey, "vexlNseEnriched")
    XCTAssertEqual(NseBridgeConstants.enrichedUserInfoValue, "true")
    XCTAssertEqual(NseBridgeConstants.notificationCategoryIdentifier, "vexl-chat-preview")
    XCTAssertEqual(NseBridgeConstants.requestMessagingThreadIdentifier, "request-group-id")
  }

  func testAppGroupDerivation() {
    XCTAssertEqual(
      NseBridgeConstants.appGroupId(forAppBundleId: "it.vexl.next"),
      "group.it.vexl.next.shared"
    )
    XCTAssertEqual(
      NseBridgeConstants.appGroupId(forExtensionBundleId: "it.vexl.next.nse"),
      "group.it.vexl.next.shared"
    )
    XCTAssertEqual(
      NseBridgeConstants.appGroupId(forExtensionBundleId: "it.vexl.nextstaging.nse"),
      "group.it.vexl.nextstaging.shared"
    )
    // Defensive: a bundle id without the suffix still derives a valid group.
    XCTAssertEqual(
      NseBridgeConstants.appGroupId(forExtensionBundleId: "it.vexl.next"),
      "group.it.vexl.next.shared"
    )
  }

  func testInboxKeyPairJsonShape() throws {
    // The bridge writes `{"privateKeyPemBase64": ..., "publicKeyPemBase64": ...}`.
    let json = #"{"privateKeyPemBase64":"priv","publicKeyPemBase64":"pub"}"#
    let decoded = try JSONDecoder().decode(InboxKeyPair.self, from: Data(json.utf8))
    XCTAssertEqual(decoded, InboxKeyPair(privateKeyPemBase64: "priv", publicKeyPemBase64: "pub"))
  }

  func testMetadataJsonShape() throws {
    let json = """
      {
        "version": 1,
        "chatServiceUrl": "https://chat.vexl.it",
        "notificationServiceUrl": "https://notification.vexl.it",
        "locale": "cs",
        "senderNames": [
          {"inboxPublicKey": "inboxPem", "senderPublicKey": "senderPem", "displayName": "Alice"}
        ]
      }
      """
    let decoded = try JSONDecoder().decode(NseMetadata.self, from: Data(json.utf8))
    XCTAssertEqual(decoded.chatServiceUrl, "https://chat.vexl.it")
    XCTAssertEqual(decoded.locale, "cs")
    XCTAssertEqual(decoded.displayName(inbox: "inboxPem", sender: "senderPem"), "Alice")
    XCTAssertNil(decoded.displayName(inbox: "inboxPem", sender: "otherPem"))
  }

  func testMetadataWithoutOptionalFieldsDecodes() throws {
    let json = """
      {"version": 1, "chatServiceUrl": "https://chat.vexl.it", "locale": "en", "senderNames": []}
      """
    let decoded = try JSONDecoder().decode(NseMetadata.self, from: Data(json.utf8))
    XCTAssertNil(decoded.notificationServiceUrl)
  }
}
