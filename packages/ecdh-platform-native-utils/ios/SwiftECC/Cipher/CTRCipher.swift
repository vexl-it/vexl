//
//  CTRCipher.swift
//  AEC
//
//  Created by Leif Ibsen on 04/02/2020.
//

class CTRCipher: Cipher {

    var xor: Bytes

    init(_ key: Bytes, _ iv: Bytes, _ macKey: Bytes) {
        self.xor = iv
        super.init(key, macKey)
    }
    
    override func processBuffer(_ input: inout Bytes, _ index: inout Int, _ remaining: inout Int) throws {
        var work = self.xor
        self.aes.encrypt(&work)
        let n = min(AES.blockSize, remaining)
        for i in 0 ..< n {
            input[index + i] ^= work[i]
        }
        // Counter += 1
        for i in (0 ..< self.xor.count).reversed() {
            if self.xor[i] == 0xff {
                self.xor[i] = 0
            } else {
                self.xor[i] += 1
                break
            }
        }
        index += AES.blockSize
        remaining -= AES.blockSize
    }

}
