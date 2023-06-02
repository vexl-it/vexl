//
//  ASN1Boolean.swift
//  ASN1
//
//  Created by Leif Ibsen on 29/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

/// ASN1 Boolean class
public class ASN1Boolean: ASN1, CustomStringConvertible {
    
    // MARK: - Initializers

    /// Constructs an ASN1Boolean instance
    ///
    /// - Parameter value: Value
    public init(_ value: Bool) {
        self.value = value
        super.init(ASN1.TAG_Boolean)
    }
    
    // MARK: Stored properties
    
    /// Value of *self*
    public let value: Bool
    
    // MARK: Computed properties
    
    /// Description of *self*
    public override var description: String {
        return "Boolean: " + self.value.description
    }

    override func doEncode(_ bytes: inout Bytes) {
        bytes.append(self.tag)
        bytes.append(Byte(1))
        bytes.append(Byte(self.value ? 0xff : 0x00))
    }
    
    override func getContentLength() -> Int {
        return 1
    }
    
}
