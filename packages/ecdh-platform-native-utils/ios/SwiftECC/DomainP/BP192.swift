//
//  BP192.swift
//  AEC
//
//  Created by Leif Ibsen on 24/03/2019.
//




class BP192r1: DomainP {

    static let name = "brainpoolP192r1"
    static let p = BInt("c302f41d932a36cda7a3463093d18db78fce476de1a86297", radix: 16)!
    static let a = BInt("6a91174076b1e0e19c39c031fe8685c1cae040e5c69a28ef", radix: 16)!
    static let b = BInt("469a28ef7c28cca3dc721d044f4496bcca7ef4146fbf25c9", radix: 16)!
    static let gx = BInt("c0a0647eaab6a48753b033c56cb0f0900a2f5c4853375fd6", radix: 16)!
    static let gy = BInt("14b690866abd5bb88b5f4828c1490002e6773fa2fa299b8f", radix: 16)!
    static let order = BInt("c302f41d932a36cda7a3462f9e9e916b5be8f1029ac4acc1", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.3")!

    init() {
        super.init(BP192r1.name, BP192r1.p, BP192r1.a, BP192r1.b, BP192r1.gx, BP192r1.gy, BP192r1.order, BP192r1.cofactor, BP192r1.oid)
    }

}

class BP192t1: DomainP {

    static let name = "brainpoolP192t1"
    static let p = BInt("c302f41d932a36cda7a3463093d18db78fce476de1a86297", radix: 16)!
    static let a = BInt("c302f41d932a36cda7a3463093d18db78fce476de1a86294", radix: 16)!
    static let b = BInt("13d56ffaec78681e68f9deb43b35bec2fb68542e27897b79", radix: 16)!
    static let gx = BInt("3ae9e58c82f63c30282e1fe7bbf43fa72c446af6f4618129", radix: 16)!
    static let gy = BInt("097e2c5667c2223a902ab5ca449d0084b7e5b3de7ccc01c9", radix: 16)!
    static let order = BInt("c302f41d932a36cda7a3462f9e9e916b5be8f1029ac4acc1", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.4")!

    init() {
        super.init(BP192t1.name, BP192t1.p, BP192t1.a, BP192t1.b, BP192t1.gx, BP192t1.gy, BP192t1.order, BP192t1.cofactor, BP192t1.oid)
    }

}
