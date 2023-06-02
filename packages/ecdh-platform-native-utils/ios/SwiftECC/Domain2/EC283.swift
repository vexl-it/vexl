//
//  EC283.swift
//  AEC
//
//  Created by Leif Ibsen on 25/02/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//




class EC283k1: Domain2 {

    static let name = "sect283k1"
    static let rp = RP(283, 12, 7, 5)
    static let p = BInt("800000000000000000000000000000000000000000000000000000000000000000010a1", radix: 16)!
    static let a = BInt.ZERO
    static let b = BInt.ONE
    static let gx = BInt("503213f78ca44883f1a3b8162f188e553cd265f23c1567a16876913b0c2ac2458492836", radix: 16)!
    static let gy = BInt("1ccda380f1c9e318d90f95d07e5426fe87e45c0e8184698e45962364e34116177dd2259", radix: 16)!
    static let order = BInt("1ffffffffffffffffffffffffffffffffffe9ae2ed07577265dff7f94451e061e163c61", radix: 16)!
    static let cofactor = 4
    static let oid = ASN1ObjectIdentifier("1.3.132.0.16")!

    init() {
        super.init(EC283k1.name, EC283k1.rp, EC283k1.a, EC283k1.b, EC283k1.gx, EC283k1.gy, EC283k1.order, EC283k1.cofactor, EC283k1.oid)
    }

    // Efficient reduceModP implementation
    override func reduceModP(_ x: BitVector) -> BitVector {
        return EC283reduceModP(x)
    }

}

class EC283r1: Domain2 {

    static let name = "sect283r1"
    static let rp = RP(283, 12, 7, 5)
    static let p = BInt("800000000000000000000000000000000000000000000000000000000000000000010a1", radix: 16)!
    static let a = BInt.ONE
    static let b = BInt("27b680ac8b8596da5a4af8a19a0303fca97fd7645309fa2a581485af6263e313b79a2f5", radix: 16)!
    static let gx = BInt("5f939258db7dd90e1934f8c70b0dfec2eed25b8557eac9c80e2e198f8cdbecd86b12053", radix: 16)!
    static let gy = BInt("3676854fe24141cb98fe6d4b20d02b4516ff702350eddb0826779c813f0df45be8112f4", radix: 16)!
    static let order = BInt("3ffffffffffffffffffffffffffffffffffef90399660fc938a90165b042a7cefadb307", radix: 16)!
    static let cofactor = 2
    static let oid = ASN1ObjectIdentifier("1.3.132.0.17")!

    init() {
        super.init(EC283r1.name, EC283r1.rp, EC283r1.a, EC283r1.b, EC283r1.gx, EC283r1.gy, EC283r1.order, EC283r1.cofactor, EC283r1.oid)
    }

    // Efficient reduceModP implementation
    override func reduceModP(_ x: BitVector) -> BitVector {
        return EC283reduceModP(x)
    }

}

// [GUIDE] - algorithm 2.43
func EC283reduceModP(_ x: BitVector) -> BitVector {
    var C = Limbs(repeating: 0, count: 9)
    for i in 0 ..< C.count {
        C[i] = x.bv[i]
    }
    var T = C[8]
    C[3] ^= (T << 37) ^ (T << 42) ^ (T << 44) ^ (T << 49)
    C[4] ^= (T >> 27) ^ (T >> 22) ^ (T >> 20) ^ (T >> 15)

    T = C[7]
    C[2] ^= (T << 37) ^ (T << 42) ^ (T << 44) ^ (T << 49)
    C[3] ^= (T >> 27) ^ (T >> 22) ^ (T >> 20) ^ (T >> 15)

    T = C[6]
    C[1] ^= (T << 37) ^ (T << 42) ^ (T << 44) ^ (T << 49)
    C[2] ^= (T >> 27) ^ (T >> 22) ^ (T >> 20) ^ (T >> 15)

    T = C[5]
    C[0] ^= (T << 37) ^ (T << 42) ^ (T << 44) ^ (T << 49)
    C[1] ^= (T >> 27) ^ (T >> 22) ^ (T >> 20) ^ (T >> 15)

    T = C[4] >> 27
    C[0] ^= T ^ (T << 5) ^ (T << 7) ^ (T << 12)
    C[4] &= 0x7ffffff

    C[5] = 0
    C[6] = 0
    C[7] = 0
    C[8] = 0
    return BitVector(5, C)
}
