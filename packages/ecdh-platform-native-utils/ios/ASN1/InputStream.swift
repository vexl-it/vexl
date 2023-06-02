//
//  InputStream.swift
//  ASN1
//
//  Created by Leif Ibsen on 30/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

import Foundation

class InputStream {
    
    var stream: Data
    var position: Int
    let size: Int
    
    init(_ stream: Data) {
        self.stream = stream
        self.position = 0
        self.size = stream.count
    }
    
    convenience init(_ stream: Bytes) {
        self.init(Data(stream))
    }

    func nextByte() throws -> Byte {
        if self.position >= self.size {
            throw ASN1Exception.inputTooShort(position: self.position, length: 1)
        }
        let byte = self.stream[self.position]
        self.position += 1
        return byte
    }
    
    func nextBytes(_ length: Int) throws -> Bytes {
        if self.position + length > self.size {
            throw ASN1Exception.inputTooShort(position: self.position, length: length)
        }
        let bytes = Bytes(self.stream[self.position ..< self.position + length])
        self.position += length
        return bytes
    }
    
    func getPosition() -> Int {
        return self.position
    }

    func push2Back() {
        self.position -= 2
    }

}
