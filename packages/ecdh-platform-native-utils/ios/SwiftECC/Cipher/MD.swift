//
//  MD.swift
//  AEC
//
//  Created by Leif Ibsen on 05/01/2020.
//

typealias Word = UInt32
typealias Words = [Word]

typealias Limb = UInt64
typealias Limbs = [Limb]

///
/// Message digest algorithms
///
public enum MessageDigestAlgorithm: CaseIterable {
    /// SHA1
    case SHA1
    /// SHA2 224
    case SHA2_224
    /// SHA2 256
    case SHA2_256
    /// SHA2 384
    case SHA2_384
    /// SHA2 512
    case SHA2_512
}

protocol MessageDigestImpl {
    func doBuffer(_ buffer: inout Bytes, _ hw: inout Words, _ hl: inout Limbs)
    func doReset(_ hw: inout Words, _ hl: inout Limbs)
    func padding(_ totalBytes: Int, _ blockSize: Int) -> Bytes
}

class MessageDigest {
    
    let impl: MessageDigestImpl
    let digestLength: Int
    var totalBytes: Int
    var bytes: Int
    var buffer: Bytes
    var hw: Words
    var hl: Limbs
    
    init(_ algorithm: MessageDigestAlgorithm) {
        switch algorithm {
        case .SHA1:
            self.impl = SHA1()
            self.digestLength = 20
            self.buffer = Bytes(repeating: 0, count: 64)
            self.hw = Words(repeating: 0, count: 5)
            self.hl = Limbs(repeating: 0, count: 0)
        case .SHA2_224:
            self.impl = SHA2_256(true)
            self.digestLength = 28
            self.buffer = Bytes(repeating: 0, count: 64)
            self.hw = Words(repeating: 0, count: 8)
            self.hl = Limbs(repeating: 0, count: 0)
        case .SHA2_256:
            self.impl = SHA2_256(false)
            self.digestLength = 32
            self.buffer = Bytes(repeating: 0, count: 64)
            self.hw = Words(repeating: 0, count: 8)
            self.hl = Limbs(repeating: 0, count: 0)
        case .SHA2_384:
            self.impl = SHA2_512(true)
            self.digestLength = 48
            self.buffer = Bytes(repeating: 0, count: 128)
            self.hw = Words(repeating: 0, count: 0)
            self.hl = Limbs(repeating: 0, count: 8)
        case .SHA2_512:
            self.impl = SHA2_512(false)
            self.digestLength = 64
            self.buffer = Bytes(repeating: 0, count: 128)
            self.hw = Words(repeating: 0, count: 0)
            self.hl = Limbs(repeating: 0, count: 8)
        }
        self.totalBytes = 0
        self.bytes = 0
        self.impl.doReset(&self.hw, &self.hl)
    }

    static func instance(_ domain: Domain) -> MessageDigest {
        return instance(domain.p.bitWidth)
    }
    
    static func instance(_ bw: Int) -> MessageDigest {
        if bw > 384 {
            return MessageDigest(.SHA2_512)
        } else if bw > 256 {
            return MessageDigest(.SHA2_384)
        } else if bw > 224 {
            return MessageDigest(.SHA2_256)
        } else {
            return MessageDigest(.SHA2_224)
        }
    }

    func reset() {
        for i in 0 ..< self.buffer.count {
            self.buffer[i] = 0
        }
        self.totalBytes = 0
        self.bytes = 0
        self.impl.doReset(&self.hw, &self.hl)
    }
    
    func update(_ input: Bytes) {
        var remaining = input.count
        var ndx = 0
        while remaining > 0 {
            let a = remaining < self.buffer.count - self.bytes ? remaining : self.buffer.count - self.bytes
            for i in 0 ..< a {
                self.buffer[self.bytes + i] = input[ndx + i]
            }
            self.bytes += a
            ndx += a
            remaining -= a
            if self.bytes == self.buffer.count {
                self.impl.doBuffer(&self.buffer, &self.hw, &self.hl)
                self.bytes = 0
            }
        }
        self.totalBytes += input.count
    }
    
    func digest() -> Bytes {
        var md = Bytes(repeating: 0, count: self.digestLength)
        update(self.impl.padding(self.totalBytes, self.buffer.count))
        if self.digestLength > 32 {
                
            // SHA2_384 and SHA2_512
                
            for i in 0 ..< self.digestLength {
                md[i] = Byte((self.hl[i >> 3] >> ((7 - (i & 0x7)) * 8)) & 0xff)
            }
        } else {
            
            // SHA2_224 and SHA2_256

            for i in 0 ..< self.digestLength {
                md[i] = Byte((self.hw[i >> 2] >> ((3 - (i & 0x3)) * 8)) & 0xff)
            }
        }
        self.reset()
        return md
    }
    
}
