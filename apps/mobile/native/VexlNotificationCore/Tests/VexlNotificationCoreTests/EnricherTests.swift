import Foundation
import XCTest

@testable import VexlNotificationCore

// MARK: - Fakes

struct FakeKeyStore: InboxKeyStore {
  let entries: [String: InboxKeyPair]
  var error: Bool = false

  func inboxKeyPair(forVexlToken token: String) throws -> InboxKeyPair? {
    if error { throw KeychainError.unexpectedStatus(-25308) }
    return entries[token]
  }
}

struct FakeMetadataStore: MetadataStore {
  let metadata: NseMetadata?

  func loadMetadata() throws -> NseMetadata? { metadata }
}

final class FakeHttpClient: HttpClient, @unchecked Sendable {
  struct Route {
    let statusCode: Int
    let body: [String: Any]
  }

  private let lock = NSLock()
  private var routes: [String: Route] = [:]
  private var recorded: [URLRequest] = []

  var recordedRequests: [URLRequest] {
    lock.lock()
    defer { lock.unlock() }
    return recorded
  }

  func stub(pathSuffix: String, statusCode: Int = 200, body: [String: Any]) {
    lock.lock()
    defer { lock.unlock() }
    routes[pathSuffix] = Route(statusCode: statusCode, body: body)
  }

  private func recordAndMatch(_ request: URLRequest) -> Route? {
    lock.lock()
    defer { lock.unlock() }
    recorded.append(request)
    return routes.first { request.url?.path.hasSuffix($0.key) == true }?.value
  }

  func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
    let route = recordAndMatch(request)

    guard let route, let url = request.url else {
      throw URLError(.cannotFindHost)
    }
    let response = HTTPURLResponse(
      url: url,
      statusCode: route.statusCode,
      httpVersion: nil,
      headerFields: nil
    )!
    return (try JSONSerialization.data(withJSONObject: route.body), response)
  }
}

// MARK: - Tests

final class EnricherTests: XCTestCase {
  private let token = "vexl_nt_testToken123"
  private let challenge = "CBCiph-someOpaqueChallengeString+/="

  private func vectorsFixture() throws -> (
    keyPair: InboxKeyPair,
    chatCypher: String,
    olderChatCypher: String,
    senderPublicKey: String
  ) {
    let vectors = try TestVectors.load()
    let key1 = vectors.keys[0]
    let vector = try XCTUnwrap(
      vectors.eciesLegacyDecrypt.first { $0.id == "legacy-chatMessageJson" }
    )
    let olderVector = try XCTUnwrap(
      vectors.eciesLegacyDecrypt.first { $0.id == "legacy-chatMessageJsonOlder" }
    )
    return (
      InboxKeyPair(
        privateKeyPemBase64: key1.privateKeyPemBase64,
        publicKeyPemBase64: key1.publicKeyPemBase64
      ),
      vector.ciphertext,
      olderVector.ciphertext,
      vectors.keys[1].publicKeyPemBase64
    )
  }

  /// Times of the two chat-message vectors (see generateNseTestVectors.ts).
  private let newerMessageTime: Int64 = 1_751_808_000_000
  private let olderMessageTime: Int64 = 1_751_704_000_000
  private let newerMessageText = "Ahoj! Are we still on for tomorrow at 18:30? 🤝₿"
  private let olderMessageText = "Older message - must only preview for its own push 🙂"

  private func makeUserInfo(
    targetToken: String,
    sentAt: String? = "1751791234567"
  ) -> [AnyHashable: Any] {
    var body: [String: Any] = [
      "_tag": "NewChatMessageNoticeNotificationData",
      "targetToken": targetToken,
      "includesSystemNotification": "true",
    ]
    if let sentAt {
      body["sentAt"] = sentAt
    }
    return [
      "aps": ["alert": ["title": "New message in Vexl", "body": "Tap to read it."]],
      "body": body,
    ]
  }

  private func makeEnricher(
    keyStore: FakeKeyStore,
    metadata: NseMetadata?,
    http: FakeHttpClient,
    maxCiphertextLength: Int = NotificationEnricher.defaultMaxCiphertextLength
  ) -> NotificationEnricher {
    NotificationEnricher(
      keyStore: keyStore,
      metadataStore: FakeMetadataStore(metadata: metadata),
      http: http,
      appSemver: "1.44.0",
      maxCiphertextLength: maxCiphertextLength
    )
  }

  func testHappyPathEnrichesWithDecryptedPreview() async throws {
    let fixture = try vectorsFixture()

    let http = FakeHttpClient()
    http.stub(
      pathSuffix: "/api/v1/challenges",
      body: ["challenge": challenge, "expiration": 1_751_800_000_000]
    )
    http.stub(
      pathSuffix: "/api/v1/inboxes/messages",
      body: [
        "messages": [
          [
            "id": 1,
            "message": fixture.chatCypher,
            "senderPublicKey": fixture.senderPublicKey,
          ]
        ]
      ]
    )

    let metadata = NseMetadata(
      chatServiceUrl: "https://chat.vexl.it",
      locale: "en",
      senderNames: [
        SenderNameEntry(
          inboxPublicKey: fixture.keyPair.publicKeyPemBase64,
          senderPublicKey: fixture.senderPublicKey,
          displayName: "Satoshi"
        )
      ]
    )

    let enricher = makeEnricher(
      keyStore: FakeKeyStore(entries: [token: fixture.keyPair]),
      metadata: metadata,
      http: http
    )

    let result = await enricher.enrich(userInfo: makeUserInfo(targetToken: token))
    let rendered = try XCTUnwrap(result)
    XCTAssertEqual(rendered.title, "Satoshi")
    XCTAssertEqual(rendered.body, "Ahoj! Are we still on for tomorrow at 18:30? 🤝₿")
    XCTAssertEqual(rendered.messageType, "MESSAGE")
    XCTAssertEqual(rendered.inboxPublicKey, fixture.keyPair.publicKeyPemBase64)
    XCTAssertEqual(rendered.senderPublicKey, fixture.senderPublicKey)

    // The retrieveMessages call MUST be read-only (markAsPulled: false) and
    // must carry a signature the server can verify with the inbox pubkey.
    let retrieveRequest = try XCTUnwrap(
      http.recordedRequests.first { $0.url?.path.hasSuffix("/api/v1/inboxes/messages") == true }
    )
    XCTAssertEqual(retrieveRequest.httpMethod, "PUT")
    let body = try XCTUnwrap(
      try JSONSerialization.jsonObject(
        with: XCTUnwrap(retrieveRequest.httpBody)
      ) as? [String: Any]
    )
    XCTAssertEqual(body["markAsPulled"] as? Bool, false)
    XCTAssertEqual(body["publicKey"] as? String, fixture.keyPair.publicKeyPemBase64)
    XCTAssertNil(body["publicKeyV2"], "publicKeyV2 must be omitted entirely")
    let signedChallenge = try XCTUnwrap(body["signedChallenge"] as? [String: Any])
    XCTAssertEqual(signedChallenge["challenge"] as? String, challenge)
    XCTAssertNil(signedChallenge["signatureV2"], "signatureV2 must be omitted entirely")
    let signature = try XCTUnwrap(signedChallenge["signature"] as? String)
    XCTAssertTrue(
      verifySignature(
        message: challenge,
        signatureBase64Der: signature,
        publicKeyPemBase64: fixture.keyPair.publicKeyPemBase64
      )
    )
  }

  func testUnknownSenderFallsBackToGenericLocalizedTitle() async throws {
    let fixture = try vectorsFixture()

    let http = FakeHttpClient()
    http.stub(pathSuffix: "/api/v1/challenges", body: ["challenge": challenge])
    http.stub(
      pathSuffix: "/api/v1/inboxes/messages",
      body: [
        "messages": [
          ["message": fixture.chatCypher, "senderPublicKey": fixture.senderPublicKey]
        ]
      ]
    )

    let enricher = makeEnricher(
      keyStore: FakeKeyStore(entries: [token: fixture.keyPair]),
      metadata: NseMetadata(
        chatServiceUrl: "https://chat.vexl.it",
        locale: "en",
        senderNames: []
      ),
      http: http
    )

    let result = await enricher.enrich(userInfo: makeUserInfo(targetToken: token))
    let rendered = try XCTUnwrap(result)
    XCTAssertEqual(rendered.title, "New message")
    // The decrypted text is still the body - same as JS behavior.
    XCTAssertEqual(rendered.body, "Ahoj! Are we still on for tomorrow at 18:30? 🤝₿")
  }

  func testUnknownTokenBails() async throws {
    let http = FakeHttpClient()
    let enricher = makeEnricher(
      keyStore: FakeKeyStore(entries: [:]),
      metadata: NseMetadata(chatServiceUrl: "https://chat.vexl.it", locale: "en", senderNames: []),
      http: http
    )
    let result = await enricher.enrich(userInfo: makeUserInfo(targetToken: token))
    XCTAssertNil(result)
    XCTAssertTrue(http.recordedRequests.isEmpty, "must not touch the network")
  }

  func testKeyStoreErrorBails() async throws {
    let fixture = try vectorsFixture()
    let enricher = makeEnricher(
      keyStore: FakeKeyStore(entries: [token: fixture.keyPair], error: true),
      metadata: NseMetadata(chatServiceUrl: "https://chat.vexl.it", locale: "en", senderNames: []),
      http: FakeHttpClient()
    )
    let result = await enricher.enrich(userInfo: makeUserInfo(targetToken: token))
    XCTAssertNil(result)
  }

  func testMissingMetadataBails() async throws {
    let fixture = try vectorsFixture()
    let enricher = makeEnricher(
      keyStore: FakeKeyStore(entries: [token: fixture.keyPair]),
      metadata: nil,
      http: FakeHttpClient()
    )
    let result = await enricher.enrich(userInfo: makeUserInfo(targetToken: token))
    XCTAssertNil(result)
  }

  func testNetworkFailureBails() async throws {
    let fixture = try vectorsFixture()
    let http = FakeHttpClient() // no stubs: every request throws
    let enricher = makeEnricher(
      keyStore: FakeKeyStore(entries: [token: fixture.keyPair]),
      metadata: NseMetadata(chatServiceUrl: "https://chat.vexl.it", locale: "en", senderNames: []),
      http: http
    )
    let result = await enricher.enrich(userInfo: makeUserInfo(targetToken: token))
    XCTAssertNil(result)
  }

  func testHttpErrorStatusBails() async throws {
    let fixture = try vectorsFixture()
    let http = FakeHttpClient()
    http.stub(
      pathSuffix: "/api/v1/challenges",
      statusCode: 401,
      body: ["_tag": "InvalidChallengeError", "status": 400]
    )
    let enricher = makeEnricher(
      keyStore: FakeKeyStore(entries: [token: fixture.keyPair]),
      metadata: NseMetadata(chatServiceUrl: "https://chat.vexl.it", locale: "en", senderNames: []),
      http: http
    )
    let result = await enricher.enrich(userInfo: makeUserInfo(targetToken: token))
    XCTAssertNil(result)
  }

  func testUndecryptableAndNonRenderableMessagesBail() async throws {
    let fixture = try vectorsFixture()
    let http = FakeHttpClient()
    http.stub(pathSuffix: "/api/v1/challenges", body: ["challenge": challenge])
    http.stub(
      pathSuffix: "/api/v1/inboxes/messages",
      body: [
        "messages": [
          ["message": "garbage-cypher", "senderPublicKey": fixture.senderPublicKey]
        ]
      ]
    )
    let enricher = makeEnricher(
      keyStore: FakeKeyStore(entries: [token: fixture.keyPair]),
      metadata: NseMetadata(chatServiceUrl: "https://chat.vexl.it", locale: "en", senderNames: []),
      http: http
    )
    let result = await enricher.enrich(userInfo: makeUserInfo(targetToken: token))
    XCTAssertNil(result)
  }

  func testEmptyMessageListBails() async throws {
    let fixture = try vectorsFixture()
    let http = FakeHttpClient()
    http.stub(pathSuffix: "/api/v1/challenges", body: ["challenge": challenge])
    http.stub(pathSuffix: "/api/v1/inboxes/messages", body: ["messages": []])
    let enricher = makeEnricher(
      keyStore: FakeKeyStore(entries: [token: fixture.keyPair]),
      metadata: NseMetadata(chatServiceUrl: "https://chat.vexl.it", locale: "en", senderNames: []),
      http: http
    )
    let result = await enricher.enrich(userInfo: makeUserInfo(targetToken: token))
    XCTAssertNil(result)
  }

  private func makeTwoMessageEnricher(
    fixture: (
      keyPair: InboxKeyPair,
      chatCypher: String,
      olderChatCypher: String,
      senderPublicKey: String
    )
  ) -> NotificationEnricher {
    let http = FakeHttpClient()
    http.stub(pathSuffix: "/api/v1/challenges", body: ["challenge": challenge])
    http.stub(
      pathSuffix: "/api/v1/inboxes/messages",
      body: [
        "messages": [
          ["message": fixture.chatCypher, "senderPublicKey": fixture.senderPublicKey],
          ["message": fixture.olderChatCypher, "senderPublicKey": fixture.senderPublicKey],
        ]
      ]
    )
    return makeEnricher(
      keyStore: FakeKeyStore(entries: [token: fixture.keyPair]),
      metadata: NseMetadata(chatServiceUrl: "https://chat.vexl.it", locale: "en", senderNames: []),
      http: http
    )
  }

  /// A burst of pushes must preview each push's OWN message: the payload's
  /// sentAt picks the candidate closest in time, not the globally newest one.
  func testSentAtPicksTheMessageClosestToThePush() async throws {
    let fixture = try vectorsFixture()
    let enricher = makeTwoMessageEnricher(fixture: fixture)

    let forOlderPush = await enricher.enrich(
      userInfo: makeUserInfo(targetToken: token, sentAt: String(olderMessageTime + 123))
    )
    XCTAssertEqual(try XCTUnwrap(forOlderPush).body, olderMessageText)

    let forNewerPush = await enricher.enrich(
      userInfo: makeUserInfo(targetToken: token, sentAt: String(newerMessageTime - 123))
    )
    XCTAssertEqual(try XCTUnwrap(forNewerPush).body, newerMessageText)
  }

  func testMissingSentAtFallsBackToNewestMessage() async throws {
    let fixture = try vectorsFixture()
    let enricher = makeTwoMessageEnricher(fixture: fixture)

    let rendered = await enricher.enrich(
      userInfo: makeUserInfo(targetToken: token, sentAt: nil)
    )
    XCTAssertEqual(try XCTUnwrap(rendered).body, newerMessageText)
  }

  /// Memory guard: oversized cyphers are never decrypted (an otherwise valid
  /// message above the threshold bails to generic content).
  func testOversizedCiphertextIsSkippedBeforeDecryption() async throws {
    let fixture = try vectorsFixture()
    let http = FakeHttpClient()
    http.stub(pathSuffix: "/api/v1/challenges", body: ["challenge": challenge])
    http.stub(
      pathSuffix: "/api/v1/inboxes/messages",
      body: [
        "messages": [
          ["message": fixture.chatCypher, "senderPublicKey": fixture.senderPublicKey]
        ]
      ]
    )
    let enricher = makeEnricher(
      keyStore: FakeKeyStore(entries: [token: fixture.keyPair]),
      metadata: NseMetadata(chatServiceUrl: "https://chat.vexl.it", locale: "en", senderNames: []),
      http: http,
      maxCiphertextLength: 16
    )
    let result = await enricher.enrich(userInfo: makeUserInfo(targetToken: token))
    XCTAssertNil(result)
  }

  /// Attacker-controlled `time` values must never trap the distance math.
  func testTimeDistanceIsOverflowSafe() {
    XCTAssertEqual(
      NotificationEnricher.timeDistance(Int64.min, to: Int64.max),
      UInt64.max
    )
    XCTAssertEqual(NotificationEnricher.timeDistance(10, to: 3), 7)
    XCTAssertEqual(NotificationEnricher.timeDistance(3, to: 10), 7)
  }

  func testLegacyTargetCypherPayloadBailsWithoutStoreOrNetworkAccess() async {
    let http = FakeHttpClient()
    let enricher = makeEnricher(
      keyStore: FakeKeyStore(entries: [:], error: true),
      metadata: nil,
      http: http
    )
    let userInfo: [AnyHashable: Any] = [
      "body": [
        "_tag": "NewChatMessageNoticeNotificationData",
        "targetCypher": "legacyCypher",
      ]
    ]
    let result = await enricher.enrich(userInfo: userInfo)
    XCTAssertNil(result)
    XCTAssertTrue(http.recordedRequests.isEmpty)
  }
}
