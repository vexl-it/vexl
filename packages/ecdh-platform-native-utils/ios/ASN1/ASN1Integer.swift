//
//  ASN1Integer.swift
//  ASN1
//
//  Created by Leif Ibsen on 30/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//



/// ASN1 Integer class
public class ASN1Integer: ASN1, CustomStringConvertible {

    // MARK: - Initializers

    /// Constructs an ASN1Integer instance from a big-endian 2's complement byte array
    ///
    /// - Parameter bytes: Byte array
    /// - Throws: An ASN1Exception if *bytes* is empty
    public init(_ bytes: Bytes) throws {
        guard bytes.count > 0 else {
            throw ASN1Exception.wrongData(position: 0)
        }
        self.asBytes = bytes
        self.value = BInt(signed: bytes)
        super.init(ASN1.TAG_Integer)
    }

    /// Constructs an ASN1Integer instance from a BInt value
    ///
    /// - Parameter value: BInt value
    public init(_ value: BInt) {
        self.value = value
        self.asBytes = value.asSignedBytes()
        super.init(ASN1.TAG_Integer)
    }

    // MARK: Stored properties

    /// Value of *self*
    public let value: BInt

    let asBytes: Bytes

    // MARK: Computed properties

    /// Description of *self*
    public override var description: String {
        return "Integer: " + self.value.asString(radix: 10)
    }

    override func doEncode(_ bytes: inout Bytes) {
        bytes.append(self.tag)
        makeLength(getContentLength(), &bytes)
        bytes += self.asBytes
    }

    override func getContentLength() -> Int {
        return self.asBytes.count
    }

}
