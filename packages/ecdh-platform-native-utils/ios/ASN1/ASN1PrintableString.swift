//
//  ASN1PrintableString.swift
//  ASN1
//
//  Created by Leif Ibsen on 29/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

/// ASN1 PrintableString class
public class ASN1PrintableString: ASN1SimpleType, CustomStringConvertible {

    // MARK: - Initializers

    /// Constructs an ASN1PrintableString instance from a byte array
    ///
    /// - Parameter s: Byte array
    public init(_ s: Bytes) {
        super.init(ASN1.TAG_PrintableString, s)
    }
    
    /// Constructs an ASN1PrintableString instance from a String value
    ///
    /// - Parameter s: String value
    public convenience init(_ s: String) {
        self.init(ASN1.getASCIIBytes(s))
    }
    
    // MARK: Computed properties
    
    /// Description of *self*
    public override var description: String {
        return "PrintableString: " + String(bytes: self.value, encoding: .ascii)!
    }

}
