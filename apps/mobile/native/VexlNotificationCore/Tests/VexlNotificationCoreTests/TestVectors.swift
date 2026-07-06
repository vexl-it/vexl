import Foundation
import XCTest

/// Codable mirror of packages/cryptography/test-vectors/nse-test-vectors.json
/// (schema: packages/cryptography/src/testVectors/nseTestVectorsFile.ts).
struct NseTestVectorsFile: Decodable {
  struct Key: Decodable {
    let id: String
    let curve: String
    let privateKeyPemBase64: String
    let publicKeyPemBase64: String
    let privateKeyRawHex: String
    let publicKeyRawUncompressedHex: String
  }

  struct EciesDecryptVector: Decodable {
    let id: String
    let keyId: String
    let recipientPrivateKey: String
    let recipientPublicKey: String
    let ciphertext: String
    let expectedPlaintext: String
    let valid: Bool
    let note: String?
  }

  struct EcdsaVerifyVector: Decodable {
    let id: String
    let keyId: String
    let privateKey: String
    let publicKey: String
    let message: String
    let signature: String
    let valid: Bool
    let note: String?
  }

  let keys: [Key]
  let eciesGTMDecrypt: [EciesDecryptVector]
  let eciesLegacyDecrypt: [EciesDecryptVector]
  let ecdsaVerify: [EcdsaVerifyVector]
}

enum TestVectors {
  static let relativePath = "packages/cryptography/test-vectors/nse-test-vectors.json"

  /// Walks up from this source file until the pnpm workspace root, so the
  /// vectors JSON stays single-sourced in packages/cryptography.
  static func repoRoot(filePath: String = #filePath) throws -> URL {
    var directory = URL(fileURLWithPath: filePath).deletingLastPathComponent()
    for _ in 0 ..< 12 {
      let marker = directory.appendingPathComponent("pnpm-workspace.yaml")
      if FileManager.default.fileExists(atPath: marker.path) {
        return directory
      }
      directory = directory.deletingLastPathComponent()
    }
    throw XCTSkip("Repo root (pnpm-workspace.yaml) not found - vectors unavailable")
  }

  static func load() throws -> NseTestVectorsFile {
    let url = try repoRoot().appendingPathComponent(relativePath)
    let data = try Data(contentsOf: url)
    return try JSONDecoder().decode(NseTestVectorsFile.self, from: data)
  }
}

func hexString(_ data: Data) -> String {
  data.map { String(format: "%02x", $0) }.joined()
}
