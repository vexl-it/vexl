//
//  ASN1SimpleType.swift
//  ASN1
//
//  Created by Leif Ibsen on 29/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

/// Superclass for ASN1BMPString, ASN1IA5String, ASN1ObjectIdentifier, ASN1OctetString, ASN1PrintableString, ASN1T61String, ASN1Time, and ASN1UTF8String
public class ASN1SimpleType: ASN1 {
    
    init(_ tag: Byte, _ value: Bytes) {
        self.value = value
        super.init(tag)
    }
    
    override func doEncode(_ bytes: inout Bytes) {
        bytes.append(self.tag)
        makeLength(self.value.count, &bytes)
        bytes += self.value
    }
    
    override func getContentLength() -> Int {
        return self.value.count
    }
    
    // MARK: Stored properties
    
    /// Value of *self*
    public let value: Bytes

}
