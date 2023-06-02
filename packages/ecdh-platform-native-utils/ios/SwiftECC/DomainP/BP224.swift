//
//  BP224.swift
//  AEC
//
//  Created by Leif Ibsen on 24/03/2019.
//




class BP224r1: DomainP {

    static let name = "brainpoolP224r1"
    static let p = BInt("d7c134aa264366862a18302575d1d787b09f075797da89f57ec8c0ff", radix: 16)!
    static let a = BInt("68a5e62ca9ce6c1c299803a6c1530b514e182ad8b0042a59cad29f43", radix: 16)!
    static let b = BInt("2580f63ccfe44138870713b1a92369e33e2135d266dbb372386c400b", radix: 16)!
    static let gx = BInt("0d9029ad2c7e5cf4340823b2a87dc68c9e4ce3174c1e6efdee12c07d", radix: 16)!
    static let gy = BInt("58aa56f772c0726f24c6b89e4ecdac24354b9e99caa3f6d3761402cd", radix: 16)!
    static let order = BInt("d7c134aa264366862a18302575d0fb98d116bc4b6ddebca3a5a7939f", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.5")!

    init() {
        super.init(BP224r1.name, BP224r1.p, BP224r1.a, BP224r1.b, BP224r1.gx, BP224r1.gy, BP224r1.order, BP224r1.cofactor, BP224r1.oid)
    }

}

class BP224t1: DomainP {

    static let name = "brainpoolP224t1"
    static let p = BInt("d7c134aa264366862a18302575d1d787b09f075797da89f57ec8c0ff", radix: 16)!
    static let a = BInt("d7c134aa264366862a18302575d1d787b09f075797da89f57ec8c0fc", radix: 16)!
    static let b = BInt("4b337d934104cd7bef271bf60ced1ed20da14c08b3bb64f18a60888d", radix: 16)!
    static let gx = BInt("6ab1e344ce25ff3896424e7ffe14762ecb49f8928ac0c76029b4d580", radix: 16)!
    static let gy = BInt("0374e9f5143e568cd23f3f4d7c0d4b1e41c8cc0d1c6abd5f1a46db4c", radix: 16)!
    static let order = BInt("d7c134aa264366862a18302575d0fb98d116bc4b6ddebca3a5a7939f", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.6")!

    init() {
        super.init(BP224t1.name, BP224t1.p, BP224t1.a, BP224t1.b, BP224t1.gx, BP224t1.gy, BP224t1.order, BP224r1.cofactor, BP224t1.oid)
    }

}
