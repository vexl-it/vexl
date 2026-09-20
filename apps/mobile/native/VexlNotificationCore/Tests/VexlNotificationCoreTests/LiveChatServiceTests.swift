import Foundation
import XCTest

@testable import VexlNotificationCore

final class LiveChatServiceTests: XCTestCase {
  private struct Fixture: Decodable {
    let chatServiceUrl: String
    let vexlToken: String
    let inboxPrivateKeyPemBase64: String
    let inboxPublicKeyPemBase64: String
    let senderPublicKey: String
    let senderDisplayName: String
    let expectedText: String
    let sentAt: String
  }

  func testEnrichesMessageFromLiveChatService() async throws {
    guard let path = ProcessInfo.processInfo.environment["VEXL_NSE_LIVE_FIXTURE"] else {
      throw XCTSkip("Set VEXL_NSE_LIVE_FIXTURE to a live chat-service JSON fixture")
    }
    let fixture = try JSONDecoder().decode(
      Fixture.self, from: Data(contentsOf: URL(fileURLWithPath: path))
    )
    let enricher = NotificationEnricher(
      keyStore: FakeKeyStore(entries: [
        fixture.vexlToken: InboxKeyPair(
          privateKeyPemBase64: fixture.inboxPrivateKeyPemBase64,
          publicKeyPemBase64: fixture.inboxPublicKeyPemBase64
        )
      ]),
      metadataStore: FakeMetadataStore(metadata: NseMetadata(
        chatServiceUrl: fixture.chatServiceUrl,
        locale: "en",
        senderNames: [
          SenderNameEntry(
            inboxPublicKey: fixture.inboxPublicKeyPemBase64,
            senderPublicKey: fixture.senderPublicKey,
            displayName: fixture.senderDisplayName
          )
        ]
      )),
      http: UrlSessionHttpClient(requestTimeout: ChatApiClient.defaultRequestTimeout),
      appSemver: "26.9.0"
    )
    let result = await enricher.enrich(userInfo: [
      "aps": [
        "alert": ["title": "New message in Vexl", "body": "Tap to read it."],
        "mutable-content": 1,
      ],
      "body": [
        "_tag": "NewChatMessageNoticeNotificationData",
        "targetToken": fixture.vexlToken,
        "sentAt": fixture.sentAt,
        "includesSystemNotification": "true",
      ],
    ])
    let rendered = try XCTUnwrap(result)
    XCTAssertEqual(rendered.title, fixture.senderDisplayName)
    XCTAssertEqual(rendered.body, fixture.expectedText)
  }
}
