//
//  ASN1BitString.swift
//  ASN1
//
//  Created by Leif Ibsen on 29/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

/// ASN1 BitString class
public class ASN1BitString: ASN1, CustomStringConvertible {
    
    // MARK: - Initializers

    /// Constructs an ASN1BitString instance
    ///
    /// - Parameters:
    ///   - bits: Byte array containing the bits
    ///   - unused: Number of unused bits
    /// - Throws: An ASN1Exception if *unused* has an illegal value
    public init(_ bits: Bytes, _ unused: Byte) throws {
        guard (bits.count > 0 && unused < 8) || (bits.count == 0 && unused == 0) else {
            throw ASN1Exception.wrongData(position: 0)
        }
        self.bits = bits
        self.unused = unused
        super.init(ASN1.TAG_BitString)
    }
    
    // MARK: Stored properties
    
    /// The bits of *self*
    public let bits: Bytes
    /// The number of unused bits
    public let unused: Byte
    
    // MARK: Computed properties
    
    /// Description of *self*
    public override var description: String {
        var s = "Bit String (" + (self.bits.count * 8 - Int(self.unused)).description + "):"
        if self.bits.count > 0 {
            for i in 0 ..< self.bits.count - 1 {
                s += " " + byte2bin(self.bits[i])
            }
            s += " " + byte2bin(self.bits.last!).prefix(8 - Int(self.unused))
        }
        return s
    }
    
    override func doEncode(_ bytes: inout Bytes) {
        bytes.append(self.tag)
        makeLength(getContentLength(), &bytes)
        bytes.append(self.unused)
        bytes += self.bits
    }
    
    override func getContentLength() -> Int {
        return self.bits.count + 1
    }

}
