//
//  EC409.swift
//  AEC
//
//  Created by Leif Ibsen on 25/02/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//




class EC409k1: Domain2 {

    static let name = "sect409k1"
    static let rp = RP(409, 87)
    static let p = BInt("2000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000001", radix: 16)!
    static let a = BInt.ZERO
    static let b = BInt.ONE
    static let gx = BInt("60f05f658f49c1ad3ab1890f7184210efd0987e307c84c27accfb8f9f67cc2c460189eb5aaaa62ee222eb1b35540cfe9023746", radix: 16)!
    static let gy = BInt("1e369050b7c4e42acba1dacbf04299c3460782f918ea427e6325165e9ea10e3da5f6c42e9c55215aa9ca27a5863ec48d8e0286b", radix: 16)!
    static let order = BInt("7ffffffffffffffffffffffffffffffffffffffffffffffffffe5f83b2d4ea20400ec4557d5ed3e3e7ca5b4b5c83b8e01e5fcf", radix: 16)!
    static let cofactor = 4
    static let oid = ASN1ObjectIdentifier("1.3.132.0.36")!

    init() {
        super.init(EC409k1.name, EC409k1.rp, EC409k1.a, EC409k1.b, EC409k1.gx, EC409k1.gy, EC409k1.order, EC409k1.cofactor, EC409k1.oid)
    }

    // Efficient reduceModP implementation
    override func reduceModP(_ x: BitVector) -> BitVector {
        return EC409reduceModP(x)
    }

}

class EC409r1: Domain2 {

    static let name = "sect409r1"
    static let rp = RP(409, 87)
    static let p = BInt("2000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000001", radix: 16)!
    static let a = BInt.ONE
    static let b = BInt("21a5c2c8ee9feb5c4b9a753b7b476b7fd6422ef1f3dd674761fa99d6ac27c8a9a197b272822f6cd57a55aa4f50ae317b13545f", radix: 16)!
    static let gx = BInt("15d4860d088ddb3496b0c6064756260441cde4af1771d4db01ffe5b34e59703dc255a868a1180515603aeab60794e54bb7996a7", radix: 16)!
    static let gy = BInt("61b1cfab6be5f32bbfa78324ed106a7636b9c5a7bd198d0158aa4f5488d08f38514f1fdf4b4f40d2181b3681c364ba0273c706", radix: 16)!
    static let order = BInt("10000000000000000000000000000000000000000000000000001e2aad6a612f33307be5fa47c3c9e052f838164cd37d9a21173", radix: 16)!
    static let cofactor = 2
    static let oid = ASN1ObjectIdentifier("1.3.132.0.37")!

    init() {
        super.init(EC409r1.name, EC409r1.rp, EC409r1.a, EC409r1.b, EC409r1.gx, EC409r1.gy, EC409r1.order, EC409r1.cofactor, EC409r1.oid)
    }

    // Efficient reduceModP implementation
    override func reduceModP(_ x: BitVector) -> BitVector {
        return EC409reduceModP(x)
    }

}

// [GUIDE] - algorithm 2.44
func EC409reduceModP(_ x: BitVector) -> BitVector {
    var C = Limbs(repeating: 0, count: 13)
    for i in 0 ..< C.count {
        C[i] = x.bv[i]
    }
    var T = C[12]
    C[5] ^= (T << 39)
    C[6] ^= (T >> 25) ^ (T << 62)
    C[7] ^= (T >> 2)

    T = C[11]
    C[4] ^= (T << 39)
    C[5] ^= (T >> 25) ^ (T << 62)
    C[6] ^= (T >> 2)

    T = C[10]
    C[3] ^= (T << 39)
    C[4] ^= (T >> 25) ^ (T << 62)
    C[5] ^= (T >> 2)

    T = C[9]
    C[2] ^= (T << 39)
    C[3] ^= (T >> 25) ^ (T << 62)
    C[4] ^= (T >> 2)

    T = C[8]
    C[1] ^= (T << 39)
    C[2] ^= (T >> 25) ^ (T << 62)
    C[3] ^= (T >> 2)

    T = C[7]
    C[0] ^= (T << 39)
    C[1] ^= (T >> 25) ^ (T << 62)
    C[2] ^= (T >> 2)

    T = C[6] >> 25
    C[0] ^= T
    C[1] ^= (T << 23)
    C[6] &= 0x1ffffff

    C[7] = 0
    C[8] = 0
    C[9] = 0
    C[10] = 0
    C[11] = 0
    C[12] = 0
    return BitVector(7, C)
}
