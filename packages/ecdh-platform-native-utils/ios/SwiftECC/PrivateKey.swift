//
//  PrivateKey.swift
//  SwiftECC
//
//  Created by Leif Ibsen on 18/02/2020.
//

import Foundation
import CryptoKit



///
/// An Elliptic Curve private key
///
public class ECPrivateKey: CustomStringConvertible {

    static let AES128CBC_OID = ASN1ObjectIdentifier("2.16.840.1.101.3.4.1.2")!
    static let AES192CBC_OID = ASN1ObjectIdentifier("2.16.840.1.101.3.4.1.22")!
    static let AES256CBC_OID = ASN1ObjectIdentifier("2.16.840.1.101.3.4.1.42")!

    static let PBES2_OID = ASN1ObjectIdentifier("1.2.840.113549.1.5.13")!
    static let PBKDF2_OID = ASN1ObjectIdentifier("1.2.840.113549.1.5.12")!

    static let iterations = 2048
    static let saltLength = 8
    static let mda: MessageDigestAlgorithm = .SHA1


    // MARK: Initializers

    /// Creates a private key
    ///
    /// - Parameters:
    ///   - domain: The domain the key belongs to
    ///   - s: The secret key value
    /// - Throws: An exception if s < 1 or s >= the domain order
    public init(domain: Domain, s: BInt) throws {
        if s < BInt.ONE || s >= domain.order {
            throw ECException.privateKeyParameter
        }
        self.domain = domain
        self.s = s
    }

    /// Creates a private key from its DER encoding
    ///
    /// - Parameters:
    ///   - der: The DER encoding of the key
    ///   - pkcs8: *true* if the encoding is in PKCS#8 format - else *false*
    /// - Throws: An exception if the DER encoding is wrong
    public convenience init(der: Bytes, pkcs8: Bool = false) throws {
        let asn1 = try ASN1.build(der)
        guard let seq = asn1 as? ASN1Sequence else {
            throw ECException.asn1Structure
        }
        if seq.getValue().count < 3 {
            throw ECException.asn1Structure
        }
        var domain: Domain
        var s: BInt
        if pkcs8 {
            guard let seq1 = seq.get(1) as? ASN1Sequence else {
                throw ECException.asn1Structure
            }
            if seq1.getValue().count < 2 {
                throw ECException.asn1Structure
            }
            domain = try Domain.domainFromASN1(seq1.get(1))
            guard let octets = seq.get(2) as? ASN1OctetString else {
                throw ECException.asn1Structure
            }
            guard let seq2 = try ASN1.build(octets.value) as? ASN1Sequence else {
                throw ECException.asn1Structure
            }
            if seq2.getValue().count < 2 {
                throw ECException.asn1Structure
            }
            guard let mag = seq2.get(1) as? ASN1OctetString else {
                throw ECException.asn1Structure
            }
            s = BInt(magnitude: mag.value)
        } else {
            guard let mag = seq.get(1) as? ASN1OctetString else {
                throw ECException.asn1Structure
            }
            guard let ctx = seq.get(2) as? ASN1Ctx else {
                throw ECException.asn1Structure
            }
            guard let d = ctx.value else {
                throw ECException.asn1Structure
            }
            if d.count == 0 {
                throw ECException.asn1Structure
            }
            domain = try Domain.domainFromASN1(d[0])
            s = BInt(magnitude: mag.value)
        }
        try self.init(domain: domain, s: s)
    }

    /// Creates a private key from its PEM encoding.
    /// The PEM type is either 'PRIVATE KEY' meaning the format is PKCS#8,
    /// or it is 'EC PRIVATE KEY' meaning the format is not PKCS#8
    ///
    /// - Parameters:
    ///   - pem: The PEM encoding of the key
    /// - Throws: An exception if the PEM encoding is wrong
    public convenience init(pem: String) throws {
        if pem.starts(with: "-----BEGIN PRIVATE KEY") {
            try self.init(der: Base64.pemDecode(pem, "PRIVATE KEY"), pkcs8: true)
        } else {
            try self.init(der: Base64.pemDecode(pem, "EC PRIVATE KEY"), pkcs8: false)
        }
    }

    /// Creates a private key from its encrypted DER encoding.<br/>
    /// The key must have been encrypted with one of the ciphers AES-128, AES-192 or AES-256 in CBC mode.
    ///
    /// - Parameters:
    ///   - der: The DER encoding of the encrypted key
    ///   - password: The password
    /// - Throws: An exception if the DER encoding is wrong
    public convenience init(der: Bytes, password: Bytes) throws {
        let asn1 = try ASN1.build(der)
        guard let seq1 = asn1 as? ASN1Sequence else {
            throw ECException.asn1Structure
        }
        guard seq1.getValue().count == 2 else {
            throw ECException.asn1Structure
        }
        guard let seq2 = seq1.get(0) as? ASN1Sequence else {
            throw ECException.asn1Structure
        }
        guard seq2.getValue().count == 2 else {
            throw ECException.asn1Structure
        }
        guard let seq3 = seq2.get(1) as? ASN1Sequence else {
            throw ECException.asn1Structure
        }
        guard seq3.getValue().count == 2 else {
            throw ECException.asn1Structure
        }
        guard let seq4 = seq3.get(0) as? ASN1Sequence else {
            throw ECException.asn1Structure
        }
        guard seq4.getValue().count == 2 else {
            throw ECException.asn1Structure
        }
        guard let seq5 = seq4.get(1) as? ASN1Sequence else {
            throw ECException.asn1Structure
        }
        guard seq5.getValue().count == 2 else {
            throw ECException.asn1Structure
        }
        guard let seq6 = seq3.get(1) as? ASN1Sequence else {
            throw ECException.asn1Structure
        }
        guard seq6.getValue().count == 2 else {
            throw ECException.asn1Structure
        }

        guard let oid1 = seq2.get(0) as? ASN1ObjectIdentifier else {
            throw ECException.asn1Structure
        }
        guard oid1 == ECPrivateKey.PBES2_OID else {
            throw ECException.asn1Structure
        }
        guard let oid2 = seq4.get(0) as? ASN1ObjectIdentifier else {
            throw ECException.asn1Structure
        }
        guard oid2 == ECPrivateKey.PBKDF2_OID else {
            throw ECException.asn1Structure
        }
        guard let oid3 = seq6.get(0) as? ASN1ObjectIdentifier else {
            throw ECException.asn1Structure
        }
        var keySize: Int
        if oid3 == ECPrivateKey.AES128CBC_OID {
            keySize = AES.keySize128
        } else if oid3 == ECPrivateKey.AES192CBC_OID {
            keySize = AES.keySize192
        } else if oid3 == ECPrivateKey.AES256CBC_OID {
            keySize = AES.keySize256
        } else {
            throw ECException.asn1Structure
        }
        guard let iv = seq6.get(1) as? ASN1OctetString else {
            throw ECException.asn1Structure
        }
        guard iv.value.count == AES.blockSize else {
            throw ECException.asn1Structure
        }
        guard let salt = seq5.get(0) as? ASN1OctetString else {
            throw ECException.asn1Structure
        }
        guard let iterations = seq5.get(1) as? ASN1Integer else {
            throw ECException.asn1Structure
        }
        guard let octets = seq1.get(1) as? ASN1OctetString else {
            throw ECException.asn1Structure
        }
        let pbe = PBE(MessageDigest(ECPrivateKey.mda), password)
        let key = pbe.kdf2(salt.value, iterations.value.asInt()!, keySize)

        var c = octets.value
        let aes = CBCCipher(key, iv.value, [])
        _ = try aes.decrypt(&c)
        try self.init(der: c, pkcs8: true)
    }

    /// Creates a private key from its encrypted PEM encoding.<br/>
    /// The key must have been encrypted with one of the ciphers AES-128, AES-192 or AES-256 in CBC mode.<br/>
    /// The PEM type is 'ENCRYPTED PRIVATE KEY'
    ///
    /// - Parameters:
    ///   - pem: The PEM encoding of the encrypted key
    ///   - password: The password
    /// - Throws: An exception if the PEM encoding is wrong
    public convenience init(pem: String, password: Bytes) throws {
        try self.init(der: Base64.pemDecode(pem, "ENCRYPTED PRIVATE KEY"), password: password)
    }


    // MARK: Stored Properties

    /// The domain the key belongs to
    public let domain: Domain
    /// The private value - a positive integer
    public let s: BInt


    // MARK: Computed Properties

    /// The ASN1 encoding of *self*
    public var asn1: ASN1 { get { do { return ASN1Sequence().add(ASN1.ONE).add(ASN1OctetString(self.domain.align(self.s.asMagnitudeBytes()))).add(ASN1Ctx(0, [self.domain.asn1])).add(ASN1Ctx(1, [try ASN1BitString(self.domain.encodePoint(self.domain.multiplyG(self.s)), 0)])) } catch { return ASN1.NULL } } }
    /// The DER encoding of *self*
    public var der: Bytes { get { return self.asn1.encode() } }
    /// The PEM base 64 encoding of *self*
    public var pem: String { get { return Base64.pemEncode(self.der, "EC PRIVATE KEY") } }
    /// The DER encoding of *self* in PKCS#8 format
    public var derPkcs8: Bytes { get { return ASN1Sequence()
            .add(ASN1.ZERO)
            .add(ASN1Sequence().add(Domain.OID_EC).add(self.domain.asn1))
            .add(ASN1OctetString(self.asn1.encode())).encode() } }
    /// The PEM base 64 encoding of *self* in PKCS#8 format
    public var pemPkcs8: String { get { return Base64.pemEncode(self.derPkcs8, "PRIVATE KEY") } }
    /// A textual representation of the ASN1 encoding of *self*
    public var description: String { get { return self.asn1.description } }


    // MARK: Instance Methods

    /// Computes the password based encrypted encoding of *self* in DER format,<br/>
    /// using cipher block mode = CBC, iteration count = 2048 and salt = 8 random bytes
    ///
    /// - Parameters:
    ///   - password: The password
    ///   - cipher: the AES cipher to use
    /// - Returns: The DER encrypted encoding
    public func derEncrypted(password: Bytes, cipher: AESCipher) -> Bytes {
        var aesOid: ASN1ObjectIdentifier
        var keySize: Int
        switch cipher {
        case .AES128:
            aesOid = ECPrivateKey.AES128CBC_OID
            keySize = AES.keySize128
        case .AES192:
            aesOid = ECPrivateKey.AES192CBC_OID
            keySize = AES.keySize192
        case .AES256:
            aesOid = ECPrivateKey.AES256CBC_OID
            keySize = AES.keySize256
        }
        var salt = Bytes(repeating: 0, count: ECPrivateKey.saltLength)
        guard SecRandomCopyBytes(kSecRandomDefault, salt.count, &salt) == errSecSuccess else {
            fatalError("randomLimbs failed")
        }
        let pbe = PBE(MessageDigest(ECPrivateKey.mda), password)
        let key = pbe.kdf2(salt, ECPrivateKey.iterations, keySize)
        var iv = Bytes(repeating: 0, count: AES.blockSize)
        guard SecRandomCopyBytes(kSecRandomDefault, iv.count, &iv) == errSecSuccess else {
            fatalError("randomLimbs failed")
        }
        let cipher = CBCCipher(key, iv, [])
        var der = self.derPkcs8
        _ = cipher.encrypt(&der)
        let seq6 = ASN1Sequence().add(aesOid).add(ASN1OctetString(iv))
        let seq5 = ASN1Sequence().add(ASN1OctetString(salt)).add(ASN1Integer(BInt(ECPrivateKey.iterations)))
        let seq4 = ASN1Sequence().add(ECPrivateKey.PBKDF2_OID).add(seq5)
        let seq3 = ASN1Sequence().add(seq4).add(seq6)
        let seq2 = ASN1Sequence().add(ECPrivateKey.PBES2_OID).add(seq3)
        let seq1 = ASN1Sequence().add(seq2).add(ASN1OctetString(der))
        return seq1.encode()
    }

    /// Computes the password based encrypted encoding of *self* in PEM format,<br/>
    /// using cipher block mode = CBC, iteration count = 2048 and salt = 8 random bytes
    ///
    /// - Parameters:
    ///   - password: The password
    ///   - cipher: the AES cipher to use
    /// - Returns: The PEM encrypted encoding
    public func pemEncrypted(password: Bytes, cipher: AESCipher) -> String {
        return Base64.pemEncode(self.derEncrypted(password: password, cipher: cipher), "ENCRYPTED PRIVATE KEY")
    }

    /// Signs a byte array message with ECDSA
    ///
    /// - Parameters:
    ///   - msg: The message to sign
    ///   - deterministic: If *true* generate a deterministic signature according to RFC-6979, if *false* generate a non-deterministic signature - *false* is default
    /// - Returns: The signature
    public func sign(msg: Bytes, deterministic: Bool = false) -> ECSignature {
        let md = MessageDigest.instance(self.domain)
        md.update(msg)
        let digest = md.digest()
        let order = self.domain.order
        let k = deterministic ? DeterministicK(md, order, self.s).makeK(digest) : (order - BInt.ONE).randomLessThan() + BInt.ONE
        let R = self.domain.multiplyG(k)
        var h = BInt(magnitude: digest)
        let d = digest.count * 8 - order.bitWidth
        if d > 0 {
            h >>= d
        }
        let r = R.x.mod(order)
        let s = (k.modInverse(order) * (h + r * self.s)).mod(order)
        return ECSignature(domain: domain, r: self.domain.align(r.asMagnitudeBytes()), s: self.domain.align(s.asMagnitudeBytes()))
    }

    /// Signs a Data message with ECDSA
    ///
    /// - Parameters:
    ///   - msg: The message to sign
    ///   - deterministic: If *true* generate a deterministic signature according to RFC-6979, if *false* generate a non-deterministic signature - *false* is default
    /// - Returns: The signature
    public func sign(msg: Data, deterministic: Bool = false) -> ECSignature {
        return self.sign(msg: Bytes(msg), deterministic: deterministic)
    }

    func computeRS(_ msg: Bytes, _ tagLength: Int) throws -> (bwl: Int, R: Bytes, S: Point) {
        let bwl = 2 * ((self.domain.p.bitWidth + 7) / 8) + 1
        if msg.count < bwl + tagLength {
            throw ECException.notEnoughInput
        }
        let R = Bytes(msg[0 ..< bwl])
        let S = try self.domain.multiplyPoint(self.domain.decodePoint(R), self.s)
        if S.infinity {
            throw ECException.authentication
        }
        return (bwl, R, S)
    }

    /// Decrypts a byte array message with ECIES using the AES cipher<br/>
    /// Using this method with block mode GCM is deprecated. Use *decryptAESGCM* instead for much better performance
    ///
    /// - Parameters:
    ///   - msg: The bytes to decrypt
    ///   - cipher: The AES cipher to use
    ///   - mode: The block mode to use - GCM is default
    /// - Returns: The decrypted message
    /// - Throws: An exception if message authentication fails or the message is too short
    public func decrypt(msg: Bytes, cipher: AESCipher, mode: BlockMode = .GCM) throws -> Bytes {
        // [GUIDE] - algorithm 4.43
        let tagLength = mode == .GCM ? 16 : 32
        let (bwl, R, S) = try computeRS(msg, tagLength)
        let tag1 = Bytes(msg[msg.count - tagLength ..< msg.count])
        var result = Bytes(msg[bwl ..< msg.count - tagLength])
        let cipher = Cipher.instance(cipher, mode, self.domain.align(S.x.asMagnitudeBytes()), R)
        let tag2 = try cipher.decrypt(&result)
        if tag1 == tag2 {
            return result
        }
        throw ECException.authentication
    }

    /// Decrypts a Data message with ECIES using the AES cipher<br/>
    /// Using this method with block mode GCM is deprecated. Use *decryptAESGCM* instead for much better performance
    ///
    /// - Parameters:
    ///   - msg: The data to decrypt
    ///   - cipher: The AES cipher to use
    ///   - mode: The block mode to use - GCM is default
    /// - Returns: The decrypted message
    /// - Throws: An exception if message authentication fails or the message is too short
    public func decrypt(msg: Data, cipher: AESCipher, mode: BlockMode = .GCM) throws -> Data {
        return try Data(self.decrypt(msg: Bytes(msg), cipher: cipher, mode: mode))
    }

    /// Returns the AES key and HMAC key that were used to encrypt the message
    ///
    /// - Parameters:
    ///   - msg: The encrypted data
    ///   - cipher: The AES cipher that was used to encrypt
    ///   - mode: The block mode that was used to encrypt - GCM is default
    /// - Returns: The AES key and HMAC key that were used during encryption
    /// - Throws: An exception if the message is too short
    public func getKeyAndMac(msg: Bytes, cipher: AESCipher, mode: BlockMode = .GCM) throws -> (key: Bytes, mac: Bytes) {
        let tagLength = mode == .GCM ? 16 : 32
        let (_, R, S) = try computeRS(msg, tagLength)
        let keySize = cipher == .AES128 ? AES.keySize128 : (cipher == .AES192 ? AES.keySize192 : AES.keySize256)
        return Cipher.kdf(keySize, tagLength, self.domain.align(S.x.asMagnitudeBytes()), R)
    }

    /// Returns the AES key and HMAC key that were used to encrypt the message
    ///
    /// - Parameters:
    ///   - msg: The encrypted data
    ///   - cipher: The AES cipher that was used to encrypt
    ///   - mode: The block mode that was used to encrypt - GCM is default
    /// - Returns: The AES key and HMAC key that were used during encryption
    /// - Throws: An exception if the message is too short
    public func getKeyAndMac(msg: Data, cipher: AESCipher, mode: BlockMode = .GCM) throws -> (key: Data, mac: Data) {
        let (key, mac) = try self.getKeyAndMac(msg: Bytes(msg), cipher: cipher, mode: mode)
        return (Data(key), Data(mac))
    }

    /// Decrypts a byte array message with ECIES using the ChaCha20/Poly1305 algorithm - possibly with additional authenticated data
    ///
    /// - Parameters:
    ///   - msg: The bytes to decrypt
    ///   - aad: Additional authenticated data - an empty array is default
    /// - Returns: The decrypted message
    /// - Throws: An exception if message authentication fails or the message is too short
    public func decryptChaCha(msg: Bytes, aad: Bytes = []) throws -> Bytes {
        let tagLength = 16
        let (bwl, R, S) = try computeRS(msg, tagLength)
        let keySize = 32
        let cipherText = Bytes(msg[bwl ..< msg.count - tagLength])
        let tag = Bytes(msg[msg.count - tagLength ..< msg.count])
        let (key, nonce) = Cipher.kdf(keySize, 12, self.domain.align(S.x.asMagnitudeBytes()), R)
        do {
            let cryptoKitKey = CryptoKit.SymmetricKey(data: key)
            let cryptoKitNonce = try CryptoKit.ChaChaPoly.Nonce(data: nonce)
            let sealbox = try CryptoKit.ChaChaPoly.SealedBox(nonce: cryptoKitNonce, ciphertext: cipherText, tag: tag)
            return try Bytes(CryptoKit.ChaChaPoly.open(sealbox, using: cryptoKitKey, authenticating: aad))
        } catch {
            throw ECException.authentication
        }
    }

    /// Decrypts a Data message with ECIES using the ChaCha20/Poly1305 algorithm - possibly with additional authenticated data
    ///
    /// - Parameters:
    ///   - msg: The data to decrypt
    ///   - aad: Additional authenticated data - empty data is default
    /// - Returns: The decrypted message
    /// - Throws: An exception if message authentication fails or the message is too short
    public func decryptChaCha(msg: Data, aad: Data = Data()) throws -> Data {
        return try Data(self.decryptChaCha(msg: Bytes(msg), aad: Bytes(aad)))
    }

    /// Decrypts a byte array message with ECIES using the AES/GCM algorithm - possibly with additional authenticated data
    ///
    /// - Parameters:
    ///   - msg: The bytes to decrypt
    ///   - cipher: The AES cipher to use
    ///   - aad: Additional authenticated data - an empty array is default
    /// - Returns: The decrypted message
    /// - Throws: An exception if message authentication fails or the message is too short
    public func decryptAESGCM(msg: Bytes, cipher: AESCipher, aad: Bytes = []) throws -> Bytes {
        let tagLength = 16
        let (bwl, R, S) = try computeRS(msg, tagLength)
        let keySize = cipher == .AES128 ? AES.keySize128 : (cipher == .AES192 ? AES.keySize192 : AES.keySize256)
        let cipherText = Bytes(msg[bwl ..< msg.count - tagLength])
        let tag = Bytes(msg[msg.count - tagLength ..< msg.count])
        let (key, nonce) = Cipher.kdf(keySize, 12, self.domain.align(S.x.asMagnitudeBytes()), R)
        do {
            let cryptoKitKey = CryptoKit.SymmetricKey(data: key)
            let cryptoKitNonce = try CryptoKit.AES.GCM.Nonce(data: nonce)
            let sealbox = try CryptoKit.AES.GCM.SealedBox(nonce: cryptoKitNonce, ciphertext: cipherText, tag: tag)
            return try Bytes(CryptoKit.AES.GCM.open(sealbox, using: cryptoKitKey, authenticating: aad))
        } catch {
            throw ECException.authentication
        }
    }

    /// Decrypts a Data message with ECIES using the AES/GCM algorithm - possibly with additional authenticated data
    ///
    /// - Parameters:
    ///   - msg: The data to decrypt
    ///   - cipher: The AES cipher to use
    ///   - aad: Additional authenticated data - empty data is default
    /// - Returns: The decrypted message
    /// - Throws: An exception if message authentication fails or the message is too short
    public func decryptAESGCM(msg: Data, cipher: AESCipher, aad: Data = Data()) throws -> Data {
        return try Data(self.decryptAESGCM(msg: Bytes(msg), cipher: cipher, aad: Bytes(aad)))
    }

    /// Constructs a shared secret key using Diffie-Hellman key agreement - please refer [SEC 1] section 3.3.1
    ///
    /// - Parameters:
    ///   - pubKey: The other party's public key
    ///   - length: The required length of the shared secret
    ///   - md: The message digest algorithm to use
    ///   - sharedInfo: Information shared with the other party
    ///   - cofactor: Use cofactor version - *false* is default
    /// - Returns: A byte array which is the shared secret key
    /// - Throws: An exception if *this* and *pubKey* do not belong to the same domain or *length* is negative
    public func keyAgreement(pubKey: ECPublicKey, length: Int, md: MessageDigestAlgorithm, sharedInfo: Bytes, cofactor: Bool = false) throws -> Bytes {
        if self.domain != pubKey.domain {
            throw ECException.keyAgreementParameter
        }
        let mda = MessageDigest(md)
        if length >= mda.digestLength * 0xffffffff || length < 0 {
            throw ECException.keyAgreementParameter
        }
        var Z = try self.domain.multiplyPoint(pubKey.w, (cofactor ? self.domain.cofactor : 1) * self.s).x.asMagnitudeBytes()
        Z = self.domain.align(Z)

        // [SEC 1] - section 3.6.1

        var k: Bytes = []
        var counter: Bytes = [0, 0, 0, 1]
        let n = length == 0 ? 0 : (length - 1) / mda.digestLength + 1
        for _ in 0 ..< n {
            mda.update(Z)
            mda.update(counter)
            mda.update(sharedInfo)
            k += mda.digest()
            counter[3] &+= 1
            if counter[3] == 0 {
                counter[2] &+= 1
                if counter[2] == 0 {
                    counter[1] &+= 1
                    if counter[1] == 0 {
                        counter[0] &+= 1
                    }
                }
            }
        }
        return Bytes(k[0 ..< length])
    }


    /// Constructs a shared secret key using Diffie-Hellman key agreement - please refer [SEC 1] section 3.3.1
    /// This method coresponds to standard methods used for generating shared secret without hash or any added data.
    /// ECDH.computeSecret in NodeJs or KeyAgreement.generateSecret in Java
    ///
    ///
    /// - Parameters:
    ///   - pubKey: The other party's public key
    ///   - length: The required length of the shared secret TODO: length should be calculated automatically.
    /// - Returns: A byte array which is the shared secret key
    /// - Throws: An exception if *this* and *pubKey* do not belong to the same domain or *length* is negative
    public func keyAgreement(pubKey: ECPublicKey, length: Int) throws -> Bytes {
        if self.domain != pubKey.domain {
            throw ECException.keyAgreementParameter
        }

        if length < 0 {
            throw ECException.keyAgreementParameter
        }

        var Z = try self.domain.multiplyPoint(pubKey.w, self.s).x.asMagnitudeBytes()
        Z = self.domain.align(Z)

        // [SEC 1] - section 3.6.1
        // Directly concatenate Z, counter, and sharedInfo to get k, without hashing

        var k: Bytes = []
        var counter: Bytes = [0, 0, 0, 1]
        let n = length == 0 ? 0 : (length - 1) / Z.count + 1
        for _ in 0 ..< n {
            k += Z
            k += counter
            counter[3] &+= 1
            if counter[3] == 0 {
                counter[2] &+= 1
                if counter[2] == 0 {
                    counter[1] &+= 1
                    if counter[1] == 0 {
                        counter[0] &+= 1
                    }
                }
            }
        }
        return Bytes(k[0 ..< length])
    }


}
