//
//  EC384.swift
//  AEC
//
//  Created by Leif Ibsen on 12/11/2018.
//




class EC384r1: DomainP {

    static let name = "secp384r1"
    static let p = BInt("fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000ffffffff", radix: 16)!
    static let a = BInt("fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000fffffffc", radix: 16)!
    static let b = BInt("b3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aef", radix: 16)!
    static let gx = BInt("aa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7", radix: 16)!
    static let gy = BInt("3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f", radix: 16)!
    static let order = BInt("ffffffffffffffffffffffffffffffffffffffffffffffffc7634d81f4372ddf581a0db248b0a77aecec196accc52973", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.132.0.34")!

    init() {
        super.init(EC384r1.name, EC384r1.p, EC384r1.a, EC384r1.b, EC384r1.gx, EC384r1.gy, EC384r1.order, EC384r1.cofactor, EC384r1.oid)
    }

}
