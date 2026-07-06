import Foundation

/// Orchestrates the whole NSE enrichment flow with injectable dependencies.
///
/// The contract is strictly graceful (design decision 6): `enrich` returns
/// nil on ANY miss - missing/legacy payload, unknown token, non-secp256k1
/// key, network failure, MAC mismatch, unparseable payloads, version gate,
/// missing localization - and the caller then delivers the original generic
/// content. It never throws.
public struct NotificationEnricher: Sendable {
  /// Ciphertexts longer than this are never decrypted. Text previews are
  /// tiny; big cyphers are image-bearing messages whose decryption could
  /// push the extension towards its ~24 MB jetsam limit (an oversized
  /// message simply keeps the generic content).
  public static let defaultMaxCiphertextLength = 128 * 1024

  private let keyStore: InboxKeyStore
  private let metadataStore: MetadataStore
  private let http: HttpClient
  /// The running binary's semver (CFBundleShortVersionString), used to mirror
  /// the `minimalRequiredVersion` gate.
  private let appSemver: String?
  private let localization: NotificationLocalization?
  private let maxCiphertextLength: Int

  public init(
    keyStore: InboxKeyStore,
    metadataStore: MetadataStore,
    http: HttpClient,
    appSemver: String?,
    localization: NotificationLocalization? = NotificationLocalization.loadBundled(),
    maxCiphertextLength: Int = NotificationEnricher.defaultMaxCiphertextLength
  ) {
    self.keyStore = keyStore
    self.metadataStore = metadataStore
    self.http = http
    self.appSemver = appSemver
    self.localization = localization
    self.maxCiphertextLength = maxCiphertextLength
  }

  public func enrich(userInfo: [AnyHashable: Any]) async -> RenderedNotification? {
    // 1. Only payloads with a vexl_nt_ targetToken are enrichable.
    guard let payload = NotificationPayloadParser.parse(userInfo: userInfo) else { return nil }

    // 2. Bridge stores: token -> inbox keyholder, plus metadata.
    // (`try?` flattens the double optional: nil = error OR unknown token.)
    guard let keyPair = try? keyStore.inboxKeyPair(forVexlToken: payload.targetToken),
          let metadata = try? metadataStore.loadMetadata(),
          let localization
    else {
      return nil
    }

    // 3. Only secp256k1 inbox keys are supported (design decision 2). Parse
    //    up front so wrong-curve keys bail before any network traffic.
    guard (try? VexlPrivateKey(pemBase64: keyPair.privateKeyPemBase64)) != nil else {
      return nil
    }

    // 4. Read-only fetch: createChallenge -> sign -> retrieveMessages(false).
    guard let client = try? ChatApiClient(chatServiceUrl: metadata.chatServiceUrl, http: http)
    else {
      return nil
    }

    let serverMessages: [ServerMessage]
    do {
      let challenge = try await client.createChallenge(
        publicKey: keyPair.publicKeyPemBase64
      )
      let signature = try signChallenge(
        challenge: challenge,
        privateKeyPemBase64: keyPair.privateKeyPemBase64
      )
      serverMessages = try await client.retrieveMessages(
        publicKey: keyPair.publicKeyPemBase64,
        challenge: challenge,
        signature: signature
      )
    } catch {
      return nil
    }

    // 5. Decrypt + parse the messages, skipping failures and oversized
    //    cyphers (memory guard), keep previewable ones. The push carries no
    //    message id, only a `sentAt` timestamp - pick the candidate closest
    //    in time to this push, so bursts of pushes preview their own
    //    messages instead of all showing the globally newest one.
    let candidates: [(message: DecryptedChatMessage, senderPublicKey: String)] =
      serverMessages.compactMap { serverMessage in
        guard serverMessage.message.count <= maxCiphertextLength,
              let plaintext = try? eciesLegacyDecrypt(
                privateKeyPemBase64: keyPair.privateKeyPemBase64,
                payload: serverMessage.message
              ),
              let parsed = DecryptedChatMessage.parse(plaintextJson: plaintext),
              parsed.isPreviewable(appSemver: appSemver)
        else {
          return nil
        }
        return (parsed, serverMessage.senderPublicKey)
      }

    guard let chosen = Self.pickPreviewCandidate(candidates, sentAt: payload.sentAt) else {
      return nil
    }

    // 6. Render: sender display name from the synced map (nil is fine - the
    //    localized generic strings are used, matching the JS behavior for
    //    unknown counterparties).
    return NotificationRenderer.render(
      message: chosen.message,
      inboxPublicKey: keyPair.publicKeyPemBase64,
      senderPublicKey: chosen.senderPublicKey,
      displayName: metadata.displayName(
        inbox: keyPair.publicKeyPemBase64,
        sender: chosen.senderPublicKey
      ),
      locale: metadata.locale,
      localization: localization
    )
  }

  /// With a push `sentAt`, picks the candidate whose (sender-clock) `time` is
  /// closest to it - newer wins ties. Without one, falls back to the newest
  /// message. `message.time` comes from the sender's device clock, so
  /// closest-by-absolute-distance is more robust than "not newer than".
  static func pickPreviewCandidate(
    _ candidates: [(message: DecryptedChatMessage, senderPublicKey: String)],
    sentAt: Int64?
  ) -> (message: DecryptedChatMessage, senderPublicKey: String)? {
    guard let sentAt else {
      return candidates.max(by: { $0.message.time < $1.message.time })
    }
    return candidates.min { lhs, rhs in
      let lhsDistance = Self.timeDistance(lhs.message.time, to: sentAt)
      let rhsDistance = Self.timeDistance(rhs.message.time, to: sentAt)
      if lhsDistance != rhsDistance { return lhsDistance < rhsDistance }
      return lhs.message.time > rhs.message.time
    }
  }

  /// Overflow-safe |time - sentAt| (`time` is attacker-controlled JSON; a
  /// plain subtraction could trap on extreme values).
  static func timeDistance(_ time: Int64, to sentAt: Int64) -> UInt64 {
    let difference = time.subtractingReportingOverflow(sentAt)
    return difference.overflow ? UInt64.max : difference.partialValue.magnitude
  }
}
