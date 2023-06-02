//
//  ASN1UTF8String.swift
//  ASN1
//
//  Created by Leif Ibsen on 29/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

/// ASN1 UTF8String class
public class ASN1UTF8String: ASN1SimpleType, CustomStringConvertible {
    
    // MARK: - Initializers

    /// Constructs an ASN1UTF8String instance from a byte array
    ///
    /// - Parameter s: Byte array
    public init(_ s: Bytes) {
        super.init(ASN1.TAG_UTF8String, s)
    }
    
    /// Constructs an ASN1UTF8String instance from a String value
    ///
    /// - Parameter s: String value
    public convenience init(_ s: String) {
        self.init(ASN1.getUTF8Bytes(s))
    }
    
    // MARK: Computed properties
    
    /// Description of *self*
    public override var description: String {
        return "UTF8String: " + String(bytes: self.value, encoding: .utf8)!
    }

}
