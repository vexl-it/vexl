import CryptoKit
import Foundation

/// Errors for both ECIES schemes. Every error is a graceful-bail signal.
public enum EciesError: Error, Equatable {
  case invalidCiphertextFormat
  case macMismatch
  case decryptionFailed
  case invalidPlaintext
}

/// One length-prefixed part of the eciesLegacy wire format:
/// `<decimal char count of base64><literal 'A'><base64 chars>`.
/// Mirrors `getNextPart` in packages/cryptography/src/operations/eciesLegacy.ts.
struct EciesLegacyPart {
  let base64: String
  let endOffset: String.Index

  init(payload: String, startingAt start: String.Index) throws {
    var index = start
    var lengthChars = ""
    while true {
      guard index < payload.endIndex else { throw EciesError.invalidCiphertextFormat }
      let char = payload[index]
      if char == "A" { break }
      guard char.isASCII, char.isNumber else { throw EciesError.invalidCiphertextFormat }
      lengthChars.append(char)
      index = payload.index(after: index)
    }
    guard let length = Int(lengthChars, radix: 10), length >= 0 else {
      throw EciesError.invalidCiphertextFormat
    }
    let partStart = payload.index(after: index)
    guard let partEnd = payload.index(partStart, offsetBy: length, limitedBy: payload.endIndex)
    else {
      throw EciesError.invalidCiphertextFormat
    }
    self.base64 = String(payload[partStart ..< partEnd])
    self.endOffset = partEnd
  }
}

/// Decrypts a chat `MessageCypher` - the "ECIES legacy" AES-256-CTR scheme
/// from packages/cryptography/src/operations/eciesLegacy.ts. This is the
/// cipher used for chat messages on the wire (NOT eciesGTM).
public func eciesLegacyDecrypt(
  privateKeyPemBase64: String,
  payload: String
) throws -> String {
  // 1. Parse the three length-prefixed parts: ciphertext, mac, epk.
  let ciphertextPart = try EciesLegacyPart(payload: payload, startingAt: payload.startIndex)
  let macPart = try EciesLegacyPart(payload: payload, startingAt: ciphertextPart.endOffset)
  let epkPart = try EciesLegacyPart(payload: payload, startingAt: macPart.endOffset)

  guard let ciphertext = Data(base64Encoded: ciphertextPart.base64),
        let mac = Data(base64Encoded: macPart.base64),
        let epk = Data(base64Encoded: epkPart.base64)
  else {
    throw EciesError.invalidCiphertextFormat
  }

  // 2. Parse the inbox private key (throws VexlKeyError.unsupportedCurve for
  //    non-secp256k1 keys) and compute the raw-X ECDH shared secret.
  let privateKey = try VexlPrivateKey(pemBase64: privateKeyPemBase64)
  let sharedSecret = try ecdhSharedSecretX(
    privateScalar: privateKey.rawScalar,
    peerUncompressedPoint: epk
  )

  // 3. MAC check FIRST - HMAC-SHA256 over the base64 ciphertext string.
  let expectedMac = try vexlEciesMac(
    sharedSecret: sharedSecret,
    ciphertextBase64: ciphertextPart.base64
  )
  guard constantTimeEquals(expectedMac, mac) else { throw EciesError.macMismatch }

  // 4. Key + counter block: PBKDF2-HMAC-SHA1(sharedSecret, "vexlvexl", 2000, 108);
  //    key = [0,32), counter = [32,44) || 00 00 00 02.
  let stretched = try pbkdf2(password: sharedSecret, outputLength: 108, hash: .sha1)
  let key = stretched.subdata(in: 0 ..< 32)
  let counterBlock = stretched.subdata(in: 32 ..< 44) + Data([0x00, 0x00, 0x00, 0x02])

  // 5. AES-256-CTR decrypt.
  let decrypted = try aes256Ctr(key: key, counterBlock: counterBlock, data: ciphertext)

  // 6. Strip ALL trailing 0x00 bytes (removeEmptyBytesAtTheEnd parity), then
  //    UTF-8 decode.
  var plaintextBytes = decrypted
  while plaintextBytes.last == 0x00 {
    plaintextBytes.removeLast()
  }
  guard let plaintext = String(data: plaintextBytes, encoding: .utf8) else {
    throw EciesError.invalidPlaintext
  }
  return plaintext
}

func constantTimeEquals(_ lhs: Data, _ rhs: Data) -> Bool {
  guard lhs.count == rhs.count else { return false }
  var difference: UInt8 = 0
  for (l, r) in zip(lhs, rhs) {
    difference |= l ^ r
  }
  return difference == 0
}
