//
//  ASN1Ctx.swift
//  ASN1Test
//
//  Created by Leif Ibsen on 13/11/2019.
//

import Foundation

/// ASN1 Ctx class - a placeholder for ASN1 values of the context-specific class
public class ASN1Ctx: ASN1, CustomStringConvertible {
    
    // MARK: - Initializers

    /// Constructs an ASN1Ctx instance containing a constructed value
    ///
    /// - Parameters:
    ///   - tag: Instance tag
    ///   - value: Instance value
    public init(_ tag: Byte, _ value: [ASN1]) {
        self.value = value
        self.bytes = nil
        super.init(tag)
    }

    /// Constructs an ASN1Ctx instance containing a primitive value
    ///
    /// - Parameters:
    ///   - tag: Instance tag
    ///   - bytes: Instance value
    public init(_ tag: Byte, _ bytes: Bytes) {
        self.value = nil
        self.bytes = bytes
        super.init(tag)
    }

    // MARK: Stored properties
    
    /// Value of *self* if it is a constructed value, otherwise *nil*
    public var value: [ASN1]?
    /// Value of *self* if it is a primitive value, otherwise *nil*
    public var bytes: Bytes?

    // MARK: Computed properties
    
    /// Description of *self*
    public override var description: String {
        var s = ""
        doDump(&s, 0)
        return s
    }

    override func doEncode(_ bytes: inout Bytes) {
        bytes.append(contentsOf: makeTag())
        makeLength(getContentLength(), &bytes)
        if self.bytes == nil {
            for asn1 in self.value! {
                asn1.doEncode(&bytes)
            }
        } else {
            bytes += self.bytes!
        }
    }

    override func getContentLength() -> Int {
        var length = 0
        if self.bytes == nil {
            for asn1 in self.value! {
                length += asn1.getTotalLength()
            }
        } else {
            length = self.bytes!.count
        }
        return length
    }
    
    override func doDump(_ data: inout String, _ level: Int) {
        self.indent(&data, level)
        var s = "[" + self.tag.description + "]:"
        if self.bytes == nil {
            s += "\n"
            for asn1 in self.value! {
                asn1.doDump(&s, level + 1)
            }
        } else {
            for i in 0 ..< self.bytes!.count {
                s += " " + byte2hex(self.bytes![i])
            }
            s += "\n"
        }
        data += s
    }
    
    func makeTag() -> Bytes {
        var tg: Bytes = [self.bytes == nil ? 0xa0 : 0x80]
        if self.tag < 0x1f {
            tg[0] |= self.tag
        } else {
            tg[0] |= 0x1f
            tg.append(self.tag)
        }
        return tg
    }
}
