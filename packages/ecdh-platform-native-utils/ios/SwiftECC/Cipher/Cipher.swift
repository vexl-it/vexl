//
//  Cipher.swift
//  Test
//
//  Created by Leif Ibsen on 03/02/2020.
//

///
/// AES block ciphers available for encryption
///
public enum AESCipher: CaseIterable {
    /// AES 128 bit block cipher
    case AES128
    /// AES 192 bit block cipher
    case AES192
    /// AES 256 bit block cipher
    case AES256
}

///
/// Available block cipher modes
///
public enum BlockMode: CaseIterable {
    /// Cipher Block Chaining mode
    case CBC
    /// Cipher Feedback mode
    case CFB
    /// Counter mode
    case CTR
    /// Electronic Codebook mode
    case ECB
    /// Galois Counter mode
    case GCM
    /// Output Feedback mode
    case OFB
}

class Cipher {

    static let MD = MessageDigestAlgorithm.SHA2_256

    // All zero initialization vector
    static let iv = Bytes(repeating: 0, count: AES.blockSize)

    // X9.63 KDF functionality - please refer [SEC 1] section 3.6.1
    static func kdf(_ keySize: Int, _ macSize: Int, _ S: Bytes, _ R: Bytes) -> (key: Bytes, mac: Bytes) {
        var key = Bytes(repeating: 0, count: keySize)
        var mac = Bytes(repeating: 0, count: macSize)
        let md = MessageDigest(Cipher.MD)
        md.update(S)
        md.update([0, 0, 0, 1])
        md.update(R)
        let md1 = md.digest()
        md.update(S)
        md.update([0, 0, 0, 2])
        md.update(R)
        let md2 = md.digest()
        key = Bytes(md1[0 ..< keySize])
        if keySize + macSize < md.digestLength {
            mac = Bytes(md1[keySize ..< keySize + macSize])
        } else {
            mac = Bytes(md1[keySize ..< md.digestLength]) + Bytes(md2[0 ..< macSize + keySize - md.digestLength])
        }
        return (key, mac)
    }

    static func instance(_ cipher: AESCipher, _ mode: BlockMode, _ S: Bytes, _ R: Bytes) -> Cipher {
        var key: Bytes
        var macKey: Bytes
        let macSize = mode == .GCM ? 16 : 32
        switch cipher {
        case .AES128:
            (key, macKey) = kdf(AES.keySize128, macSize, S, R)
        case .AES192:
            (key, macKey) = kdf(AES.keySize192, macSize, S, R)
        case .AES256:
            (key, macKey) = kdf(AES.keySize256, macSize, S, R)
        }
        switch mode {
        case .CBC:
            return CBCCipher(key, Cipher.iv, macKey)
        case .CFB:
            return CFBCipher(key, Cipher.iv, macKey)
        case .CTR:
            return CTRCipher(key, Cipher.iv, macKey)
        case .ECB:
            return ECBCipher(key, macKey)
        case .GCM:
            return GCMCipher(key, macKey)
        case .OFB:
            return OFBCipher(key, Cipher.iv, macKey)
        }
    }

    let aes: AES
    let macKey: Bytes
    var encrypt: Bool

    init(_ key: Bytes, _ macKey: Bytes) {
        if key.count == AES.keySize128 {
            self.aes = AES(key, 10)
        } else if key.count == AES.keySize192 {
            self.aes = AES(key, 12)
        } else {
            self.aes = AES(key, 14)
        }
        self.macKey = macKey
        self.encrypt = true
    }

    func encrypt(_ input: inout Bytes) -> Bytes {
        self.encrypt = true
        do {
            var remaining = input.count
            var index = 0
            while remaining >= 0 {
                try processBuffer(&input, &index, &remaining)
            }
            let hMac = HMac(MessageDigest(Cipher.MD), self.macKey)
            hMac.update(input)
            return hMac.doFinal()
        } catch {
            fatalError("Cipher.encrypt inconsistency")
        }
    }

    func decrypt(_ input: inout Bytes) throws -> Bytes {
        self.encrypt = false
        let hMac = HMac(MessageDigest(Cipher.MD), self.macKey)
        hMac.update(input)
        let tag = hMac.doFinal()
        var remaining = input.count
        var index = 0
        while remaining >= 0 {
            try processBuffer(&input, &index, &remaining)
        }
        alignResult(&input, remaining)
        return tag
    }

    func processBuffer(_ input: inout Bytes, _ index: inout Int, _ remaining: inout Int) throws {
        fatalError("Cipher.processBuffer")
    }

    func alignResult(_ input: inout Bytes, _ remaining: Int) {
        // Do nothing
    }

}
