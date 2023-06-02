//
//  BP320.swift
//  AEC
//
//  Created by Leif Ibsen on 24/03/2019.
//




class BP320r1: DomainP {

    static let name = "brainpoolP320r1"
    static let p = BInt("d35e472036bc4fb7e13c785ed201e065f98fcfa6f6f40def4f92b9ec7893ec28fcd412b1f1b32e27", radix: 16)!
    static let a = BInt("3ee30b568fbab0f883ccebd46d3f3bb8a2a73513f5eb79da66190eb085ffa9f492f375a97d860eb4", radix: 16)!
    static let b = BInt("520883949dfdbc42d3ad198640688a6fe13f41349554b49acc31dccd884539816f5eb4ac8fb1f1a6", radix: 16)!
    static let gx = BInt("43bd7e9afb53d8b85289bcc48ee5bfe6f20137d10a087eb6e7871e2a10a599c710af8d0d39e20611", radix: 16)!
    static let gy = BInt("14fdd05545ec1cc8ab4093247f77275e0743ffed117182eaa9c77877aaac6ac7d35245d1692e8ee1", radix: 16)!
    static let order = BInt("d35e472036bc4fb7e13c785ed201e065f98fcfa5b68f12a32d482ec7ee8658e98691555b44c59311", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.9")!

    init() {
        super.init(BP320r1.name, BP320r1.p, BP320r1.a, BP320r1.b, BP320r1.gx, BP320r1.gy, BP320r1.order, BP320r1.cofactor, BP320r1.oid)
    }

}

class BP320t1: DomainP {

    static let name = "brainpoolP320t1"
    static let p = BInt("d35e472036bc4fb7e13c785ed201e065f98fcfa6f6f40def4f92b9ec7893ec28fcd412b1f1b32e27", radix: 16)!
    static let a = BInt("d35e472036bc4fb7e13c785ed201e065f98fcfa6f6f40def4f92b9ec7893ec28fcd412b1f1b32e24", radix: 16)!
    static let b = BInt("a7f561e038eb1ed560b3d147db782013064c19f27ed27c6780aaf77fb8a547ceb5b4fef422340353", radix: 16)!
    static let gx = BInt("925be9fb01afc6fb4d3e7d4990010f813408ab106c4f09cb7ee07868cc136fff3357f624a21bed52", radix: 16)!
    static let gy = BInt("63ba3a7a27483ebf6671dbef7abb30ebee084e58a0b077ad42a5a0989d1ee71b1b9bc0455fb0d2c3", radix: 16)!
    static let order = BInt("d35e472036bc4fb7e13c785ed201e065f98fcfa5b68f12a32d482ec7ee8658e98691555b44c59311", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.10")!

    init() {
        super.init(BP320t1.name, BP320t1.p, BP320t1.a, BP320t1.b, BP320t1.gx, BP320t1.gy, BP320t1.order, BP320t1.cofactor, BP320t1.oid)
    }

}
