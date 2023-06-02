//
//  OFBCipher.swift
//  Test
//
//  Created by Leif Ibsen on 03/02/2020.
//

class OFBCipher: Cipher {

    var xor: Bytes

    init(_ key: Bytes, _ iv: Bytes, _ macKey: Bytes) {
        self.xor = iv
        super.init(key, macKey)
    }
    
    override func processBuffer(_ input: inout Bytes, _ index: inout Int, _ remaining: inout Int) throws {
        self.aes.encrypt(&self.xor)
        let n = min(AES.blockSize, remaining)
        for i in 0 ..< n {
            input[index + i] ^= self.xor[i]
        }
        index += AES.blockSize
        remaining -= AES.blockSize
    }

}
