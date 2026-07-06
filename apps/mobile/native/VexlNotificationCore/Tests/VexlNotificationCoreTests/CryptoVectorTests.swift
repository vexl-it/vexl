import XCTest

@testable import VexlNotificationCore

/// Pins the Swift crypto implementations to the reference TypeScript
/// implementation via the shared vectors in
/// packages/cryptography/test-vectors/nse-test-vectors.json.
final class CryptoVectorTests: XCTestCase {
  // MARK: - Key decoding

  func testPrivateKeyPemDecodingMatchesRawScalars() throws {
    let vectors = try TestVectors.load()
    for key in vectors.keys {
      XCTAssertEqual(key.curve, "secp256k1")
      let privateKey = try VexlPrivateKey(pemBase64: key.privateKeyPemBase64)
      XCTAssertEqual(
        hexString(privateKey.rawScalar),
        key.privateKeyRawHex,
        "private scalar mismatch for \(key.id)"
      )
    }
  }

  /// ~1/256 real inbox keys have a scalar starting with 0x00; their PEM DER
  /// stores a stripped short scalar which VexlPrivateKey must left-pad. The
  /// shared vectors must keep pinning that decode path (the padded-scalar
  /// equality itself is asserted by testPrivateKeyPemDecodingMatchesRawScalars).
  func testVectorsIncludeALeadingZeroScalarKey() throws {
    let vectors = try TestVectors.load()
    XCTAssertTrue(
      vectors.keys.contains { $0.privateKeyRawHex.hasPrefix("00") },
      "vectors must contain a stripped-leading-zero DER scalar key"
    )
  }

  func testPublicKeyPemDecodingMatchesUncompressedPoints() throws {
    let vectors = try TestVectors.load()
    for key in vectors.keys {
      let publicKey = try VexlPublicKey(pemBase64: key.publicKeyPemBase64)
      XCTAssertEqual(
        hexString(publicKey.uncompressedPoint),
        key.publicKeyRawUncompressedHex,
        "public point mismatch for \(key.id)"
      )
    }
  }

  /// secp224r1 keys must be rejected with the wrong-curve bail signal
  /// (design decision 2). Fixtures generated with
  /// `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:secp224r1`.
  func testSecp224r1PrivateKeyIsRejectedAsUnsupportedCurve() {
    let secp224r1PrivatePemBase64 =
      "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1IZ0NBUUF3RUFZSEtvWkl6ajBDQVFZRks0RUVBQ0VFWVRCZkFnRUJCQnhMWDh1aTVMMHFZWEpoSGlTZDJJcXIKeCtMWisrd05PY1B1VW1kdG9Ud0RPZ0FFYlpVRUZ5eWVzeHdJQ29hTDhDU3ZFUDZXT3BsV0Q0WWJQK1g0VVBLUApMNXZlZGZkUXoyUmR3ZE1ENFRISU1JL3RsUHpnT3JQamc3OD0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo="
    XCTAssertThrowsError(
      try VexlPrivateKey(pemBase64: secp224r1PrivatePemBase64)
    ) { error in
      XCTAssertEqual(error as? VexlKeyError, .unsupportedCurve)
    }
  }

  func testSecp224r1PublicKeyIsRejectedAsUnsupportedCurve() {
    let secp224r1PublicPemBase64 =
      "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUVvcXYxMkpZMkp3QTJyazBkamZoSlNOQklOclVWSTVNTQpON2I1OUVEMVdlY2NTTjI3THNHdnVWbWtQTXZmRW9mS3kzZVBEekNmRlNBPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K"
    XCTAssertThrowsError(
      try VexlPublicKey(pemBase64: secp224r1PublicPemBase64)
    ) { error in
      XCTAssertEqual(error as? VexlKeyError, .unsupportedCurve)
    }
  }

  func testGarbageKeysAreRejected() {
    XCTAssertThrowsError(try VexlPrivateKey(pemBase64: "not-base64!!"))
    XCTAssertThrowsError(try VexlPrivateKey(pemBase64: Data("hello".utf8).base64EncodedString()))
    XCTAssertThrowsError(try VexlPublicKey(pemBase64: ""))
  }

  // MARK: - ECIES legacy (chat message cipher)

  func testEciesLegacyDecryptVectors() throws {
    let vectors = try TestVectors.load()
    XCTAssertFalse(vectors.eciesLegacyDecrypt.isEmpty)

    for vector in vectors.eciesLegacyDecrypt {
      if vector.valid {
        let plaintext = try eciesLegacyDecrypt(
          privateKeyPemBase64: vector.recipientPrivateKey,
          payload: vector.ciphertext
        )
        XCTAssertEqual(plaintext, vector.expectedPlaintext, "vector \(vector.id)")
      } else {
        XCTAssertThrowsError(
          try eciesLegacyDecrypt(
            privateKeyPemBase64: vector.recipientPrivateKey,
            payload: vector.ciphertext
          ),
          "vector \(vector.id) must fail gracefully"
        )
      }
    }
  }

  func testEciesLegacyRejectsMalformedPayloads() {
    let vectors = try? TestVectors.load()
    let key = vectors?.keys.first?.privateKeyPemBase64 ?? ""

    for malformed in [
      "",
      "A",
      "xA",
      "5Aabc", // declared length exceeds remaining chars
      "4Aabcd", // only one part
      "0A0A", // two empty parts, missing epk
      "9999999999999999999Aabc",
    ] {
      XCTAssertThrowsError(
        try eciesLegacyDecrypt(privateKeyPemBase64: key, payload: malformed),
        "payload \(malformed) must be rejected"
      )
    }
  }

  // MARK: - ECIES GTM (notification token cypher; reference parity only)

  func testEciesGtmDecryptVectors() throws {
    let vectors = try TestVectors.load()
    XCTAssertFalse(vectors.eciesGTMDecrypt.isEmpty)

    for vector in vectors.eciesGTMDecrypt {
      if vector.valid {
        let plaintext = try eciesGtmDecrypt(
          privateKeyPemBase64: vector.recipientPrivateKey,
          payload: vector.ciphertext
        )
        XCTAssertEqual(plaintext, vector.expectedPlaintext, "vector \(vector.id)")
      } else {
        XCTAssertThrowsError(
          try eciesGtmDecrypt(
            privateKeyPemBase64: vector.recipientPrivateKey,
            payload: vector.ciphertext
          ),
          "vector \(vector.id) must fail gracefully"
        )
      }
    }
  }

  // MARK: - ECDSA challenge signing

  /// Verifies the TS-produced signatures (OpenSSL, possibly high-S) in Swift.
  func testEcdsaVerifyVectors() throws {
    let vectors = try TestVectors.load()
    XCTAssertFalse(vectors.ecdsaVerify.isEmpty)

    for vector in vectors.ecdsaVerify {
      let result = verifySignature(
        message: vector.message,
        signatureBase64Der: vector.signature,
        publicKeyPemBase64: vector.publicKey
      )
      XCTAssertEqual(result, vector.valid, "vector \(vector.id)")
    }
  }

  /// Sign-then-self-verify roundtrip over every key and challenge message,
  /// plus format pinning: base64 (standard, padded) of plain DER.
  func testEcdsaSignRoundtripAndFormat() throws {
    let vectors = try TestVectors.load()
    let challenges = ["CBCiph-abcDEF123+/=", "hello vexl", ""]
      + vectors.ecdsaVerify.map(\.message)

    for key in vectors.keys {
      for challenge in challenges {
        let signature = try signChallenge(
          challenge: challenge,
          privateKeyPemBase64: key.privateKeyPemBase64
        )

        // Standard base64 of DER SEQUENCE.
        let derData = Data(base64Encoded: signature)
        XCTAssertNotNil(derData, "signature must be standard base64")
        XCTAssertEqual(derData?.first, 0x30, "signature must be a DER SEQUENCE")
        // Short-form DER length must cover the whole buffer (trimBase64Der
        // parity: buffer trimmed to data[1] + 2).
        if let derData {
          XCTAssertEqual(Int(derData[1]) + 2, derData.count)
        }

        XCTAssertTrue(
          verifySignature(
            message: challenge,
            signatureBase64Der: signature,
            publicKeyPemBase64: key.publicKeyPemBase64
          ),
          "self-verify failed for key \(key.id)"
        )

        // A different message must not verify.
        XCTAssertFalse(
          verifySignature(
            message: challenge + "x",
            signatureBase64Der: signature,
            publicKeyPemBase64: key.publicKeyPemBase64
          )
        )
      }
    }
  }

  // MARK: - sha256 helper parity

  func testSha256Base64MatchesNodeDigest() {
    // node: crypto.createHash('sha256').update('vexl').digest('base64')
    XCTAssertEqual(sha256Base64("vexl"), "viPMLilo5idlwELNTqUYQsJnVrLlFrq1VuettF1brrk=")
  }
}
