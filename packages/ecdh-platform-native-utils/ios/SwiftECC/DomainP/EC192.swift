//
//  EC192.swift
//  AEC
//
//  Created by Leif Ibsen on 25/02/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//




class EC192k1: DomainP {

    static let name = "secp192k1"
    static let p = BInt("fffffffffffffffffffffffffffffffffffffffeffffee37", radix: 16)!
    static let a = BInt("000000000000000000000000000000000000000000000000", radix: 16)!
    static let b = BInt("000000000000000000000000000000000000000000000003", radix: 16)!
    static let gx = BInt("db4ff10ec057e9ae26b07d0280b7f4341da5d1b1eae06c7d", radix: 16)!
    static let gy = BInt("9b2f2f6d9c5628a7844163d015be86344082aa88d95e2f9d", radix: 16)!
    static let order = BInt("fffffffffffffffffffffffe26f2fc170f69466a74defd8d", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.132.0.31")!

    init() {
        super.init(EC192k1.name, EC192k1.p, EC192k1.a, EC192k1.b, EC192k1.gx, EC192k1.gy, EC192k1.order, EC192k1.cofactor, EC192k1.oid)
    }

}

class EC192r1: DomainP {

    static let name = "secp192r1"
    static let p = BInt("fffffffffffffffffffffffffffffffeffffffffffffffff", radix: 16)!
    static let a = BInt("fffffffffffffffffffffffffffffffefffffffffffffffc", radix: 16)!
    static let b = BInt("64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1", radix: 16)!    /// The generator point x-coordinate
    static let gx = BInt("188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012", radix: 16)!
    static let gy = BInt("07192b95ffc8da78631011ed6b24cdd573f977a11e794811", radix: 16)!
    static let order = BInt("ffffffffffffffffffffffff99def836146bc9b1b4d22831", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.2.840.10045.3.1.1")!

    init() {
        super.init(EC192r1.name, EC192r1.p, EC192r1.a, EC192r1.b, EC192r1.gx, EC192r1.gy, EC192r1.order, EC192r1.cofactor, EC192r1.oid)
    }

}
