//
//  BitVector.swift
//  AEC
//
//  Created by Leif Ibsen on 30/10/2019.
//



// A BitVector is an array of Limb's representing a binary polynomial. Bit number i is the coefficient to x^i
// BitVectors have a fixed size specified at their creation
struct BitVector: CustomStringConvertible, Equatable {

    var description: String {
        return self.asBInt().asString(radix: 16)
    }

    static let UMasks: Limbs = [
        0x1,0x2,0x4,0x8,
        0x10,0x20,0x40,0x80,
        0x100,0x200,0x400,0x800,
        0x1000,0x2000,0x4000,0x8000,
        0x10000,0x20000,0x40000,0x80000,
        0x100000,0x200000,0x400000,0x800000,
        0x1000000,0x2000000,0x4000000,0x8000000,
        0x10000000,0x20000000,0x40000000,0x80000000,
        0x100000000,0x200000000,0x400000000,0x800000000,
        0x1000000000,0x2000000000,0x4000000000,0x8000000000,
        0x10000000000,0x20000000000,0x40000000000,0x80000000000,
        0x100000000000,0x200000000000,0x400000000000,0x800000000000,
        0x1000000000000,0x2000000000000,0x4000000000000,0x8000000000000,
        0x10000000000000,0x20000000000000,0x40000000000000,0x80000000000000,
        0x100000000000000,0x200000000000000,0x400000000000000,0x800000000000000,
        0x1000000000000000,0x2000000000000000,0x4000000000000000,0x8000000000000000]

    static func == (p1: BitVector, p2: BitVector) -> Bool {
        return p1.bv == p2.bv
    }

    var bitWidth: Int {
        var bw = 64 * self.bv.count
        var i = self.bv.count - 1
        while i >= 0 && self.bv[i] == 0 {
            bw -= 64
            i -= 1
        }
        if i >= 0 {
            bw -= 64
            var x = bv[i]
            while x > 0 {
                x >>= 1
                bw += 1
            }
        }
        return bw
    }

    var isZero: Bool {
        for i in 0 ..< self.bv.count {
            if self.bv[i] != 0 {
                return false
            }
        }
        return true
    }

    var isOne: Bool {
        for i in 1 ..< self.bv.count {
            if self.bv[i] != 0 {
                return false
            }
        }
        return self.bv[0] == 1
    }

    var isEven: Bool {
        return (self.bv[0] & 0x1) == 0
    }

    var bv: Limbs

    init() {
        self.bv = Limbs(repeating: 0, count: 1)
    }

    init(_ size: Int, _ bv: Limbs, _ twice: Bool = false) {
        self.bv = Limbs(repeating: 0, count: twice ? size << 1 : size)
        for i in 0 ..< min(self.bv.count, bv.count) {
            self.bv[i] = bv[i]
        }
    }

    init(_ size: Int) {
        self.bv = Limbs(repeating: 0, count: size)
    }

    func asBInt() -> BInt {
        return BInt(self.bv)
    }

    func testBit(_ i: Int) -> Bool {
        return (self.bv[i >> 6] & BitVector.UMasks[i & 0x3f]) != 0
    }

    mutating func setBit(_ i: Int) {
        self.bv[i >> 6] |= BitVector.UMasks[i & 0x3f]
    }

    mutating func clearBit(_ i: Int) {
        self.bv[i >> 6] &= ~BitVector.UMasks[i & 0x3f]
    }

    mutating func flipBit(_ i: Int) {
        self.bv[i >> 6] ^= BitVector.UMasks[i & 0x3f]
    }

    mutating func shiftLeft() {
        var b = self.bv[0] & 0x8000000000000000 != 0
        self.bv[0] <<= 1
        for i in 1 ..< self.bv.count {
            let b1 = self.bv[i] & 0x8000000000000000 != 0
            self.bv[i] <<= 1
            if b {
                self.bv[i] |= 1
            }
            b = b1
        }
    }

    mutating func shiftRight() {
        for i in 0 ..< self.bv.count {
            if i > 0 && self.bv[i] & 1 == 1 {
                self.bv[i - 1] |= 0x8000000000000000
            }
            self.bv[i] >>= 1
        }
    }

    func plus(_ x: BitVector) -> BitVector {
        var s = self
        for i in 0 ..< x.bv.count {
            s.bv[i] ^= x.bv[i]
        }
        return s
    }

    mutating func add(_ x: BitVector) {
        for i in 0 ..< x.bv.count {
            self.bv[i] ^= x.bv[i]
        }
    }

    mutating func addRp(_ k: Int, _ rp: RP) {
        self.flipBit(k)
        if rp.k3 != 0 {
            self.flipBit(k + rp.k3)
        }
        if rp.k2 != 0 {
            self.flipBit(k + rp.k2)
        }
        if rp.k1 != 0 {
            self.flipBit(k + rp.k1)
        }
        self.flipBit(k + rp.m)
    }

    // [GUIDE] - algorithm 2.49
    func inverse(_ rp: RP) -> BitVector {
        var u = BitVector(rp.t, self.bv)
        var v = BitVector(rp.t)
        v.addRp(0, rp)
        var g1 = BitVector(rp.t)
        g1.bv[0] = 1
        var g2 = BitVector(rp.t)
        while !u.isOne && !v.isOne {
            while u.isEven {
                u.shiftRight()
                if g1.isEven {
                    g1.shiftRight()
                } else {
                    g1.addRp(0, rp)
                    g1.shiftRight()
                }
            }
            while v.isEven {
                v.shiftRight()
                if g2.isEven {
                    g2.shiftRight()
                } else {
                    g2.addRp(0, rp)
                    g2.shiftRight()
                }
            }
            if u.bitWidth > v.bitWidth {
                u.add(v)
                g1.add(g2)
            } else {
                v.add(u)
                g2.add(g1)
            }
        }
        return BitVector(rp.t, u.isOne ? g1.bv : g2.bv)
    }
}
