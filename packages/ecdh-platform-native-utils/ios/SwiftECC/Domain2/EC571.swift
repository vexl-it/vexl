//
//  EC571.swift
//  AEC
//
//  Created by Leif Ibsen on 25/02/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//




class EC571k1: Domain2 {

    static let name = "sect571k1"
    static let rp = RP(571, 10, 5, 2)
    static let p = BInt("80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000425", radix: 16)!
    static let a = BInt.ZERO
    static let b = BInt.ONE
    static let gx = BInt("26eb7a859923fbc82189631f8103fe4ac9ca2970012d5d46024804801841ca44370958493b205e647da304db4ceb08cbbd1ba39494776fb988b47174dca88c7e2945283a01c8972", radix: 16)!
    static let gy = BInt("349dc807f4fbf374f4aeade3bca95314dd58cec9f307a54ffc61efc006d8a2c9d4979c0ac44aea74fbebbb9f772aedcb620b01a7ba7af1b320430c8591984f601cd4c143ef1c7a3", radix: 16)!
    static let order = BInt("20000000000000000000000000000000000000000000000000000000000000000000000131850e1f19a63e4b391a8db917f4138b630d84be5d639381e91deb45cfe778f637c1001", radix: 16)!
    static let cofactor = 4
    static let oid = ASN1ObjectIdentifier("1.3.132.0.38")!

    init() {
        super.init(EC571k1.name, EC571k1.rp, EC571k1.a, EC571k1.b, EC571k1.gx, EC571k1.gy, EC571k1.order, EC571k1.cofactor, EC571k1.oid)
    }

    // Efficient modP implementation
    override func reduceModP(_ x: BitVector) -> BitVector {
        return EC571reduceModP(x)
    }

}

class EC571r1: Domain2 {

    static let name = "sect571r1"
    static let rp = RP(571, 10, 5, 2)
    static let p = BInt("80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000425", radix: 16)!
    static let a = BInt.ONE
    static let b = BInt("2f40e7e2221f295de297117b7f3d62f5c6a97ffcb8ceff1cd6ba8ce4a9a18ad84ffabbd8efa59332be7ad6756a66e294afd185a78ff12aa520e4de739baca0c7ffeff7f2955727a", radix: 16)!
    static let gx = BInt("303001d34b856296c16c0d40d3cd7750a93d1d2955fa80aa5f40fc8db7b2abdbde53950f4c0d293cdd711a35b67fb1499ae60038614f1394abfa3b4c850d927e1e7769c8eec2d19", radix: 16)!
    static let gy = BInt("37bf27342da639b6dccfffeb73d69d78c6c27a6009cbbca1980f8533921e8a684423e43bab08a576291af8f461bb2a8b3531d2f0485c19b16e2f1516e23dd3c1a4827af1b8ac15b", radix: 16)!
    static let order = BInt("3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe661ce18ff55987308059b186823851ec7dd9ca1161de93d5174d66e8382e9bb2fe84e47", radix: 16)!
    static let cofactor = 2
    static let oid = ASN1ObjectIdentifier("1.3.132.0.39")!

    init() {
        super.init(EC571r1.name, EC571r1.rp, EC571r1.a, EC571r1.b, EC571r1.gx, EC571r1.gy, EC571r1.order, EC571r1.cofactor, EC571r1.oid)
    }

    // Efficient reduceModP implementation
    override func reduceModP(_ x: BitVector) -> BitVector {
        return EC571reduceModP(x)
    }

}

// [GUIDE] - algorithm 2.45
func EC571reduceModP(_ x: BitVector) -> BitVector {
    var C = Limbs(repeating: 0, count: 18)
    for i in 0 ..< C.count {
        C[i] = x.bv[i]
    }

    var T = C[17]
    var V = C[8] ^ (T << 5) ^ (T << 7) ^ (T << 10) ^ (T << 15)
    C[9] ^= (T >> 59) ^ (T >> 57) ^ (T >> 54) ^ (T >> 49)

    T = C[16]
    C[8] = V ^ (T >> 59) ^ (T >> 57) ^ (T >> 54) ^ (T >> 49)

    V = C[7] ^ (T << 5) ^ (T << 7) ^ (T << 10) ^ (T << 15)
    T = C[15]
    C[7] = V ^ (T >> 59) ^ (T >> 57) ^ (T >> 54) ^ (T >> 49)

    V = C[6] ^ (T << 5) ^ (T << 7) ^ (T << 10) ^ (T << 15)
    T = C[14]
    C[6] = V ^ (T >> 59) ^ (T >> 57) ^ (T >> 54) ^ (T >> 49)

    V = C[5] ^ (T << 5) ^ (T << 7) ^ (T << 10) ^ (T << 15)
    T = C[13]
    C[5] = V ^ (T >> 59) ^ (T >> 57) ^ (T >> 54) ^ (T >> 49)

    V = C[4] ^ (T << 5) ^ (T << 7) ^ (T << 10) ^ (T << 15)
    T = C[12]
    C[4] = V ^ (T >> 59) ^ (T >> 57) ^ (T >> 54) ^ (T >> 49)

    V = C[3] ^ (T << 5) ^ (T << 7) ^ (T << 10) ^ (T << 15)
    T = C[11]
    C[3] = V ^ (T >> 59) ^ (T >> 57) ^ (T >> 54) ^ (T >> 49)

    V = C[2] ^ (T << 5) ^ (T << 7) ^ (T << 10) ^ (T << 15)
    T = C[10]
    C[2] = V ^ (T >> 59) ^ (T >> 57) ^ (T >> 54) ^ (T >> 49)

    V = C[1] ^ (T << 5) ^ (T << 7) ^ (T << 10) ^ (T << 15)
    T = C[9]
    C[1] = V ^ (T >> 59) ^ (T >> 57) ^ (T >> 54) ^ (T >> 49)

    V = C[0] ^ (T << 5) ^ (T << 7) ^ (T << 10) ^ (T << 15)
    T = C[8] >> 59
    C[0] = V ^ T ^ (T << 2) ^ (T << 5) ^ (T << 10)
    C[8] &= 0x7ffffffffffffff

    C[9] = 0
    C[10] = 0
    C[11] = 0
    C[12] = 0
    C[13] = 0
    C[14] = 0
    C[15] = 0
    C[16] = 0
    C[17] = 0
    return BitVector(9, C)
}
