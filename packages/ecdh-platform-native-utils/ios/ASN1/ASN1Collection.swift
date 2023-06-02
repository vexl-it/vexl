//
//  ASN1Collection.swift
//  ASN1
//
//  Created by Leif Ibsen on 29/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

import Foundation

/// Superclass for ASN1Sequence and ASN1Set
public class ASN1Collection: ASN1 {
    
    var value: [ASN1]
    
    convenience init(_ tag: Byte, _ isSet: Bool) {
        self.init(tag, [ASN1](), isSet);
    }
    
    init(_ tag: Byte, _ value: [ASN1], _ isSet: Bool) {
        self.value = value
        super.init(tag)
        if isSet {
            self.value.sort( by: { $0.tag < $1.tag } )
        }
    }
    
    // MARK: Functions
    
    /// Get collection
    ///
    /// - Returns: Value of *self*
    public func getValue() -> [ASN1] {
        return self.value
    }

    /// Add a value to a collection
    ///
    /// - Parameter asn1: Value to add
    /// - Returns: *self*
    public func add(_ asn1: ASN1) -> ASN1Collection {
        self.value.append(asn1)
        if self.tag == ASN1.TAG_Set {
            self.value.sort( by: { $0.tag < $1.tag } )
        }
        return self
    }
    
    /// Get a value from a collection
    ///
    /// - Parameter i: Index of value to get
    /// - Returns: Value at index
    public func get(_ i: Int) -> ASN1 {
        return self.value[i]
    }
    
    /// Remove a value from a collection - a set or a sequence.
    /// Note that a set is sorted by its element's tags,
    /// so a set element's index may not match the order in which it was inserted
    ///
    /// - Parameter i: Index of value to remove
    public func remove(_ i: Int) {
        self.value.remove(at: i)
    }

    override func doEncode(_ bytes: inout Bytes) {
        bytes.append(self.tag | 0x20)
        makeLength(getContentLength(), &bytes)
        for asn1 in self.value {
            asn1.doEncode(&bytes)
        }
    }
    
    override func getContentLength() -> Int {
        var length = 0
        for asn1 in self.value {
            length += asn1.getTotalLength()
        }
        return length
    }
    
}
