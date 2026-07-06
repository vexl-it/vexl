import Foundation

public enum ChatApiError: Error {
  case invalidBaseUrl
  case requestFailed
  case unexpectedStatus(Int)
  case malformedResponse
}

/// Thin HTTP abstraction so the API client is testable without a network.
public protocol HttpClient: Sendable {
  func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse)
}

public struct UrlSessionHttpClient: HttpClient {
  private let session: URLSession

  public init(requestTimeout: TimeInterval) {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.timeoutIntervalForRequest = requestTimeout
    configuration.timeoutIntervalForResource = requestTimeout
    configuration.waitsForConnectivity = false
    self.session = URLSession(configuration: configuration)
  }

  public func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
    let (data, response) = try await session.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse else {
      throw ChatApiError.requestFailed
    }
    return (data, httpResponse)
  }
}

/// One undelivered message from `retrieveMessages`
/// (packages/rest-api/src/services/chat/contracts.ts).
public struct ServerMessage: Equatable, Sendable {
  /// ECIES-legacy `MessageCypher`.
  public let message: String
  /// `PublicKeyPemBase64` of the sender - from the server envelope.
  public let senderPublicKey: String

  public init(message: String, senderPublicKey: String) {
    self.message = message
    self.senderPublicKey = senderPublicKey
  }
}

/// Minimal chat-service client for the NSE fetch flow:
/// createChallenge -> (caller signs) -> retrieveMessages(markAsPulled: false).
///
/// Neither endpoint requires security headers (verified against
/// packages/rest-api/src/services/chat/specification.ts); only common
/// metadata headers are sent.
public struct ChatApiClient: Sendable {
  public static let defaultRequestTimeout: TimeInterval = 5

  private let baseUrl: URL
  private let http: HttpClient
  private let extraHeaders: [String: String]

  /// - Parameters:
  ///   - chatServiceUrl: e.g. "https://chat.vexl.it" (from the bridge metadata)
  ///   - extraHeaders: optional common headers (user-agent, client-version, ...)
  public init(
    chatServiceUrl: String,
    http: HttpClient,
    extraHeaders: [String: String] = [:]
  ) throws {
    guard let baseUrl = URL(string: chatServiceUrl) else {
      throw ChatApiError.invalidBaseUrl
    }
    self.baseUrl = baseUrl
    self.http = http
    self.extraHeaders = extraHeaders
  }

  /// POST /api/v1/challenges - returns the opaque challenge string
  /// (`CBCiph-...`) which must be signed as its exact UTF-8 bytes.
  /// `publicKeyV2` is intentionally omitted so only the V1 ECDSA signature is
  /// validated server-side.
  public func createChallenge(publicKey: String) async throws -> String {
    let response = try await send(
      method: "POST",
      path: "api/v1/challenges",
      body: ["publicKey": publicKey]
    )
    guard let challenge = response["challenge"] as? String, !challenge.isEmpty else {
      throw ChatApiError.malformedResponse
    }
    return challenge
  }

  /// PUT /api/v1/inboxes/messages with markAsPulled=false - strictly
  /// read-only server-side (design decision 4): only the JS app may mark
  /// messages as pulled.
  ///
  /// DEPLOYMENT ORDERING: requires a chat-service that understands
  /// markAsPulled. An OLD server ignores the unknown field AND fails this
  /// request with a 500 before marking anything pulled (its unconditional
  /// inbox-metadata update trips a NOT NULL constraint because the NSE sends
  /// no Vexl client-version header) - so against an old server the NSE
  /// merely falls back to generic content and never mutates state. Do not
  /// "fix" the missing client-version header here: it is what keeps the NSE
  /// harmless (no pulled-marking message-loss race) until the server change
  /// (packages/rest-api RetrieveMessagesRequest.markAsPulled) is deployed.
  public func retrieveMessages(
    publicKey: String,
    challenge: String,
    signature: String
  ) async throws -> [ServerMessage] {
    let response = try await send(
      method: "PUT",
      path: "api/v1/inboxes/messages",
      body: [
        "publicKey": publicKey,
        "signedChallenge": [
          "challenge": challenge,
          "signature": signature,
        ],
        "markAsPulled": false,
      ]
    )

    guard let messages = response["messages"] as? [[String: Any]] else {
      throw ChatApiError.malformedResponse
    }

    return messages.compactMap { message in
      guard let cypher = message["message"] as? String,
            let senderPublicKey = message["senderPublicKey"] as? String
      else {
        return nil
      }
      return ServerMessage(message: cypher, senderPublicKey: senderPublicKey)
    }
  }

  private func send(
    method: String,
    path: String,
    body: [String: Any]
  ) async throws -> [String: Any] {
    let url = baseUrl.appendingPathComponent(path)
    var request = URLRequest(url: url)
    request.httpMethod = method
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("IOS", forHTTPHeaderField: "X-Platform")
    for (header, value) in extraHeaders {
      request.setValue(value, forHTTPHeaderField: header)
    }
    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    let (data, response) = try await http.send(request)
    guard (200 ..< 300).contains(response.statusCode) else {
      throw ChatApiError.unexpectedStatus(response.statusCode)
    }
    guard let object = try? JSONSerialization.jsonObject(with: data),
          let dictionary = object as? [String: Any]
    else {
      throw ChatApiError.malformedResponse
    }
    return dictionary
  }
}
