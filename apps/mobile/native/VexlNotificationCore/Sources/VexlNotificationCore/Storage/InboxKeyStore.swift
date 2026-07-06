import Foundation
import Security

/// The keyholder mapped to a vexl notification token - the same shape the JS
/// side keeps in the `vexlTokenToKeyHolder` MMKV atom.
public struct InboxKeyPair: Codable, Equatable, Sendable {
  public let privateKeyPemBase64: String
  public let publicKeyPemBase64: String

  public init(privateKeyPemBase64: String, publicKeyPemBase64: String) {
    self.privateKeyPemBase64 = privateKeyPemBase64
    self.publicKeyPemBase64 = publicKeyPemBase64
  }
}

public protocol InboxKeyStore: Sendable {
  /// Returns nil for unknown tokens; throws only on unexpected store errors.
  /// Both outcomes make the NSE bail to generic content.
  func inboxKeyPair(forVexlToken token: String) throws -> InboxKeyPair?
}

public enum KeychainError: Error {
  case unexpectedStatus(OSStatus)
  case malformedItem
}

/// Read side of the keychain bridge store. One generic-password item per
/// vexl token (service = NseBridgeConstants.keychainInboxKeysService,
/// account = token, access group = the shared app group). Items are written
/// by the vexl-nse-bridge Expo module with
/// kSecAttrAccessibleAfterFirstUnlock so the NSE can read while the device
/// is locked (post first unlock).
public struct KeychainInboxKeyStore: InboxKeyStore {
  private let accessGroup: String

  public init(accessGroup: String) {
    self.accessGroup = accessGroup
  }

  public func inboxKeyPair(forVexlToken token: String) throws -> InboxKeyPair? {
    let query: [CFString: Any] = [
      kSecClass: kSecClassGenericPassword,
      kSecAttrService: NseBridgeConstants.keychainInboxKeysService,
      kSecAttrAccount: token,
      kSecAttrAccessGroup: accessGroup,
      kSecReturnData: true,
      kSecMatchLimit: kSecMatchLimitOne,
    ]

    var result: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    switch status {
    case errSecSuccess:
      guard let data = result as? Data else { throw KeychainError.malformedItem }
      guard let keyPair = try? JSONDecoder().decode(InboxKeyPair.self, from: data) else {
        throw KeychainError.malformedItem
      }
      return keyPair
    case errSecItemNotFound:
      return nil
    default:
      throw KeychainError.unexpectedStatus(status)
    }
  }
}
