//
//  ASN1IA5String.swift
//  ASN1
//
//  Created by Leif Ibsen on 30/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

/// ASN1 IA5String class
public class ASN1IA5String: ASN1SimpleType, CustomStringConvertible {
    
    // MARK: - Initializers

    /// Constructs an ASN1IA5String instance from a byte array
    ///
    /// - Parameter s: Byte array
    public init(_ s: Bytes) {
        super.init(ASN1.TAG_IA5String, s)
    }

    /// Constructs an ASN1IA5String instance from a String value
    ///
    /// - Parameter s: String value
    public convenience init(_ s: String) {
        self.init(ASN1.getASCIIBytes(s))
    }

    // MARK: Computed properties

    /// Description of *self*
    public override var description: String {
        return "IA5String: " + String(bytes: self.value, encoding: .ascii)!
    }

    

}
