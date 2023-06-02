//
//  SHA2.swift
//  Cipher
//
//  Created by Leif Ibsen on 02/04/2019.
//

//
// Implementation of the Secure Hash Standard (SHA2) - please refer [FIPS 180-4]
//
class SHA2_256: MessageDigestImpl {
    
    static let k: Words = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2 ]
    
    var w: Words
    let sha224: Bool
    
    init(_ sha224: Bool) {
        self.w = Words(repeating: 0, count: 64)
        self.sha224 = sha224
    }
    
    func doReset(_ hw: inout Words, _ hl: inout Limbs) {
        if self.sha224 {
            hw[0] = 0xc1059ed8
            hw[1] = 0x367cd507
            hw[2] = 0x3070dd17
            hw[3] = 0xf70e5939
            hw[4] = 0xffc00b31
            hw[5] = 0x68581511
            hw[6] = 0x64f98fa7
            hw[7] = 0xbefa4fa4
        } else {
            hw[0] = 0x6a09e667
            hw[1] = 0xbb67ae85
            hw[2] = 0x3c6ef372
            hw[3] = 0xa54ff53a
            hw[4] = 0x510e527f
            hw[5] = 0x9b05688c
            hw[6] = 0x1f83d9ab
            hw[7] = 0x5be0cd19
        }
    }
    
    func doBuffer(_ buffer: inout Bytes, _ hw: inout Words, _ hl: inout Limbs) {
        for i in 0 ..< w.count {
            w[i] = 0
        }
        for i in 0 ..< 16 {
            let index = 4 * i
            let w0 = Word(buffer[index]) << 24
            let w1 = Word(buffer[index + 1]) << 16
            let w2 = Word(buffer[index + 2]) << 8
            let w3 = Word(buffer[index + 3])
            self.w[i] = w0 | w1 | w2 | w3
        }
        for i in 16 ..< 64 {
            self.w[i] = SSIG1(self.w[i - 2]) &+ self.w[i - 7] &+ SSIG0(self.w[i - 15]) &+ self.w[i - 16]
        }
        var a = hw[0]
        var b = hw[1]
        var c = hw[2]
        var d = hw[3]
        var e = hw[4]
        var f = hw[5]
        var g = hw[6]
        var h = hw[7]
        for i in 0 ..< 64 {
            let t1 = h &+ BSIG1(e) &+ CH(e, f, g) &+ SHA2_256.k[i] &+ self.w[i]
            let t2 = BSIG0(a) &+ MAJ(a, b, c)
            h = g
            g = f
            f = e
            e = d &+ t1
            d = c
            c = b
            b = a
            a = t1 &+ t2
        }
        hw[0] &+= a
        hw[1] &+= b
        hw[2] &+= c
        hw[3] &+= d
        hw[4] &+= e
        hw[5] &+= f
        hw[6] &+= g
        hw[7] &+= h
    }
    
    func CH(_ x: Word, _ y: Word, _ z: Word) -> Word {
        return (x & y) ^ ((~x) & z)
    }
    
    func MAJ(_ x: Word, _ y: Word, _ z: Word) -> Word {
        return (x & y) ^ (x & z) ^ (y & z)
    }

    func BSIG0(_ x: Word) -> Word {
        return SHA2_256.rotateRight(x, 2) ^ SHA2_256.rotateRight(x, 13) ^ SHA2_256.rotateRight(x, 22)
    }

    func BSIG1(_ x: Word) -> Word {
        return SHA2_256.rotateRight(x, 6) ^ SHA2_256.rotateRight(x, 11) ^ SHA2_256.rotateRight(x, 25)
    }

    func SSIG0(_ x: Word) -> Word {
        return SHA2_256.rotateRight(x, 7) ^ SHA2_256.rotateRight(x, 18) ^ (x >> 3)
    }

    func SSIG1(_ x: Word) -> Word {
        return SHA2_256.rotateRight(x, 17) ^ SHA2_256.rotateRight(x, 19) ^ (x >> 10)
    }
    
    func padding(_ totalBytes: Int, _ blockSize: Int) -> Bytes {
        var l = totalBytes * 8
        let x = ((totalBytes + 8 + blockSize) / blockSize) * blockSize - totalBytes
        var b = Bytes(repeating: 0, count: x)
        b[0] = 0x80
        b[x - 1] = Byte(l & 0xff)
        l >>= 8
        b[x - 2] = Byte(l & 0xff)
        l >>= 8
        b[x - 3] = Byte(l & 0xff)
        l >>= 8
        b[x - 4] = Byte(l & 0xff)
        l >>= 8
        b[x - 5] = Byte(l & 0xff)
        l >>= 8
        b[x - 6] = Byte(l & 0xff)
        l >>= 8
        b[x - 7] = Byte(l & 0xff)
        l >>= 8
        b[x - 8] = Byte(l & 0xff)
        return b
    }
    
    static func rotateRight(_ x: Word, _ n: Int) -> Word {
        return (x >> n) | (x << (32 - n))
    }

}

class SHA2_512: MessageDigestImpl {
    
    static let k: Limbs = [
        0x428a2f98d728ae22, 0x7137449123ef65cd, 0xb5c0fbcfec4d3b2f, 0xe9b5dba58189dbbc,
        0x3956c25bf348b538, 0x59f111f1b605d019, 0x923f82a4af194f9b, 0xab1c5ed5da6d8118,
        0xd807aa98a3030242, 0x12835b0145706fbe, 0x243185be4ee4b28c, 0x550c7dc3d5ffb4e2,
        0x72be5d74f27b896f, 0x80deb1fe3b1696b1, 0x9bdc06a725c71235, 0xc19bf174cf692694,
        0xe49b69c19ef14ad2, 0xefbe4786384f25e3, 0x0fc19dc68b8cd5b5, 0x240ca1cc77ac9c65,
        0x2de92c6f592b0275, 0x4a7484aa6ea6e483, 0x5cb0a9dcbd41fbd4, 0x76f988da831153b5,
        0x983e5152ee66dfab, 0xa831c66d2db43210, 0xb00327c898fb213f, 0xbf597fc7beef0ee4,
        0xc6e00bf33da88fc2, 0xd5a79147930aa725, 0x06ca6351e003826f, 0x142929670a0e6e70,
        0x27b70a8546d22ffc, 0x2e1b21385c26c926, 0x4d2c6dfc5ac42aed, 0x53380d139d95b3df,
        0x650a73548baf63de, 0x766a0abb3c77b2a8, 0x81c2c92e47edaee6, 0x92722c851482353b,
        0xa2bfe8a14cf10364, 0xa81a664bbc423001, 0xc24b8b70d0f89791, 0xc76c51a30654be30,
        0xd192e819d6ef5218, 0xd69906245565a910, 0xf40e35855771202a, 0x106aa07032bbd1b8,
        0x19a4c116b8d2d0c8, 0x1e376c085141ab53, 0x2748774cdf8eeb99, 0x34b0bcb5e19b48a8,
        0x391c0cb3c5c95a63, 0x4ed8aa4ae3418acb, 0x5b9cca4f7763e373, 0x682e6ff3d6b2b8a3,
        0x748f82ee5defb2fc, 0x78a5636f43172f60, 0x84c87814a1f0ab72, 0x8cc702081a6439ec,
        0x90befffa23631e28, 0xa4506cebde82bde9, 0xbef9a3f7b2c67915, 0xc67178f2e372532b,
        0xca273eceea26619c, 0xd186b8c721c0c207, 0xeada7dd6cde0eb1e, 0xf57d4f7fee6ed178,
        0x06f067aa72176fba, 0x0a637dc5a2c898a6, 0x113f9804bef90dae, 0x1b710b35131c471b,
        0x28db77f523047d84, 0x32caab7b40c72493, 0x3c9ebe0a15c9bebc, 0x431d67c49c100d4c,
        0x4cc5d4becb3e42b6, 0x597f299cfc657e2a, 0x5fcb6fab3ad6faec, 0x6c44198c4a475817 ]
    
    var l: Limbs
    let sha384: Bool
    
    init(_ sha384: Bool) {
        self.l = Limbs(repeating: 0, count: 80)
        self.sha384 = sha384
    }
    
    func doReset(_ hw: inout Words, _ hl: inout Limbs) {
        if self.sha384 {
            hl[0] = 0xcbbb9d5dc1059ed8
            hl[1] = 0x629a292a367cd507
            hl[2] = 0x9159015a3070dd17
            hl[3] = 0x152fecd8f70e5939
            hl[4] = 0x67332667ffc00b31
            hl[5] = 0x8eb44a8768581511
            hl[6] = 0xdb0c2e0d64f98fa7
            hl[7] = 0x47b5481dbefa4fa4
        } else {
            hl[0] = 0x6a09e667f3bcc908
            hl[1] = 0xbb67ae8584caa73b
            hl[2] = 0x3c6ef372fe94f82b
            hl[3] = 0xa54ff53a5f1d36f1
            hl[4] = 0x510e527fade682d1
            hl[5] = 0x9b05688c2b3e6c1f
            hl[6] = 0x1f83d9abfb41bd6b
            hl[7] = 0x5be0cd19137e2179
        }
    }
    
    func doBuffer(_ buffer: inout Bytes, _ hw: inout Words, _ hl: inout Limbs) {
        for i in 0 ..< l.count {
            l[i] = 0
        }
        for i in 0 ..< 16 {
            let index = 8 * i
            let l0 = Limb(buffer[index]) << 56
            let l1 = Limb(buffer[index + 1]) << 48
            let l2 = Limb(buffer[index + 2]) << 40
            let l3 = Limb(buffer[index + 3]) << 32
            let l4 = Limb(buffer[index + 4]) << 24
            let l5 = Limb(buffer[index + 5]) << 16
            let l6 = Limb(buffer[index + 6]) << 8
            let l7 = Limb(buffer[index + 7])
            self.l[i] = l0 | l1 | l2 | l3 | l4 | l5 | l6 | l7
        }
        for i in 16 ..< 80 {
            self.l[i] = SSIG1(self.l[i - 2]) &+ self.l[i - 7] &+ SSIG0(self.l[i - 15]) &+ self.l[i - 16]
        }
        var a = hl[0]
        var b = hl[1]
        var c = hl[2]
        var d = hl[3]
        var e = hl[4]
        var f = hl[5]
        var g = hl[6]
        var h = hl[7]
        for i in 0 ..< 80 {
            let t1 = h &+ BSIG1(e) &+ CH(e, f, g) &+ SHA2_512.k[i] &+ self.l[i]
            let t2 = BSIG0(a) &+ MAJ(a, b, c)
            h = g
            g = f
            f = e
            e = d &+ t1
            d = c
            c = b
            b = a
            a = t1 &+ t2
        }
        hl[0] &+= a
        hl[1] &+= b
        hl[2] &+= c
        hl[3] &+= d
        hl[4] &+= e
        hl[5] &+= f
        hl[6] &+= g
        hl[7] &+= h
    }
    
    func CH(_ x: Limb, _ y: Limb, _ z: Limb) -> Limb {
        return (x & y) ^ ((~x) & z)
    }

    func MAJ(_ x: Limb, _ y: Limb, _ z: Limb) -> Limb {
        return (x & y) ^ (x & z) ^ (y & z)
    }

    func BSIG0(_ x: Limb) -> Limb {
        return SHA2_512.rotateRight(x, 28) ^ SHA2_512.rotateRight(x, 34) ^ SHA2_512.rotateRight(x, 39)
    }
    
    func BSIG1(_ x: Limb) -> Limb {
        return SHA2_512.rotateRight(x, 14) ^ SHA2_512.rotateRight(x, 18) ^ SHA2_512.rotateRight(x, 41)
    }
    
    func SSIG0(_ x: Limb) -> Limb {
        return SHA2_512.rotateRight(x, 1) ^ SHA2_512.rotateRight(x, 8) ^ (x >> 7)
    }
    
    func SSIG1(_ x: Limb) -> Limb {
        return SHA2_512.rotateRight(x, 19) ^ SHA2_512.rotateRight(x, 61) ^ (x >> 6)
    }
    
    func padding(_ totalBytes: Int, _ blockSize: Int) -> Bytes {
        var l = totalBytes * 8
        let x = ((totalBytes + 16 + blockSize) / blockSize) * blockSize - totalBytes
        var b = Bytes(repeating: 0, count: x)
        b[0] = 0x80
        b[x - 1] = Byte(l & 0xff)
        l >>= 8
        b[x - 2] = Byte(l & 0xff)
        l >>= 8
        b[x - 3] = Byte(l & 0xff)
        l >>= 8
        b[x - 4] = Byte(l & 0xff)
        l >>= 8
        b[x - 5] = Byte(l & 0xff)
        l >>= 8
        b[x - 6] = Byte(l & 0xff)
        l >>= 8
        b[x - 7] = Byte(l & 0xff)
        l >>= 8
        b[x - 8] = Byte(l & 0xff)
        return b
    }
    
    static func rotateRight(_ x: Limb, _ n: Int) -> Limb {
        return (x >> n) | (x << (64 - n))
    }

}
