//
//  BP384.swift
//  AEC
//
//  Created by Leif Ibsen on 24/03/2019.
//




class BP384r1: DomainP {

    static let name = "brainpoolP384r1"
    static let p = BInt("8cb91e82a3386d280f5d6f7e50e641df152f7109ed5456b412b1da197fb71123acd3a729901d1a71874700133107ec53", radix: 16)!
    static let a = BInt("7bc382c63d8c150c3c72080ace05afa0c2bea28e4fb22787139165efba91f90f8aa5814a503ad4eb04a8c7dd22ce2826", radix: 16)!
    static let b = BInt("04a8c7dd22ce28268b39b55416f0447c2fb77de107dcd2a62e880ea53eeb62d57cb4390295dbc9943ab78696fa504c11", radix: 16)!
    static let gx = BInt("1d1c64f068cf45ffa2a63a81b7c13f6b8847a3e77ef14fe3db7fcafe0cbd10e8e826e03436d646aaef87b2e247d4af1e", radix: 16)!
    static let gy = BInt("8abe1d7520f9c2a45cb1eb8e95cfd55262b70b29feec5864e19c054ff99129280e4646217791811142820341263c5315", radix: 16)!
    static let order = BInt("8cb91e82a3386d280f5d6f7e50e641df152f7109ed5456b31f166e6cac0425a7cf3ab6af6b7fc3103b883202e9046565", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.11")!

    init() {
        super.init(BP384r1.name, BP384r1.p, BP384r1.a, BP384r1.b, BP384r1.gx, BP384r1.gy, BP384r1.order, BP384r1.cofactor, BP384r1.oid)
    }

}

class BP384t1: DomainP {

    static let name = "brainpoolP384t1"
    static let p = BInt("8cb91e82a3386d280f5d6f7e50e641df152f7109ed5456b412b1da197fb71123acd3a729901d1a71874700133107ec53", radix: 16)!
    static let a = BInt("8cb91e82a3386d280f5d6f7e50e641df152f7109ed5456b412b1da197fb71123acd3a729901d1a71874700133107ec50", radix: 16)!
    static let b = BInt("7f519eada7bda81bd826dba647910f8c4b9346ed8ccdc64e4b1abd11756dce1d2074aa263b88805ced70355a33b471ee", radix: 16)!
    static let gx = BInt("18de98b02db9a306f2afcd7235f72a819b80ab12ebd653172476fecd462aabffc4ff191b946a5f54d8d0aa2f418808cc", radix: 16)!
    static let gy = BInt("25ab056962d30651a114afd2755ad336747f93475b7a1fca3b88f2b6a208ccfe469408584dc2b2912675bf5b9e582928", radix: 16)!
    static let order = BInt("8cb91e82a3386d280f5d6f7e50e641df152f7109ed5456b31f166e6cac0425a7cf3ab6af6b7fc3103b883202e9046565", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.12")!

    init() {
        super.init(BP384t1.name, BP384t1.p, BP384t1.a, BP384t1.b, BP384t1.gx, BP384t1.gy, BP384t1.order, BP384t1.cofactor, BP384t1.oid)
    }

}
