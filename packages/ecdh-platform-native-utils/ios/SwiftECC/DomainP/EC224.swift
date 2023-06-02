//
//  EC224.swift
//  AEC
//
//  Created by Leif Ibsen on 25/02/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//




class EC224k1: DomainP {

    static let name = "secp224k1"
    static let p = BInt("fffffffffffffffffffffffffffffffffffffffffffffffeffffe56d", radix: 16)!
    static let a = BInt("00000000000000000000000000000000000000000000000000000000", radix: 16)!
    static let b = BInt("00000000000000000000000000000000000000000000000000000005", radix: 16)!
    static let gx = BInt("a1455b334df099df30fc28a169a467e9e47075a90f7e650eb6b7a45c", radix: 16)!
    static let gy = BInt("7e089fed7fba344282cafbd6f7e319f7c0b0bd59e2ca4bdb556d61a5", radix: 16)!
    static let order = BInt("10000000000000000000000000001dce8d2ec6184caf0a971769fb1f7", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.132.0.32")!

    init() {
        super.init(EC224k1.name, EC224k1.p, EC224k1.a, EC224k1.b, EC224k1.gx, EC224k1.gy, EC224k1.order, EC224k1.cofactor, EC224k1.oid)
    }

}

class EC224r1: DomainP {

    static let name = "secp224r1"
    static let p = BInt("ffffffffffffffffffffffffffffffff000000000000000000000001", radix: 16)!
    static let a = BInt("fffffffffffffffffffffffffffffffefffffffffffffffffffffffe", radix: 16)!
    static let b = BInt("b4050a850c04b3abf54132565044b0b7d7bfd8ba270b39432355ffb4", radix: 16)!
    static let gx = BInt("b70e0cbd6bb4bf7f321390b94a03c1d356c21122343280d6115c1d21", radix: 16)!
    static let gy = BInt("bd376388b5f723fb4c22dfe6cd4375a05a07476444d5819985007e34", radix: 16)!
    static let order = BInt("ffffffffffffffffffffffffffff16a2e0b8f03e13dd29455c5c2a3d", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.132.0.33")!

    init() {
        super.init(EC224r1.name, EC224r1.p, EC224r1.a, EC224r1.b, EC224r1.gx, EC224r1.gy, EC224r1.order, EC224r1.cofactor, EC224r1.oid)
    }

}
