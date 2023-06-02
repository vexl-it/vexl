//
//  EC233.swift
//  AEC
//
//  Created by Leif Ibsen on 25/02/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//




class EC233k1: Domain2 {

    static let name = "sect233k1"
    static let rp = RP(233, 74)
    static let p = BInt("20000000000000000000000000000000000000004000000000000000001", radix: 16)!
    static let a = BInt.ZERO
    static let b = BInt.ONE
    static let gx = BInt("17232ba853a7e731af129f22ff4149563a419c26bf50a4c9d6eefad6126", radix: 16)!
    static let gy = BInt("1db537dece819b7f70f555a67c427a8cd9bf18aeb9b56e0c11056fae6a3", radix: 16)!
    static let order = BInt("8000000000000000000000000000069d5bb915bcd46efb1ad5f173abdf", radix: 16)!    /// The cofactor
    static let cofactor = 4
    static let oid = ASN1ObjectIdentifier("1.3.132.0.26")!

    init() {
        super.init(EC233k1.name, EC233k1.rp, EC233k1.a, EC233k1.b, EC233k1.gx, EC233k1.gy, EC233k1.order, EC233k1.cofactor, EC233k1.oid)
    }

    // Efficient reduceModP implementation
    override func reduceModP(_ x: BitVector) -> BitVector {
        return EC233reduceModP(x)
    }

}

class EC233r1: Domain2 {

    static let name = "sect233r1"
    static let rp = RP(233, 74)
    static let p = BInt("20000000000000000000000000000000000000004000000000000000001", radix: 16)!
    static let a = BInt.ONE
    static let b = BInt("66647ede6c332c7f8c0923bb58213b333b20e9ce4281fe115f7d8f90ad", radix: 16)!
    static let gx = BInt("fac9dfcbac8313bb2139f1bb755fef65bc391f8b36f8f8eb7371fd558b", radix: 16)!
    static let gy = BInt("1006a08a41903350678e58528bebf8a0beff867a7ca36716f7e01f81052", radix: 16)!
    static let order = BInt("1000000000000000000000000000013e974e72f8a6922031d2603cfe0d7", radix: 16)!
    static let cofactor = 2
    static let oid = ASN1ObjectIdentifier("1.3.132.0.27")!

    init() {
        super.init(EC233r1.name, EC233r1.rp, EC233r1.a, EC233r1.b, EC233r1.gx, EC233r1.gy, EC233r1.order, EC233r1.cofactor, EC233r1.oid)
    }

    // Efficient reduceModP implementation
    override func reduceModP(_ x: BitVector) -> BitVector {
        return EC233reduceModP(x)
    }

}

// [GUIDE] - algorithm 2.42
func EC233reduceModP(_ x: BitVector) -> BitVector {
    var C = Limbs(repeating: 0, count: 8)
    for i in 0 ..< C.count {
        C[i] = x.bv[i]
    }
    var T = C[7]
    C[3] ^= (T << 23)
    C[4] ^= (T >> 41) ^ (T << 33)
    C[5] ^= (T >> 31)

    T = C[6]
    C[2] ^= (T << 23)
    C[3] ^= (T >> 41) ^ (T << 33)
    C[4] ^= (T >> 31)

    T = C[5]
    C[1] ^= (T << 23)
    C[2] ^= (T >> 41) ^ (T << 33)
    C[3] ^= (T >> 31)

    T = C[4]
    C[0] ^= (T << 23)
    C[1] ^= (T >> 41) ^ (T << 33)
    C[2] ^= (T >> 31)

    T = C[3] >> 41
    C[0] ^= T
    C[1] ^= (T << 10)
    C[3] &= 0x1ffffffffff

    C[4] = 0
    C[5] = 0
    C[6] = 0
    C[7] = 0
    return BitVector(4, C)
}
