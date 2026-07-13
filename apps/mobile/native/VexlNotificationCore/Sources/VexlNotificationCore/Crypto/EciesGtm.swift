import CryptoKit
import Foundation

/// Decrypts an eciesGTM payload (AES-256-GCM scheme from
/// packages/cryptography/src/operations/ecies.ts + versionWrapper.ts).
///
/// NOTE: chat messages do NOT use this scheme - they use `eciesLegacyDecrypt`.
/// eciesGTM is only used for legacy notification-token cyphers; kept here for
/// wire-format parity and pinned by the shared test vectors.
///
/// Wire format: `000.` + base64(ciphertext) + `.` + base64(mac) + `.` +
/// base64(epk) + `.` + base64(gcmTag). The `000` prefix is the zero-padded
/// 3-digit encoding of (version - 1); only version 1 exists.
public func eciesGtmDecrypt(
  privateKeyPemBase64: String,
  payload: String
) throws -> String {
  let parts = payload.components(separatedBy: ".")
  guard parts.count == 5, parts[0] == "000" else {
    throw EciesError.invalidCiphertextFormat
  }

  let ciphertextBase64 = parts[1]
  // Parity with the reference TS parser, which rejects an empty ciphertext
  // segment ("Bad data") - an empty plaintext is not decryptable.
  guard !ciphertextBase64.isEmpty else { throw EciesError.invalidCiphertextFormat }

  guard let ciphertext = Data(base64Encoded: ciphertextBase64),
        let mac = Data(base64Encoded: parts[2]),
        let epk = Data(base64Encoded: parts[3]),
        let gcmTag = Data(base64Encoded: parts[4]),
        gcmTag.count == 16
  else {
    throw EciesError.invalidCiphertextFormat
  }

  let privateKey = try VexlPrivateKey(pemBase64: privateKeyPemBase64)
  let sharedSecret = try ecdhSharedSecretX(
    privateScalar: privateKey.rawScalar,
    peerUncompressedPoint: epk
  )

  // MAC check first - identical scheme to eciesLegacy.
  let expectedMac = try vexlEciesMac(
    sharedSecret: sharedSecret,
    ciphertextBase64: ciphertextBase64
  )
  guard constantTimeEquals(expectedMac, mac) else { throw EciesError.macMismatch }

  // Key + IV: PBKDF2-HMAC-SHA1(sharedSecret, "vexlvexl", 2000, 44);
  // key = [0,32), 12-byte GCM IV = [32,44).
  let stretched = try pbkdf2(password: sharedSecret, outputLength: 44, hash: .sha1)
  let key = SymmetricKey(data: stretched.subdata(in: 0 ..< 32))
  let iv = stretched.subdata(in: 32 ..< 44)

  do {
    let sealedBox = try AES.GCM.SealedBox(
      nonce: AES.GCM.Nonce(data: iv),
      ciphertext: ciphertext,
      tag: gcmTag
    )
    let decrypted = try AES.GCM.open(sealedBox, using: key)
    guard let plaintext = String(data: decrypted, encoding: .utf8) else {
      throw EciesError.invalidPlaintext
    }
    return plaintext
  } catch let error as EciesError {
    throw error
  } catch {
    throw EciesError.decryptionFailed
  }
}
