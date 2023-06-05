import UIKit
import SwiftECC
import CryptoKit

func printTime(from: UInt64) {
    let now = DispatchTime.now().uptimeNanoseconds
    let fromNow = String(Double(now - from) / 1_000_000_000)
    print("measure: " + fromNow + " sec")
}

func align(d: Domain, _ b: Bytes) -> Bytes {
    var bb = b
    while bb.count < (d.p.bitWidth + 7) / 8 {
        bb.insert(0, at: 0)
    }
    return bb
}

func keyAgreementCustom(privKey: ECPrivateKey, pubKey: ECPublicKey, length: Int) throws -> Bytes {
    if privKey.domain != pubKey.domain {
        throw ECException.keyAgreementParameter
    }
    
    if length < 0 {
        throw ECException.keyAgreementParameter
    }
    
    let now = DispatchTime.now()
    var Z = try privKey.domain.multiplyPoint(pubKey.w, privKey.s).x.asMagnitudeBytes()
    Z = align(d: privKey.domain, Z)
    printTime2(from: now.uptimeNanoseconds)
    
    // [SEC 1] - section 3.6.1
    // Directly concatenate Z, counter, and sharedInfo to get k, without hashing

    var k: Bytes = []
    var counter: Bytes = [0, 0, 0, 1]
    let n = length == 0 ? 0 : (length - 1) / Z.count + 1
    for _ in 0 ..< n {
        k += Z
        k += counter
        counter[3] &+= 1
        if counter[3] == 0 {
            counter[2] &+= 1
            if counter[2] == 0 {
                counter[1] &+= 1
                if counter[1] == 0 {
                    counter[0] &+= 1
                }
            }
        }
    }
    return Bytes(k[0 ..< length])
}

func printTime2(from: UInt64) {
    let now = DispatchTime.now().uptimeNanoseconds
    let fromNow = String(Double(now - from) / 1_000_000_000)
    print("measure: " + fromNow + " sec")
}

var greeting = "Hello, playground"





let domain256k1 = Domain.instance(curve: .EC256r1)



let k1 = domain256k1.makeKeyPair()
let k2 = domain256k1.makeKeyPair()

let from = DispatchTime.now().uptimeNanoseconds

try k1.1.keyAgreement(pubKey: k2.0, length: 32, md: .SHA1, sharedInfo: [])

let now = DispatchTime.now().uptimeNanoseconds
let fromNow = String(Double(now - from) / 1_000_000_000)
print("took: " + fromNow + " sec")

let pp1 = try P256.KeyAgreement.PrivateKey(pemRepresentation: k1.1.pemPkcs8)
let pubKey = try P256.KeyAgreement.PublicKey(pemRepresentation: k2.0.pem)

try pp1.sharedSecretFromKeyAgreement(with: pubKey)
