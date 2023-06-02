//
//  ASN1Set.swift
//  ASN1
//
//  Created by Leif Ibsen on 29/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

/// ASN1 Set class
public class ASN1Set: ASN1Collection, CustomStringConvertible {
    
    // MARK: - Initializers

    /// Constructs an empty ASN1Set instance
    public convenience init() {
        self.init([ASN1]())
    }
    
    /// Constructs an ASN1Set instance from an ASN1 array
    ///
    /// - Parameter sequence: ASN1 array
    public init(_ set: [ASN1]) {
        super.init(ASN1.TAG_Set, set, true)
    }
    
    // MARK: Computed properties
    
    /// Description of *self*
    public override var description: String {
        var s = ""
        doDump(&s, 0)
        return s
    }

    override func doDump(_ data: inout String, _ level: Int) {
        self.indent(&data, level)
        var s = "Set (" + self.value.count.description + "):\n"
        for asn1 in self.value {
            asn1.doDump(&s, level + 1)
        }
        data += s
    }

}
