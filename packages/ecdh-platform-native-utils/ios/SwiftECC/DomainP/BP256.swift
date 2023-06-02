//
//  BP256.swift
//  AEC
//
//  Created by Leif Ibsen on 24/03/2019.
//




class BP256r1: DomainP {

    static let name = "brainpoolP256r1"
    static let p = BInt("a9fb57dba1eea9bc3e660a909d838d726e3bf623d52620282013481d1f6e5377", radix: 16)!
    static let a = BInt("7d5a0975fc2c3057eef67530417affe7fb8055c126dc5c6ce94a4b44f330b5d9", radix: 16)!
    static let b = BInt("26dc5c6ce94a4b44f330b5d9bbd77cbf958416295cf7e1ce6bccdc18ff8c07b6", radix: 16)!
    static let gx = BInt("8bd2aeb9cb7e57cb2c4b482ffc81b7afb9de27e1e3bd23c23a4453bd9ace3262", radix: 16)!
    static let gy = BInt("547ef835c3dac4fd97f8461a14611dc9c27745132ded8e545c1d54c72f046997", radix: 16)!
    static let order = BInt("a9fb57dba1eea9bc3e660a909d838d718c397aa3b561a6f7901e0e82974856a7", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.7")!

    init() {
        super.init(BP256r1.name, BP256r1.p, BP256r1.a, BP256r1.b, BP256r1.gx, BP256r1.gy, BP256r1.order, BP256r1.cofactor, BP256r1.oid)
    }

}

class BP256t1: DomainP {

    static let name = "brainpoolP256t1"
    static let p = BInt("a9fb57dba1eea9bc3e660a909d838d726e3bf623d52620282013481d1f6e5377", radix: 16)!
    static let a = BInt("a9fb57dba1eea9bc3e660a909d838d726e3bf623d52620282013481d1f6e5374", radix: 16)!
    static let b = BInt("662c61c430d84ea4fe66a7733d0b76b7bf93ebc4af2f49256ae58101fee92b04", radix: 16)!
    static let gx = BInt("a3e8eb3cc1cfe7b7732213b23a656149afa142c47aafbc2b79a191562e1305f4", radix: 16)!
    static let gy = BInt("2d996c823439c56d7f7b22e14644417e69bcb6de39d027001dabe8f35b25c9be", radix: 16)!
    static let order = BInt("a9fb57dba1eea9bc3e660a909d838d718c397aa3b561a6f7901e0e82974856a7", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.8")!

    init() {
        super.init(BP256t1.name, BP256t1.p, BP256t1.a, BP256t1.b, BP256t1.gx, BP256t1.gy, BP256t1.order, BP256t1.cofactor, BP256t1.oid)
    }

}
