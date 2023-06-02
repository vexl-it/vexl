//
//  BP512.swift
//  AEC
//
//  Created by Leif Ibsen on 24/03/2019.
//




class BP512r1: DomainP {

    static let name = "brainpoolP512r1"
    static let p = BInt("aadd9db8dbe9c48b3fd4e6ae33c9fc07cb308db3b3c9d20ed6639cca703308717d4d9b009bc66842aecda12ae6a380e62881ff2f2d82c68528aa6056583a48f3", radix: 16)!
    static let a = BInt("7830a3318b603b89e2327145ac234cc594cbdd8d3df91610a83441caea9863bc2ded5d5aa8253aa10a2ef1c98b9ac8b57f1117a72bf2c7b9e7c1ac4d77fc94ca", radix: 16)!
    static let b = BInt("3df91610a83441caea9863bc2ded5d5aa8253aa10a2ef1c98b9ac8b57f1117a72bf2c7b9e7c1ac4d77fc94cadc083e67984050b75ebae5dd2809bd638016f723", radix: 16)!
    static let gx = BInt("81aee4bdd82ed9645a21322e9c4c6a9385ed9f70b5d916c1b43b62eef4d0098eff3b1f78e2d0d48d50d1687b93b97d5f7c6d5047406a5e688b352209bcb9f822", radix: 16)!
    static let gy = BInt("7dde385d566332ecc0eabfa9cf7822fdf209f70024a57b1aa000c55b881f8111b2dcde494a5f485e5bca4bd88a2763aed1ca2b2fa8f0540678cd1e0f3ad80892", radix: 16)!
    static let order = BInt("aadd9db8dbe9c48b3fd4e6ae33c9fc07cb308db3b3c9d20ed6639cca70330870553e5c414ca92619418661197fac10471db1d381085ddaddb58796829ca90069", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.13")!

    init() {
        super.init(BP512r1.name, BP512r1.p, BP512r1.a, BP512r1.b, BP512r1.gx, BP512r1.gy, BP512r1.order, BP512r1.cofactor, BP512r1.oid)
    }

}

class BP512t1: DomainP {

    static let name = "brainpoolP512t1"
    static let p = BInt("aadd9db8dbe9c48b3fd4e6ae33c9fc07cb308db3b3c9d20ed6639cca703308717d4d9b009bc66842aecda12ae6a380e62881ff2f2d82c68528aa6056583a48f3", radix: 16)!
    static let a = BInt("aadd9db8dbe9c48b3fd4e6ae33c9fc07cb308db3b3c9d20ed6639cca703308717d4d9b009bc66842aecda12ae6a380e62881ff2f2d82c68528aa6056583a48f0", radix: 16)!
    static let b = BInt("7cbbbcf9441cfab76e1890e46884eae321f70c0bcb4981527897504bec3e36a62bcdfa2304976540f6450085f2dae145c22553b465763689180ea2571867423e", radix: 16)!
    static let gx = BInt("640ece5c12788717b9c1ba06cbc2a6feba85842458c56dde9db1758d39c0313d82ba51735cdb3ea499aa77a7d6943a64f7a3f25fe26f06b51baa2696fa9035da", radix: 16)!
    static let gy = BInt("5b534bd595f5af0fa2c892376c84ace1bb4e3019b71634c01131159cae03cee9d9932184beef216bd71df2dadf86a627306ecff96dbb8bace198b61e00f8b332", radix: 16)!
    static let order = BInt("aadd9db8dbe9c48b3fd4e6ae33c9fc07cb308db3b3c9d20ed6639cca70330870553e5c414ca92619418661197fac10471db1d381085ddaddb58796829ca90069", radix: 16)!
    static let cofactor = 1
    static let oid = ASN1ObjectIdentifier("1.3.36.3.3.2.8.1.1.14")!

    init() {
        super.init(BP512t1.name, BP512t1.p, BP512t1.a, BP512t1.b, BP512t1.gx, BP512t1.gy, BP512t1.order, BP512t1.cofactor, BP512t1.oid)
    }

}
