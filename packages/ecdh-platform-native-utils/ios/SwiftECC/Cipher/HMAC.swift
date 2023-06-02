//
//  HMAC.swift
//  Test
//
//  Created by Leif Ibsen on 02/02/2020.
//

class HMac {
    
    static let OPAD = Byte(0x5c)
    static let IPAD = Byte(0x36)
    
    let md: MessageDigest
    let blockSize: Int
    var iKeyPad: Bytes = []
    var oKeyPad: Bytes = []
    
    init(_ md: MessageDigest, _ key: Bytes) {
        self.md = md
        self.blockSize = self.md.buffer.count
        self.initialize(key)
    }
    
    func initialize(_ key: Bytes) {
        var macKey = Bytes(repeating: 0, count: self.blockSize)
        if key.count > self.blockSize {
            self.md.update(key)
            let x = self.md.digest()
            for i in 0 ..< x.count {
                macKey[i] = x[i]
            }
        } else {
            for i in 0 ..< key.count {
                macKey[i] = key[i]
            }
        }
        self.iKeyPad = Bytes(repeating: 0, count: self.blockSize)
        self.oKeyPad = Bytes(repeating: 0, count: self.blockSize)
        for i in 0 ..< self.blockSize {
            self.iKeyPad[i] = macKey[i] ^ HMac.IPAD
            self.oKeyPad[i] = macKey[i] ^ HMac.OPAD
        }
        self.reset()
    }
    
    func reset() {
        self.md.reset()
        self.md.update(self.iKeyPad)
    }

    func update(_ input: Bytes) {
        self.md.update(input)
    }

    func doFinal() -> Bytes {
        let b = self.md.digest()
        self.md.update(oKeyPad)
        self.md.update(b)
        return self.md.digest()
    }
    
    func doFinal(_ input: Bytes) -> Bytes {
        self.update(input)
        return doFinal()
    }

}
