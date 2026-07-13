import XCTest

@testable import VexlNotificationCore

final class RenderingTests: XCTestCase {
  private let localization = NotificationLocalization.loadBundled()

  private func message(
    type: String,
    text: String? = nil,
    minimalRequiredVersion: String? = nil,
    time: Int64 = 1_751_808_000_000
  ) -> DecryptedChatMessage {
    DecryptedChatMessage(
      uuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      time: time,
      messageTypeRaw: type,
      text: text,
      minimalRequiredVersion: minimalRequiredVersion
    )
  }

  private func render(
    _ message: DecryptedChatMessage,
    inbox: String = "inboxPem",
    sender: String = "senderPem",
    displayName: String?,
    locale: String = "en"
  ) throws -> RenderedNotification? {
    let localization = try XCTUnwrap(localization, "bundled localization must load")
    return NotificationRenderer.render(
      message: message,
      inboxPublicKey: inbox,
      senderPublicKey: sender,
      displayName: displayName,
      locale: locale,
      localization: localization
    )
  }

  // MARK: - Renderable-type decision

  func testNonRenderableAndUnknownTypesAreNotRendered() throws {
    for type in ["VERSION_UPDATE", "FCM_CYPHER_UPDATE", "MESSAGE_READ", "OFFER_DELETED",
                 "INACTIVITY_REMINDER", "SOME_FUTURE_TYPE", ""] {
      XCTAssertNil(
        try render(message(type: type, text: "hi"), displayName: "Alice"),
        "type \(type) must not be rendered"
      )
      XCTAssertFalse(message(type: type).isPreviewable(appSemver: "1.44.0"))
    }
  }

  func testAllRenderableTypesRender() throws {
    for type in RenderableMessageType.allCases {
      let rendered = try render(message(type: type.rawValue, text: "hi"), displayName: "Alice")
      XCTAssertNotNil(rendered, "type \(type.rawValue) must render")
    }
  }

  // MARK: - minimalRequiredVersion gate

  func testVersionGate() {
    let gated = message(type: "MESSAGE", text: "hi", minimalRequiredVersion: "2.0.0")
    XCTAssertFalse(gated.isPreviewable(appSemver: "1.44.0"))
    XCTAssertTrue(gated.isPreviewable(appSemver: "2.0.0"))
    XCTAssertTrue(gated.isPreviewable(appSemver: "2.0.1"))
    // Unknown app version or unparseable requirement: bail.
    XCTAssertFalse(gated.isPreviewable(appSemver: nil))
    XCTAssertFalse(
      message(type: "MESSAGE", minimalRequiredVersion: "banana")
        .isPreviewable(appSemver: "1.44.0")
    )
    // No requirement: always previewable.
    XCTAssertTrue(message(type: "MESSAGE").isPreviewable(appSemver: nil))
  }

  // MARK: - Thread identifier parity

  func testThreadIdentifierMatchesJsSha256Recipe() throws {
    let vectors = try TestVectors.load()
    let inbox = vectors.keys[0].publicKeyPemBase64
    let sender = vectors.keys[1].publicKeyPemBase64

    let rendered = try XCTUnwrap(
      try render(message(type: "MESSAGE", text: "hi"), inbox: inbox, sender: sender, displayName: "Alice")
    )
    // node: crypto.createHash('sha256').update(inboxPem + senderPem).digest('base64')
    XCTAssertEqual(rendered.threadIdentifier, "ZggfgS3YS3eBiBpvCeoU4YLodzOacYwlTyK7GQvSprY=")
  }

  func testRequestMessagingUsesSharedThreadId() throws {
    let rendered = try XCTUnwrap(
      try render(message(type: "REQUEST_MESSAGING"), displayName: nil)
    )
    XCTAssertEqual(rendered.threadIdentifier, "request-group-id")
  }

  // MARK: - Title/body rules

  func testMessageTypeUsesNameAndText() throws {
    let rendered = try XCTUnwrap(
      try render(message(type: "MESSAGE", text: "See you at 6"), displayName: "Alice")
    )
    XCTAssertEqual(rendered.title, "Alice")
    XCTAssertEqual(rendered.body, "See you at 6")
  }

  func testMessageTypeFallsBackToLocalizedGenericStrings() throws {
    let rendered = try XCTUnwrap(
      try render(message(type: "MESSAGE"), displayName: nil)
    )
    XCTAssertEqual(rendered.title, "New message")
    XCTAssertEqual(rendered.body, "Tap to read it.")
  }

  func testMessageTypeFallsBackWhenTextIsEmptyOrWhitespace() throws {
    // Empty / whitespace-only text is reachable from crafted ciphertext and
    // must not render a blank body - fall back to the localized generic body.
    for blank in ["", "   ", "\n", "\t \n"] {
      let rendered = try XCTUnwrap(
        try render(message(type: "MESSAGE", text: blank), displayName: "Alice")
      )
      XCTAssertEqual(rendered.title, "Alice")
      XCTAssertEqual(rendered.body, "Tap to read it.", "text \(blank.debugDescription) must fall back")
    }

    // Real text with surrounding whitespace is preserved verbatim.
    let padded = try XCTUnwrap(
      try render(message(type: "MESSAGE", text: "  hi  "), displayName: "Alice")
    )
    XCTAssertEqual(padded.body, "  hi  ")
  }

  func testOtherTypesUseLocalizedStringsWithThemInterpolation() throws {
    let requestMessaging = try XCTUnwrap(
      try render(message(type: "REQUEST_MESSAGING"), displayName: "Alice")
    )
    XCTAssertEqual(requestMessaging.title, "New response to your offer")
    XCTAssertEqual(requestMessaging.body, "Someone wants to connect with you.")

    let checklist = try XCTUnwrap(
      try render(message(type: "TRADE_CHECKLIST_UPDATE", text: "secret"), displayName: "Alice")
    )
    // en: title "{{them}}", body "{{them}} updated the trade checklist."
    XCTAssertEqual(checklist.title, "Alice")
    XCTAssertEqual(checklist.body, "Alice updated the trade checklist.")
    // Never leak text for non-MESSAGE types.
    XCTAssertFalse(checklist.body.contains("secret"))

    let checklistNoName = try XCTUnwrap(
      try render(message(type: "TRADE_CHECKLIST_UPDATE"), displayName: nil)
    )
    XCTAssertEqual(checklistNoName.title, "")
  }

  func testLocaleSelectionAndFallback() throws {
    let czech = try XCTUnwrap(
      try render(message(type: "MESSAGE"), displayName: nil, locale: "cs")
    )
    XCTAssertNotEqual(czech.title, "New message", "cs locale must not fall back to en")

    let czechRegion = try XCTUnwrap(
      try render(message(type: "MESSAGE"), displayName: nil, locale: "cs-CZ")
    )
    XCTAssertEqual(czechRegion.title, czech.title)

    let unknownLocale = try XCTUnwrap(
      try render(message(type: "MESSAGE"), displayName: nil, locale: "xx")
    )
    XCTAssertEqual(unknownLocale.title, "New message")
  }

  // MARK: - userInfo enrichment marker

  func testMarkUserInfoEnrichedUpdatesBodyAndDataString() throws {
    let dataString =
      #"{"_tag":"NewChatMessageNoticeNotificationData","targetToken":"vexl_nt_x"}"#
    let original: [AnyHashable: Any] = [
      "aps": ["alert": "x"],
      "body": [
        "_tag": "NewChatMessageNoticeNotificationData",
        "targetToken": "vexl_nt_x",
        "dataString": dataString,
      ],
    ]

    let updated = RenderedNotification.markUserInfoEnriched(
      original,
      inbox: "inboxPem",
      sender: "senderPem",
      messageType: "MESSAGE"
    )

    let body = try XCTUnwrap(updated["body"] as? [String: Any])
    XCTAssertEqual(body["vexlNseEnriched"] as? String, "true")
    XCTAssertEqual(body["inbox"] as? String, "inboxPem")
    XCTAssertEqual(body["sender"] as? String, "senderPem")
    XCTAssertEqual(body["type"] as? String, "MESSAGE")
    // Original fields survive.
    XCTAssertEqual(body["targetToken"] as? String, "vexl_nt_x")

    // dataString (preferred by extractDataFromNotification.ts) also carries
    // the marker after enrichment.
    let updatedDataString = try XCTUnwrap(body["dataString"] as? String)
    let dataObject = try XCTUnwrap(
      try JSONSerialization.jsonObject(with: Data(updatedDataString.utf8)) as? [String: Any]
    )
    XCTAssertEqual(dataObject["vexlNseEnriched"] as? String, "true")
    XCTAssertEqual(dataObject["targetToken"] as? String, "vexl_nt_x")
  }

  #if canImport(UserNotifications)
  func testApplyToNotificationContent() throws {
    let rendered = try XCTUnwrap(
      try render(message(type: "MESSAGE", text: "hello"), displayName: "Alice")
    )
    let content = UNMutableNotificationContent()
    content.title = "New message in Vexl"
    content.body = "Tap to read it."
    content.userInfo = ["body": ["targetToken": "vexl_nt_x"]]

    rendered.apply(to: content)

    XCTAssertEqual(content.title, "Alice")
    XCTAssertEqual(content.body, "hello")
    XCTAssertEqual(content.categoryIdentifier, "vexl-chat-preview")
    XCTAssertFalse(content.threadIdentifier.isEmpty)
    let body = try XCTUnwrap(content.userInfo["body"] as? [String: Any])
    XCTAssertEqual(body["vexlNseEnriched"] as? String, "true")
  }
  #endif
}

#if canImport(UserNotifications)
import UserNotifications
#endif
