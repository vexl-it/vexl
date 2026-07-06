import CommonCrypto
import CryptoKit
import Foundation
import P256K

enum VexlCryptoError: Error, Equatable {
  case pbkdf2Failed
  case aesCtrFailed
  case ecdhFailed
  case invalidEphemeralPublicKey
}

/// Constants mirrored from packages/cryptography/src/constants.ts
enum VexlCryptoConstants {
  /// "vexlvexl" as UTF-8
  static let salt = Data("vexlvexl".utf8)
  static let pbkdf2Iterations = 2000
}

enum Pbkdf2Hash {
  case sha1
  case sha256

  var algorithm: CCPseudoRandomAlgorithm {
    switch self {
    case .sha1: return CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA1)
    case .sha256: return CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256)
    }
  }
}

/// PBKDF2 exactly as used by packages/cryptography (Node crypto.pbkdf2).
func pbkdf2(
  password: Data,
  salt: Data = VexlCryptoConstants.salt,
  iterations: Int = VexlCryptoConstants.pbkdf2Iterations,
  outputLength: Int,
  hash: Pbkdf2Hash
) throws -> Data {
  var derived = Data(repeating: 0, count: outputLength)
  let status = derived.withUnsafeMutableBytes { derivedBytes in
    password.withUnsafeBytes { passwordBytes in
      salt.withUnsafeBytes { saltBytes in
        CCKeyDerivationPBKDF(
          CCPBKDFAlgorithm(kCCPBKDF2),
          passwordBytes.bindMemory(to: Int8.self).baseAddress,
          password.count,
          saltBytes.bindMemory(to: UInt8.self).baseAddress,
          salt.count,
          hash.algorithm,
          UInt32(iterations),
          derivedBytes.bindMemory(to: UInt8.self).baseAddress,
          outputLength
        )
      }
    }
  }
  guard status == kCCSuccess else { throw VexlCryptoError.pbkdf2Failed }
  return derived
}

/// AES-256-CTR with a full 16-byte initial counter block (big-endian counter),
/// matching Node's `aes-256-ctr`. Encrypt and decrypt are the same operation.
func aes256Ctr(key: Data, counterBlock: Data, data: Data) throws -> Data {
  precondition(key.count == kCCKeySizeAES256)
  precondition(counterBlock.count == kCCBlockSizeAES128)

  var cryptor: CCCryptorRef?
  let createStatus = key.withUnsafeBytes { keyBytes in
    counterBlock.withUnsafeBytes { ivBytes in
      CCCryptorCreateWithMode(
        CCOperation(kCCEncrypt), // CTR mode: encrypt == decrypt
        CCMode(kCCModeCTR),
        CCAlgorithm(kCCAlgorithmAES),
        CCPadding(ccNoPadding),
        ivBytes.baseAddress,
        keyBytes.baseAddress,
        key.count,
        nil,
        0,
        0,
        0,
        &cryptor
      )
    }
  }
  guard createStatus == kCCSuccess, let cryptor else { throw VexlCryptoError.aesCtrFailed }
  defer { CCCryptorRelease(cryptor) }

  var output = Data(repeating: 0, count: data.count + kCCBlockSizeAES128)
  var totalMoved = 0
  let updateStatus = output.withUnsafeMutableBytes { outputBytes in
    data.withUnsafeBytes { dataBytes -> CCCryptorStatus in
      var moved = 0
      let status = CCCryptorUpdate(
        cryptor,
        dataBytes.baseAddress,
        data.count,
        outputBytes.baseAddress,
        outputBytes.count,
        &moved
      )
      totalMoved = moved
      return status
    }
  }
  guard updateStatus == kCCSuccess else { throw VexlCryptoError.aesCtrFailed }
  return output.prefix(totalMoved)
}

/// Raw-X ECDH over secp256k1, matching Node/OpenSSL `ECDH.computeSecret`
/// semantics: the 32-byte big-endian X coordinate of the shared point.
///
/// swift-secp256k1's default key agreement would SHA-256 the compressed point;
/// we request the uncompressed serialized point and slice out X instead.
func ecdhSharedSecretX(
  privateScalar: Data,
  peerUncompressedPoint: Data
) throws -> Data {
  guard peerUncompressedPoint.count == 65, peerUncompressedPoint.first == 0x04 else {
    throw VexlCryptoError.invalidEphemeralPublicKey
  }
  let privateKey: P256K.KeyAgreement.PrivateKey
  let peerKey: P256K.KeyAgreement.PublicKey
  do {
    privateKey = try P256K.KeyAgreement.PrivateKey(dataRepresentation: privateScalar)
    peerKey = try P256K.KeyAgreement.PublicKey(
      dataRepresentation: peerUncompressedPoint,
      format: .uncompressed
    )
  } catch {
    throw VexlCryptoError.ecdhFailed
  }

  let sharedPoint = privateKey.sharedSecretFromKeyAgreement(
    with: peerKey,
    format: .uncompressed
  )
  // Uncompressed point: 0x04 || X(32) || Y(32) - take X.
  let pointBytes = sharedPoint.withUnsafeBytes { Data($0) }
  guard pointBytes.count == 65 else { throw VexlCryptoError.ecdhFailed }
  return pointBytes.subdata(in: 1 ..< 33)
}

/// HMAC-SHA256 keyed per the Vexl ECIES MAC scheme: key =
/// PBKDF2-HMAC-SHA256(sharedSecret, "vexlvexl", 2000, 108)[44..108), input =
/// the ASCII bytes of the base64 ciphertext STRING as it appears on the wire.
func vexlEciesMac(sharedSecret: Data, ciphertextBase64: String) throws -> Data {
  let macKeyMaterial = try pbkdf2(password: sharedSecret, outputLength: 108, hash: .sha256)
  let macKey = SymmetricKey(data: macKeyMaterial.subdata(in: 44 ..< 108))
  let mac = HMAC<CryptoKit.SHA256>.authenticationCode(
    for: Data(ciphertextBase64.utf8),
    using: macKey
  )
  return Data(mac)
}

/// base64(SHA256(utf8(input))) - parity with
/// packages/cryptography/src/operations/sha.ts `sha256`.
public func sha256Base64(_ input: String) -> String {
  Data(CryptoKit.SHA256.hash(data: Data(input.utf8))).base64EncodedString()
}
