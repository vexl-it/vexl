import XCTest

@testable import VexlNotificationCore

/// Fixtures mirror the observed Expo/APNs userInfo shape (see
/// extractDataFromNotification.test.ts and the protocol spec section 5).
final class PayloadParsingTests: XCTestCase {
  private let token = "vexl_nt_3J5j2mYQF3v8mS1kWq0dQgZk9t2yBcE4"

  private func userInfo(body: [String: Any]) -> [AnyHashable: Any] {
    [
      "aps": [
        "alert": ["title": "New message in Vexl", "body": "Tap to read it."],
        "mutable-content": 1,
        "content-available": 1,
      ],
      "body": body,
      "experienceId": "@vexlit/vexl",
      "scopeKey": "@vexlit/vexl",
    ]
  }

  func testParsesPayloadFromDataString() throws {
    let dataString =
      """
      {"_tag":"NewChatMessageNoticeNotificationData","targetToken":"\(token)","sentAt":"1751791234567","includesSystemNotification":"true"}
      """
    // dataString takes precedence: the direct fields carry a DIFFERENT token
    // to prove precedence.
    let payload = NotificationPayloadParser.parse(
      userInfo: userInfo(body: [
        "_tag": "NewChatMessageNoticeNotificationData",
        "targetToken": "vexl_nt_directFieldsToken",
        "dataString": dataString,
      ])
    )
    XCTAssertEqual(
      payload,
      ChatNotificationPayload(targetToken: token, sentAt: 1_751_791_234_567)
    )
  }

  func testParsesPayloadFromDirectFieldsWhenNoDataString() throws {
    let payload = NotificationPayloadParser.parse(
      userInfo: userInfo(body: [
        "_tag": "NewChatMessageNoticeNotificationData",
        "targetToken": token,
        "sentAt": "1751791234567",
        "includesSystemNotification": "true",
      ])
    )
    XCTAssertEqual(payload?.targetToken, token)
    XCTAssertEqual(payload?.sentAt, 1_751_791_234_567)
  }

  func testMissingOrMalformedSentAtDegradesToNilWithoutBailing() throws {
    for body: [String: Any] in [
      ["_tag": "NewChatMessageNoticeNotificationData", "targetToken": token],
      [
        "_tag": "NewChatMessageNoticeNotificationData",
        "targetToken": token,
        "sentAt": "not-a-number",
      ],
      [
        "_tag": "NewChatMessageNoticeNotificationData",
        "targetToken": token,
        "sentAt": ["nested": true],
      ],
    ] {
      let payload = NotificationPayloadParser.parse(userInfo: userInfo(body: body))
      XCTAssertEqual(payload?.targetToken, token)
      XCTAssertNil(payload?.sentAt ?? nil)
    }
  }

  func testParsesNumericSentAt() {
    let payload = NotificationPayloadParser.parse(
      userInfo: userInfo(body: [
        "_tag": "NewChatMessageNoticeNotificationData",
        "targetToken": token,
        "sentAt": 1_751_791_234_567,
      ])
    )
    XCTAssertEqual(payload?.sentAt, 1_751_791_234_567)
  }

  func testFallsBackToDirectFieldsWhenDataStringIsMalformed() throws {
    let payload = NotificationPayloadParser.parse(
      userInfo: userInfo(body: [
        "_tag": "NewChatMessageNoticeNotificationData",
        "targetToken": token,
        "dataString": "{not json",
      ])
    )
    XCTAssertEqual(payload?.targetToken, token)
  }

  func testBailsWithoutBodyDict() {
    XCTAssertNil(NotificationPayloadParser.parse(userInfo: ["aps": ["alert": "hi"]]))
    XCTAssertNil(NotificationPayloadParser.parse(userInfo: ["body": "a string"]))
    XCTAssertNil(NotificationPayloadParser.parse(userInfo: [:]))
  }

  func testBailsOnWrongTag() {
    XCTAssertNil(
      NotificationPayloadParser.parse(
        userInfo: userInfo(body: [
          "_tag": "SomeOtherNotificationData",
          "targetToken": token,
        ])
      )
    )
    XCTAssertNil(
      NotificationPayloadParser.parse(
        userInfo: userInfo(body: ["targetToken": token])
      )
    )
  }

  func testBailsOnLegacyTargetCypherOnlyPayload() {
    // Design decision 1: targetCypher (legacy) payloads are out of scope.
    XCTAssertNil(
      NotificationPayloadParser.parse(
        userInfo: userInfo(body: [
          "_tag": "NewChatMessageNoticeNotificationData",
          "targetCypher": "someLegacyCypher",
          "sentAt": "1751791234567",
        ])
      )
    )
  }

  func testBailsOnTokenWithoutVexlPrefix() {
    XCTAssertNil(
      NotificationPayloadParser.parse(
        userInfo: userInfo(body: [
          "_tag": "NewChatMessageNoticeNotificationData",
          "targetToken": "ExponentPushToken[xxx]",
        ])
      )
    )
  }

  // MARK: - Decrypted chat message payload

  func testParsesChatMessagePayloadFromLegacyVectorPlaintext() throws {
    // Exact plaintext of the legacy-chatMessageJson test vector.
    let vectors = try TestVectors.load()
    let vector = try XCTUnwrap(
      vectors.eciesLegacyDecrypt.first { $0.id == "legacy-chatMessageJson" }
    )
    let message = try XCTUnwrap(
      DecryptedChatMessage.parse(plaintextJson: vector.expectedPlaintext)
    )
    XCTAssertEqual(message.uuid, "f47ac10b-58cc-4372-a567-0e02b2c3d479")
    XCTAssertEqual(message.time, 1_751_808_000_000)
    XCTAssertEqual(message.renderableType, .message)
    XCTAssertEqual(message.text, "Ahoj! Are we still on for tomorrow at 18:30? 🤝₿")
    XCTAssertNil(message.minimalRequiredVersion)
  }

  func testChatMessageParseRejectsMalformedJson() {
    XCTAssertNil(DecryptedChatMessage.parse(plaintextJson: "not json"))
    XCTAssertNil(DecryptedChatMessage.parse(plaintextJson: "[]"))
    XCTAssertNil(DecryptedChatMessage.parse(plaintextJson: #"{"uuid":"a"}"#))
    XCTAssertNil(
      DecryptedChatMessage.parse(plaintextJson: #"{"uuid":"a","messageType":"MESSAGE"}"#)
    )
  }

  func testChatMessageParseRejectsBooleanTime() {
    // A JSON boolean bridges to NSNumber and must not be coerced to a timestamp.
    XCTAssertNil(
      DecryptedChatMessage.parse(
        plaintextJson: #"{"uuid":"a","messageType":"MESSAGE","time":true}"#
      )
    )
    XCTAssertNil(
      DecryptedChatMessage.parse(
        plaintextJson: #"{"uuid":"a","messageType":"MESSAGE","time":"1751808000000"}"#
      )
    )
  }

  func testChatMessageParseAcceptsNumericTime() throws {
    let message = try XCTUnwrap(
      DecryptedChatMessage.parse(
        plaintextJson: #"{"uuid":"a","messageType":"MESSAGE","time":1751808000000}"#
      )
    )
    XCTAssertEqual(message.time, 1_751_808_000_000)
  }
}
