import Foundation
import P256K

public enum ChallengeSignError: Error, Equatable {
  case signingFailed
}

/// ECDSA-signs a chat-service challenge exactly like the TS reference
/// (packages/cryptography/src/operations/ecdsa.ts `ecdsaSign`):
/// SHA-256 over the UTF-8 bytes of the challenge string as-is (including the
/// `CBCiph-` prefix), DER `SEQUENCE { r INTEGER, s INTEGER }`, standard
/// base64. libsecp256k1 produces low-S signatures, which the server's OpenSSL
/// verify accepts.
public func signChallenge(
  challenge: String,
  privateKeyPemBase64: String
) throws -> String {
  let privateKey = try VexlPrivateKey(pemBase64: privateKeyPemBase64)
  let signingKey: P256K.Signing.PrivateKey
  do {
    signingKey = try P256K.Signing.PrivateKey(dataRepresentation: privateKey.rawScalar)
  } catch {
    throw ChallengeSignError.signingFailed
  }
  // signature(for: DataProtocol) hashes with SHA-256 internally.
  let signature = signingKey.signature(for: Data(challenge.utf8))
  return signature.derRepresentation.base64EncodedString()
}

/// Verifies a base64 DER ECDSA signature over the UTF-8 message (SHA-256).
///
/// Used by tests to pin sign/verify parity with the TS implementation. TS
/// (OpenSSL) signatures are NOT low-S normalized, while libsecp256k1's verify
/// rejects high-S signatures - so the s scalar is normalized before verifying.
public func verifySignature(
  message: String,
  signatureBase64Der: String,
  publicKeyPemBase64: String
) -> Bool {
  guard let derSignature = Data(base64Encoded: signatureBase64Der),
        let publicKey = try? VexlPublicKey(pemBase64: publicKeyPemBase64),
        let verifyingKey = try? P256K.Signing.PublicKey(
          dataRepresentation: publicKey.uncompressedPoint,
          format: .uncompressed
        ),
        let parsed = try? P256K.Signing.ECDSASignature(derRepresentation: derSignature),
        let normalized = try? P256K.Signing.ECDSASignature(
          compactRepresentation: lowSNormalized(compactSignature: parsed.compactRepresentation)
        )
  else {
    return false
  }

  return verifyingKey.isValidSignature(normalized, for: Data(message.utf8))
}

/// secp256k1 group order n, big-endian.
private let secp256k1OrderN: [UInt8] = [
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE,
  0xBA, 0xAE, 0xDC, 0xE6, 0xAF, 0x48, 0xA0, 0x3B,
  0xBF, 0xD2, 0x5E, 0x8C, 0xD0, 0x36, 0x41, 0x41,
]

/// n / 2, big-endian.
private let secp256k1HalfOrderN: [UInt8] = [
  0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
  0x5D, 0x57, 0x6E, 0x73, 0x57, 0xA4, 0x50, 0x1D,
  0xDF, 0xE9, 0x2F, 0x46, 0x68, 0x1B, 0x20, 0xA0,
]

/// Given a 64-byte compact signature (r || s, big-endian), returns a compact
/// signature with s replaced by n - s when s > n/2 (BIP-62 low-S form).
func lowSNormalized(compactSignature: Data) -> Data {
  guard compactSignature.count == 64 else { return compactSignature }
  let r = Array(compactSignature.prefix(32))
  var s = Array(compactSignature.suffix(32))

  if compareBigEndian(s, secp256k1HalfOrderN) > 0 {
    s = subtractBigEndian(secp256k1OrderN, s)
  }
  return Data(r + s)
}

/// Compares two equal-length big-endian byte arrays: -1, 0 or 1.
private func compareBigEndian(_ lhs: [UInt8], _ rhs: [UInt8]) -> Int {
  for (l, r) in zip(lhs, rhs) {
    if l < r { return -1 }
    if l > r { return 1 }
  }
  return 0
}

/// lhs - rhs for equal-length big-endian byte arrays; assumes lhs >= rhs.
private func subtractBigEndian(_ lhs: [UInt8], _ rhs: [UInt8]) -> [UInt8] {
  var result = [UInt8](repeating: 0, count: lhs.count)
  var borrow = 0
  for index in stride(from: lhs.count - 1, through: 0, by: -1) {
    var difference = Int(lhs[index]) - Int(rhs[index]) - borrow
    if difference < 0 {
      difference += 256
      borrow = 1
    } else {
      borrow = 0
    }
    result[index] = UInt8(difference)
  }
  return result
}
