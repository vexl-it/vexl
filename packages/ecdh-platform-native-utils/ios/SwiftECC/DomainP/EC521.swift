//
//  ECSpec521.swift
//  AEC
//
//  Created by Leif Ibsen on 22/02/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//




class EC521r1: DomainP {

    static let name = "secp521r1"
    static let p = BInt("1ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", radix: 16)!
    static let a = BInt("1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc", radix: 16)!
    static let b = BInt("51953eb9618e1c9a1f929a21a0b68540eea2da725b99b315f3b8b489918ef109e156193951ec7e937b1652c0bd3bb1bf073573df883d2c34f1ef451fd46b503f00", radix: 16)!
    static let gx = BInt("c6858e06b70404e9cd9e3ecb662395b4429c648139053fb521f828af606b4d3dbaa14b5e77efe75928fe1dc127a2ffa8de3348b3c1856a429bf97e7e31c2e5bd66", radix: 16)!
    static let gy = BInt("11839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650", radix: 16)!
    static let order = BInt("1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa51868783bf2f966b7fcc0148f709a5d03bb5c9b8899c47aebb6fb71e91386409", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.132.0.35")!

    init() {
        super.init(EC521r1.name, EC521r1.p, EC521r1.a, EC521r1.b, EC521r1.gx, EC521r1.gy, EC521r1.order, EC521r1.cofactor, EC521r1.oid)
    }

}
