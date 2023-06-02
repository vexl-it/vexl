//
//  EC256.swift
//  AEC
//
//  Created by Leif Ibsen on 25/02/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//




class EC256k1: DomainP {

    static let name = "secp256k1"
    static let p = BInt("fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f", radix: 16)!
    static let a = BInt("0000000000000000000000000000000000000000000000000000000000000000", radix: 16)!
    static let b = BInt("0000000000000000000000000000000000000000000000000000000000000007", radix: 16)!
    static let gx = BInt("79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798", radix: 16)!
    static let gy = BInt("483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8", radix: 16)!
    static let order = BInt("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.132.0.10")!

    init() {
        super.init(EC256k1.name, EC256k1.p, EC256k1.a, EC256k1.b, EC256k1.gx, EC256k1.gy, EC256k1.order, EC256k1.cofactor, EC256k1.oid)
    }

}

class EC256r1: DomainP {

    static let name = "secp256r1"
    static let p = BInt("ffffffff00000001000000000000000000000000ffffffffffffffffffffffff", radix: 16)!
    static let a = BInt("ffffffff00000001000000000000000000000000fffffffffffffffffffffffc", radix: 16)!
    static let b = BInt("5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b", radix: 16)!
    static let gx = BInt("6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296", radix: 16)!
    static let gy = BInt("4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5", radix: 16)!
    static let order = BInt("ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.2.840.10045.3.1.7")!

    init() {
        super.init(EC256r1.name, EC256r1.p, EC256r1.a, EC256r1.b, EC256r1.gx, EC256r1.gy, EC256r1.order, EC256r1.cofactor, EC256r1.oid)
    }

}
