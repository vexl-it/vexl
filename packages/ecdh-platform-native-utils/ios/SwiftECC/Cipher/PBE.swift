//
//  PBE.swift
//  SwiftECCTest
//
//  Created by Leif Ibsen on 21/03/2022.
//

// Password based encryption according to [PKCS#5]
class PBE {

    let hmac: HMac
    let hLen: Int
    let password: Bytes
    
    init(_ md: MessageDigest, _ password: Bytes) {
        self.hmac = HMac(md, password)
        self.hLen = md.digestLength
        self.password = password
    }
    
    func F(_ salt: Bytes, _ c: Int, _ i: Int) -> Bytes {
        var F = Bytes(repeating: 0, count: self.hLen)
        var U = salt
        U.append(Byte((i >> 24) & 0xff))
        U.append(Byte((i >> 16) & 0xff))
        U.append(Byte((i >> 8) & 0xff))
        U.append(Byte((i >> 0) & 0xff))
        for _ in 0 ..< c {
            self.hmac.reset()
            U = self.hmac.doFinal(U)
            for j in 0 ..< self.hLen {
                F[j] ^= U[j]
            }
        }
        return F
    }

    // [PKCS#5] - section 5.2
    func kdf2(_ salt: Bytes, _ c: Int, _ length: Int) -> Bytes {
        var T: Bytes = []
        let l = (length + self.hLen - 1) / self.hLen
        for i in 1 ... l {
            T += F(salt, c, i)
        }
        return Bytes(T[0 ..< length])
    }

}

