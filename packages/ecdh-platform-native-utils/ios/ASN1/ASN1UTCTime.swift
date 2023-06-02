//
//  ASN1UTCTime.swift
//  ASN1
//
//  Created by Leif Ibsen on 30/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

import Foundation

/// ASN1 UTCTime class
public class ASN1UTCTime: ASN1Time, CustomStringConvertible {
    
    // MARK: - Initializers

    /// Constructs an ASN1UTCTime instance from a Date
    ///
    /// - Parameter date: Date
    public init(_ date: Date) {
        super.init(ASN1.TAG_UTCTime, date, false)
    }
    
    /// Constructs an ASN1UTCTime instance from a byte array
    ///
    /// - Parameter bytes: Byte array
    public init(_ bytes: Bytes) {
        super.init(ASN1.TAG_UTCTime, bytes, false)
    }
    
    // MARK: Computed properties
    
    /// Description of *self*
    public override var description: String {
        return "UTCTime: " + String(bytes: self.value, encoding: .ascii)!
    }

}
