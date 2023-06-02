//
//  EC163.swift
//  AEC
//
//  Created by Leif Ibsen on 25/02/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//




class EC163k1: Domain2 {

    static let name = "sect163k1"
    static let rp = RP(163, 7, 6, 3)
    static let p = BInt("800000000000000000000000000000000000000c9", radix: 16)!
    static let a = BInt.ONE
    static let b = BInt.ONE
    static let gx = BInt("2fe13c0537bbc11acaa07d793de4e6d5e5c94eee8", radix: 16)!
    static let gy = BInt("289070fb05d38ff58321f2e800536d538ccdaa3d9", radix: 16)!
    static let order = BInt("4000000000000000000020108a2e0cc0d99f8a5ef", radix: 16)!
    static let cofactor = 2
    static let oid = ASN1ObjectIdentifier("1.3.132.0.1")!

    init() {
        super.init(EC163k1.name, EC163k1.rp, EC163k1.a, EC163k1.b, EC163k1.gx, EC163k1.gy, EC163k1.order, EC163k1.cofactor, EC163k1.oid)
    }

    // Efficient reduceModP implementation
    override func reduceModP(_ x: BitVector) -> BitVector {
        return EC163reduceModP(x)
    }

}

class EC163r2: Domain2 {

    static let name = "sect163r2"
    static let rp = RP(163, 7, 6, 3)
    static let p = BInt("800000000000000000000000000000000000000c9", radix: 16)!
    static let a = BInt.ONE
    static let b = BInt("20a601907b8c953ca1481eb10512f78744a3205fd", radix: 16)!
    static let gx = BInt("3f0eba16286a2d57ea0991168d4994637e8343e36", radix: 16)!
    static let gy = BInt("0d51fbc6c71a0094fa2cdd545b11c5c0c797324f1", radix: 16)!
    static let order = BInt("40000000000000000000292fe77e70c12a4234c33", radix: 16)!
    static let cofactor = 2
    static let oid = ASN1ObjectIdentifier("1.3.132.0.15")!

    init() {
        super.init(EC163r2.name, EC163r2.rp, EC163r2.a, EC163r2.b, EC163r2.gx, EC163r2.gy, EC163r2.order, EC163r2.cofactor, EC163r2.oid)
    }

    // Efficient reduceModP implementation
    override func reduceModP(_ x: BitVector) -> BitVector {
        return EC163reduceModP(x)
    }

}

// [GUIDE] - algorithm 2.41
func EC163reduceModP(_ x: BitVector) -> BitVector {
    var C = Limbs(repeating: 0, count: 6)
    for i in 0 ..< C.count {
        C[i] = x.bv[i]
    }
    var T = C[5]
    C[2] ^= (T << 36) ^ (T << 35) ^ (T << 32) ^ (T << 29)
    C[3] ^= (T >> 28) ^ (T >> 29) ^ (T >> 32) ^ (T >> 35)

    T = C[4]
    C[1] ^= (T << 36) ^ (T << 35) ^ (T << 32) ^ (T << 29)
    C[2] ^= (T >> 28) ^ (T >> 29) ^ (T >> 32) ^ (T >> 35)

    T = C[3]
    C[0] ^= (T << 36) ^ (T << 35) ^ (T << 32) ^ (T << 29)
    C[1] ^= (T >> 28) ^ (T >> 29) ^ (T >> 32) ^ (T >> 35)

    T = C[2] >> 35
    C[0] ^= T ^ (T << 3) ^ (T << 6) ^ (T << 7)
    C[2] &= 0x7ffffffff

    C[3] = 0
    C[4] = 0
    C[5] = 0
    return BitVector(3, C)
}

