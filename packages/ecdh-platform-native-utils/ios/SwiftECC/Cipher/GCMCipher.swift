//
//  GCMCipher.swift
//  Test
//
//  Created by Leif Ibsen on 03/02/2020.
//

//
// [NIST] - implementation of Galois/Counter Mode cipher based on AES
//
// The method is 'Shoup's, 4-bit tables' from [GCM]
//
class GCMCipher: Cipher {
    
    static let reverse = [0b0000, 0b1000, 0b0100, 0b1100, 0b0010, 0b1010, 0b0110, 0b1110, 0b0001, 0b1001, 0b0101, 0b1101, 0b0011, 0b1011, 0b0111, 0b1111]

    var H: Block
    var J0: Block
    var CBI: Block
    var M0: [Block]

    override init(_ key: Bytes, _ macKey: Bytes) {
        let length = macKey.count * 8
        self.H = Block.Z
        self.CBI =  Block.Z
        self.M0 = [Block](repeating: Block.Z, count: 16)
        self.J0 = length == 96 ? Block(macKey + [0, 0, 0, 1]) : Block(macKey)
        super.init(key, [])
        self.H = encryptBlock(Block.Z)
        self.M0[GCMCipher.reverse[1]] = self.H
        for i in stride(from: 2, to: 16, by: 2) {
            self.M0[GCMCipher.reverse[i]] = self.M0[GCMCipher.reverse[i >> 1]]
            self.M0[GCMCipher.reverse[i]].double()
            self.M0[GCMCipher.reverse[i + 1]] = self.M0[GCMCipher.reverse[i]]
            self.M0[GCMCipher.reverse[i + 1]].add(self.H)
        }
        if length != 96 {
            ghash(Block.Z, &self.J0)
            ghash(Block(0, 128), &self.J0)
        }
        self.CBI = self.J0
    }

    override func encrypt(_ input: inout Bytes) -> Bytes {
        return crypt(&input, true)
    }

    override func decrypt(_ input: inout Bytes) -> Bytes {
        return crypt(&input, false)
    }

    func crypt(_ input: inout Bytes, _ encrypt: Bool) -> Bytes {
        var tag = Block.Z
        var k = 0
        var index = 0
        var buffer = Bytes(repeating: 0, count: AES.blockSize)
        for i in 0 ..< input.count {
            buffer[index] = input[i]
            index += 1
            if index == AES.blockSize {
                var X = Block(buffer)
                self.CBI.incr32()
                gctr(self.CBI, &X)
                ghash(encrypt ? X : Block(buffer), &tag)
                let b = X.bytes
                for i in 0 ..< AES.blockSize {
                    input[k] = b[i]
                    k += 1
                }
                index = 0
            }
        }
        if index > 0 {
            for i in index ..< buffer.count {
                buffer[i] = 0
            }
            var X = Block(buffer)
            self.CBI.incr32()
            gctr(self.CBI, &X, remove: 16 - index)
            ghash(encrypt ? X : Block(buffer), &tag)
            let b = X.bytes
            for i in 0 ..< index {
                input[k] = b[i]
                k += 1
            }
        }
        ghash(Block(0, Limb(input.count * 8)), &tag)
        gctr(self.J0, &tag)
        return tag.bytes
    }

    func encryptBlock(_ x: Block) -> Block {
        var bytes = x.bytes
        self.aes.encrypt(&bytes)
        return Block(bytes)
    }

    func ghash(_ x: Block, _ y: inout Block) {
        y.add(x)
        multiplyH(&y)
    }
    
    func gctr(_ icb: Block, _ x: inout Block) {
        x.add(encryptBlock(icb))
    }
    
    func gctr(_ icb: Block, _ x: inout Block, remove: Int) {
        x.add(encryptBlock(icb))
        x.remove(remove)
    }

    // Reduction table
    static let RT: Limbs = [0x0000000000000000, 0x1c20000000000000, 0x3840000000000000, 0x2460000000000000,
                            0x7080000000000000, 0x6ca0000000000000, 0x48c0000000000000, 0x54e0000000000000,
                            0xe100000000000000, 0xfd20000000000000, 0xd940000000000000, 0xc560000000000000,
                            0x9180000000000000, 0x8da0000000000000, 0xa9c0000000000000, 0xb5e0000000000000]

    // [GCM] - algorithm 2
    func multiplyH(_ x: inout Block) {
        var z0 = Limb(0)
        var z1 = Limb(0)
        var w1 = x.a1
        for _ in stride(from: 0, to: 64, by: 4) {
            let rti = Int(z1 & 0xf)
            let n = Int(w1 & 0xf)
            z1 >>= 4
            z1 |= z0 << 60
            z0 >>= 4
            z0 ^= GCMCipher.RT[rti]
            z0 ^= self.M0[n].a0
            z1 ^= self.M0[n].a1
            w1 >>= 4
        }
        var w0 = x.a0
        for _ in stride(from: 0, to: 64, by: 4) {
            let rti = Int(z1 & 0xf)
            let n = Int(w0 & 0xf)
            z1 >>= 4
            z1 |= z0 << 60
            z0 >>= 4
            z0 ^= GCMCipher.RT[rti]
            z0 ^= self.M0[n].a0
            z1 ^= self.M0[n].a1
            w0 >>= 4
        }
        x.a0 = z0
        x.a1 = z1
    }

}

//
// [NIST] - helper structure for GCMCipher
//
struct Block {
    
    static let R = Block(0xe100000000000000, 0x0000000000000000)
    static let Z = Block(0, 0)

    var a0: Limb
    var a1: Limb

    init(_ a0: Limb, _ a1: Limb) {
        self.a0 = a0
        self.a1 = a1
    }
    
    init(_ x: Bytes) {
        self.a0 = Limb(x[0])
        self.a0 <<= 8
        self.a0 |= Limb(x[1])
        self.a0 <<= 8
        self.a0 |= Limb(x[2])
        self.a0 <<= 8
        self.a0 |= Limb(x[3])
        self.a0 <<= 8
        self.a0 |= Limb(x[4])
        self.a0 <<= 8
        self.a0 |= Limb(x[5])
        self.a0 <<= 8
        self.a0 |= Limb(x[6])
        self.a0 <<= 8
        self.a0 |= Limb(x[7])
        self.a1 = Limb(x[8])
        self.a1 <<= 8
        self.a1 |= Limb(x[9])
        self.a1 <<= 8
        self.a1 |= Limb(x[10])
        self.a1 <<= 8
        self.a1 |= Limb(x[11])
        self.a1 <<= 8
        self.a1 |= Limb(x[12])
        self.a1 <<= 8
        self.a1 |= Limb(x[13])
        self.a1 <<= 8
        self.a1 |= Limb(x[14])
        self.a1 <<= 8
        self.a1 |= Limb(x[15])
    }

    var bytes: Bytes {
        var x = Bytes(repeating: 0, count: 16)
        var a = self.a0
        x[7] = Byte(a & 0xff)
        a >>= 8
        x[6] = Byte(a & 0xff)
        a >>= 8
        x[5] = Byte(a & 0xff)
        a >>= 8
        x[4] = Byte(a & 0xff)
        a >>= 8
        x[3] = Byte(a & 0xff)
        a >>= 8
        x[2] = Byte(a & 0xff)
        a >>= 8
        x[1] = Byte(a & 0xff)
        a >>= 8
        x[0] = Byte(a & 0xff)
        a = self.a1
        x[15] = Byte(a & 0xff)
        a >>= 8
        x[14] = Byte(a & 0xff)
        a >>= 8
        x[13] = Byte(a & 0xff)
        a >>= 8
        x[12] = Byte(a & 0xff)
        a >>= 8
        x[11] = Byte(a & 0xff)
        a >>= 8
        x[10] = Byte(a & 0xff)
        a >>= 8
        x[9] = Byte(a & 0xff)
        a >>= 8
        x[8] = Byte(a & 0xff)
        return x
    }

    mutating func incr32() {
        if self.a1 & 0x00000000ffffffff == 0x00000000ffffffff {
            self.a1 &= 0xffffffff00000000
        } else {
            self.a1 += 1
        }
    }

    mutating func remove(_ n: Int) {
        if n > 7 {
            self.a0 >>= (n - 8) * 8
            self.a0 <<= (n - 8) * 8
            self.a1 = 0
        } else {
            self.a1 >>= n * 8
            self.a1 <<= n * 8
        }
    }

    mutating func shiftRight() {
        let bit0 = self.a0 & 1 == 1
        self.a0 >>= 1
        self.a1 >>= 1
        if bit0 {
            self.a1 |= 0x8000000000000000
        }
    }

    mutating func add(_ x: Block) {
        self.a0 ^= x.a0
        self.a1 ^= x.a1
    }

    mutating func double() {
        var x0 = self.a0 >> 1
        var x1 = self.a1 >> 1
        x1 |= self.a0 << 63
        if self.a1 & 1 == 1 {
            x0 ^= 0xe100000000000000
        }
        self.a0 = x0
        self.a1 = x1
    }
    
    mutating func multiply(_ x: Block) {
        var z = Block.Z
        var v = x
        var mask0: Limb = 0x8000000000000000
        for _ in 0 ..< 64 {
            if self.a0 & mask0 != 0 {
                z.add(v)
            }
            mask0 >>= 1
            if v.a1 & 1 == 1 {
                v.shiftRight()
                v.add(Block.R)
            } else {
                v.shiftRight()
            }
        }
        var mask1: Limb = 0x8000000000000000
        for _ in 0 ..< 64 {
            if self.a1 & mask1 != 0 {
                z.add(v)
            }
            mask1 >>= 1
            if v.a1 & 1 == 1 {
                v.shiftRight()
                v.add(Block.R)
            } else {
                v.shiftRight()
            }
        }
        self.a0 = z.a0
        self.a1 = z.a1
    }

}
