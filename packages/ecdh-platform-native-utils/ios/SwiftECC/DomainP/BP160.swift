//
//  BP160.swift
//  AEC
//
//  Created by Leif Ibsen on 24/03/2019.
//




class BP160r1: DomainP {

    static let name = "brainpoolP160r1"
    static let p = BInt("e95e4a5f737059dc60dfc7ad95b3d8139515620f", radix: 16)!
    static let a = BInt("340e7be2a280eb74e2be61bada745d97e8f7c300", radix: 16)!
    static let b = BInt("1e589a8595423412134faa2dbdec95c8d8675e58", radix: 16)!
    static let gx = BInt("bed5af16ea3f6a4f62938c4631eb5af7bdbcdbc3", radix: 16)!
    static let gy = BInt("1667cb477a1a8ec338f94741669c976316da6321", radix: 16)!
    static let order = BInt("e95e4a5f737059dc60df5991d45029409e60fc09", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.1")!

    init() {
        super.init(BP160r1.name, BP160r1.p, BP160r1.a, BP160r1.b, BP160r1.gx, BP160r1.gy, BP160r1.order, BP160r1.cofactor, BP160r1.oid)
    }

}

class BP160t1: DomainP {

    static let name = "brainpoolP160t1"
    static let p = BInt("e95e4a5f737059dc60dfc7ad95b3d8139515620f", radix: 16)!
    static let a = BInt("e95e4a5f737059dc60dfc7ad95b3d8139515620c", radix: 16)!
    static let b = BInt("7a556b6dae535b7b51ed2c4d7daa7a0b5c55f380", radix: 16)!
    static let gx = BInt("b199b13b9b34efc1397e64baeb05acc265ff2378", radix: 16)!
    static let gy = BInt("add6718b7c7c1961f0991b842443772152c9e0ad", radix: 16)!
    static let order = BInt("e95e4a5f737059dc60df5991d45029409e60fc09", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.2")!

    init() {
        super.init(BP160t1.name, BP160t1.p, BP160t1.a, BP160t1.b, BP160t1.gx, BP160t1.gy, BP160t1.order, BP160t1.cofactor, BP160t1.oid)
    }

}
