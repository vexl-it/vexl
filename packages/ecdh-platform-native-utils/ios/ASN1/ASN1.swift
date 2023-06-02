//
//  ASN1.swift
//  ASN1
//
//  Created by Leif Ibsen on 29/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

import Foundation


/// Unsigned 8 bit value
public typealias Byte = UInt8
/// Array of unsigned 8 bit values
public typealias Bytes = [UInt8]

/// The superclass of all ASN1-classes
public class ASN1: Equatable {

    // MARK: - Constants

    /// ASN1 null value
    public static let NULL = ASN1Null()
    /// ASN1 integer 0
    public static let ZERO = ASN1Integer(BInt.ZERO)
    /// ASN1 integer 1
    public static let ONE = ASN1Integer(BInt.ONE)

    /// ASN1 Boolean tag = 1
    public static let TAG_Boolean = Byte(1)
    /// ASN1 Integer tag = 2
    public static let TAG_Integer = Byte(2)
    /// ASN1 BitString tag = 3
    public static let TAG_BitString = Byte(3)
    /// ASN1 OctetString tag = 4
    public static let TAG_OctetString = Byte(4)
    /// ASN1 Null tag = 5
    public static let TAG_Null = Byte(5)
    /// ASN1 ObjectIdentifier tag = 6
    public static let TAG_ObjectIdentifier = Byte(6)
    /// ASN1 UTF8String tag = 12
    public static let TAG_UTF8String = Byte(12)
    /// ASN1 Sequence tag = 16
    public static let TAG_Sequence = Byte(16)
    /// ASN1 Set tag = 17
    public static let TAG_Set = Byte(17)
    /// ASN1 PrintableString tag = 19
    public static let TAG_PrintableString = Byte(19)
    /// ASN1 T61String tag = 20
    public static let TAG_T61String = Byte(20)
    /// ASN1 IA5String tag = 22
    public static let TAG_IA5String = Byte(22)
    /// ASN1 UTCTime tag = 23
    public static let TAG_UTCTime = Byte(23)
    /// ASN1 GeneralizedTime tag = 24
    public static let TAG_GeneralizedTime = Byte(24)
    /// ASN1 BMPString tag = 30
    public static let TAG_BMPString = Byte(30)

    static let hex = [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f" ]
    static let bin = [ "0000", "0001", "0010", "0011", "0100", "0101", "0110", "0111", "1000", "1001", "1010",
    "1011", "1100", "1101", "1110", "1111" ]

    init(_ tag: Byte) {
        self.tag = tag
    }

    // MARK: Stored properties

    /// The ASN1 tag
    public let tag: Byte

    // MARK: Computed properties

    /// Description of *self*
    public var description: String { get { return "ASN1" } }

    // MARK: Functions

    /// Equality of two ASN1 instances
    ///
    /// - Parameters:
    ///   - a1: an ASN1 instance
    ///   - a2: an ASN1 instance
    /// - Returns: *true* if a1 and a2 have the same tag and same value, *false* otherwise
    public static func == (a1: ASN1, a2: ASN1) -> Bool {
        if type(of: a1) != type(of: a2) {
            return false
        }
        switch type(of: a1) {
        case is ASN1BitString.Type:
            let x1 = a1 as! ASN1BitString
            let x2 = a2 as! ASN1BitString
            return x1.bits == x2.bits && x1.unused == x2.unused

        case is ASN1Boolean.Type:
            let x1 = a1 as! ASN1Boolean
            let x2 = a2 as! ASN1Boolean
            return x1.value == x2.value

        case is ASN1Collection.Type:
            let x1 = a1 as! ASN1Collection
            let x2 = a2 as! ASN1Collection
            if x1.value.count != x2.value.count {
                return false
            }
            for i in 0 ..< x1.value.count {
                if x1.value[i] != x2.value[i] {
                    return false
                }
            }
            return true

        case is ASN1Ctx.Type:
            let x1 = a1 as! ASN1Ctx
            let x2 = a2 as! ASN1Ctx
            return x1.value == x2.value && x1.bytes == x2.bytes

        case is ASN1Integer.Type:
            let x1 = a1 as! ASN1Integer
            let x2 = a2 as! ASN1Integer
            return x1.value == x2.value

        case is ASN1Null.Type:
            return true

        case is ASN1ObjectIdentifier.Type:
            let x1 = a1 as! ASN1ObjectIdentifier
            let x2 = a2 as! ASN1ObjectIdentifier
            return x1.oid == x2.oid

        case is ASN1SimpleType.Type:
            let x1 = a1 as! ASN1SimpleType
            let x2 = a2 as! ASN1SimpleType
            return x1.value == x2.value

        default:
            return false
        }
    }

    /// Encode *self* as a byte array
    ///
    /// - Returns: ASN1 DER encoding of *self*
    public func encode() -> Bytes {
        var bytes = Bytes()
        doEncode(&bytes)
        return bytes
    }

    /// Build an ASN1 instance from a Data stream
    ///
    /// - Parameter stream: Data instance containing the ASN1 DER encoding
    /// - Returns: An ASN1 instance
    /// - Throws: An ASN1Exception if the input is invalid
    public static func build(_ stream: Data) throws -> ASN1 {
        return try doBuild(InputStream(stream))
    }

    /// Build an ASN1 instance from a byte array
    ///
    /// - Parameter bytes: Byte array containing the ASN1 DER encoding
    /// - Returns: An ASN1 instance
    /// - Throws: An ASN1Exception if the input is invalid
    public static func build(_ bytes: Bytes) throws -> ASN1 {
        return try doBuild(InputStream(bytes))
    }

    func indent(_ data: inout String, _ level: Int) {
        for _ in 0 ..< level {
            data += "  "
        }
    }

    func doDump(_ data: inout String, _ level: Int) {
        self.indent(&data, level)
        data += self.description
        data += "\n"
    }

    func doEncode(_ bytes: inout Bytes) {
        fatalError("ASN1.doEncode called")
    }

    func getContentLength() -> Int {
        fatalError("ASN1.getContentLength called")
    }

    func makeLength(_ length: Int, _ bytes: inout Bytes) {
        if length < 128 {
            bytes.append(Byte(length))
        } else if length < 256 {
            bytes.append(Byte(0x81))
            bytes.append(Byte(length))
        } else if length < 256 * 256 {
            bytes.append(Byte(0x82))
            bytes.append(Byte(length >> 8))
            bytes.append(Byte(length & 0xff))
        } else if length < 256 * 256 * 256 {
            bytes.append(Byte(0x83))
            bytes.append(Byte(length >> 16))
            bytes.append(Byte((length >> 8) & 0xff))
            bytes.append(Byte(length & 0xff))
        } else {
            bytes.append(Byte(0x84))
            bytes.append(Byte(length >> 24))
            bytes.append(Byte((length >> 16) & 0xff))
            bytes.append(Byte((length >> 8) & 0xff))
            bytes.append(Byte(length & 0xff))
        }
    }

    func getLengthLength() -> Int {
        let length = getContentLength()
        if length < 128 {
            return 1
        } else if length < 256 {
            return 2
        } else if length < 256 * 256 {
            return 3
        } else if length < 256 * 256 * 256 {
            return 4
        } else {
            return 5
        }
    }

    func getTotalLength() -> Int {
        return getContentLength() + getLengthLength() + 1
    }

    func byte2hex(_ b: Byte) -> String {
        return ASN1.hex[Int((b >> 4) & 0x0f)] + ASN1.hex[Int(b & 0x0f)]
    }

    func byte2bin(_ b: Byte) -> String {
        return ASN1.bin[Int((b >> 4) & 0x0f)] + ASN1.bin[Int(b & 0x0f)]
    }

    static let INDEFINITE = -1

    static func getLength(_ input: InputStream) throws -> Int {
        var length: Int
        let nb = try input.nextByte()
        if nb < 128 {
            length = Int(nb)
        } else {
            let lb = nb & 0x7f
            if lb == 0 {
                length = INDEFINITE
            } else if lb == 1 {
                length = Int(try input.nextByte())
            } else if lb == 2 {
                length = Int(try input.nextByte())
                length <<= 8
                length |= Int(try input.nextByte())
            } else if lb == 3 {
                length = Int(try input.nextByte())
                length <<= 8
                length |= Int(try input.nextByte())
                length <<= 8
                length |= Int(try input.nextByte())
            } else if lb == 4 {
                length = Int(try input.nextByte())
                length <<= 8
                length |= Int(try input.nextByte())
                length <<= 8
                length |= Int(try input.nextByte())
                length <<= 8
                length |= Int(try input.nextByte())
            } else {
                throw ASN1Exception.tooLong(position: input.getPosition(), length: Int(lb))
            }
        }
        return length
    }

    static func getTag(_ nb: Byte, _ input: InputStream) throws -> Byte {
        var tag = nb & 0x1f
        if tag == 0x1f {
            tag = try input.nextByte()
            if tag > 127 {
                throw ASN1Exception.tagTooBig(position: input.getPosition())
            }
        }
        return tag
    }

    static func indefiniteLength(_ input: InputStream) throws -> [ASN1] {
        var list = [ASN1]()
        while true {
            let b0 = try input.nextByte()
            let b1 = try input.nextByte()
            if b0 == 0 && b1 == 0 {
                break
            }
            input.push2Back()
            try list.append(doBuild(input))
        }
        return list
    }

    static func doBuild(_ input: InputStream) throws -> ASN1 {
        let nb = try input.nextByte()
        let tagClass = (nb >> 6) & 0x3
        let constructed = nb & 0x20 != 0
        let tag = try getTag(nb, input)
        let length = try getLength(input)
        if tagClass == 2 {
            if length == INDEFINITE {
                return try ASN1Ctx(tag, indefiniteLength(input))
            } else if constructed {
                return try ASN1Ctx(tag, length > 0 ? [ASN1.build(input.nextBytes(length))] : [])
            } else {
                return try ASN1Ctx(tag, input.nextBytes(length))
            }
        } else if tagClass == 0 {
            if length == INDEFINITE && tag != TAG_Sequence && tag != TAG_Set {
                throw ASN1Exception.indefiniteLength(position: input.getPosition())
            }
            switch tag {
            case TAG_Boolean:
                if length != 1 {
                    throw ASN1Exception.wrongData(position: input.getPosition())
                }
                return ASN1Boolean(try input.nextByte() != 0)

            case TAG_UTCTime:
                return ASN1UTCTime(try input.nextBytes(length))

            case TAG_GeneralizedTime:
                return ASN1GeneralizedTime(try input.nextBytes(length))

            case TAG_IA5String:
                return ASN1IA5String(try input.nextBytes(length))

            case TAG_PrintableString:
                return ASN1PrintableString(try input.nextBytes(length))

            case TAG_T61String:
                return ASN1T61String(try input.nextBytes(length))

            case TAG_BMPString:
                return ASN1BMPString(try input.nextBytes(length))

            case TAG_UTF8String:
                return ASN1UTF8String(try input.nextBytes(length))

            case TAG_Integer:
                do {
                    return try ASN1Integer(try input.nextBytes(length))
                } catch ASN1Exception.wrongData(_) {
                    throw ASN1Exception.wrongData(position: input.getPosition())
                }

            case TAG_OctetString:
                return ASN1OctetString(try input.nextBytes(length))

            case TAG_Sequence:
                var list: [ASN1]
                if length == INDEFINITE {
                    list = try indefiniteLength(input)
                } else {
                    list = [ASN1]()
                    let here = input.getPosition()
                    while input.getPosition() < here + length {
                        try list.append(doBuild(input))
                    }
                }
                return ASN1Sequence(list)

            case TAG_Set:
                var list: [ASN1]
                if length == INDEFINITE {
                    list = try indefiniteLength(input)
                } else {
                    list = [ASN1]()
                    let here = input.getPosition()
                    while input.getPosition() < here + length {
                        try list.append(doBuild(input))
                    }
                }
                return ASN1Set(list)

            case TAG_ObjectIdentifier:
                guard let oid = ASN1ObjectIdentifier(try input.nextBytes(length)) else {
                    throw ASN1Exception.wrongData(position: input.getPosition())
                }
                return oid

            case TAG_BitString:
                if length == 0 {
                    throw ASN1Exception.wrongData(position: input.getPosition())
                }
                let unused = try input.nextByte()
                return try ASN1BitString(input.nextBytes(length - 1), unused)

            case TAG_Null:
                if length != 0 {
                    throw ASN1Exception.wrongData(position: input.getPosition())
                }
                return ASN1.NULL

            default:
                throw ASN1Exception.unsupportedTag(position: input.getPosition(), tag: tag)
            }
        } else {
            throw ASN1Exception.unsupportedTagClass(position: input.getPosition(), tagClass: tagClass)
        }
    }

    static func getASCIIBytes(_ s: String) -> Bytes {
        var bytes = Bytes()
        for x in s.utf16 {
            bytes.append(x < 0x80 ? Byte(x) : 63)
        }
        return bytes
    }

    static func getISO8859Bytes(_ s: String) -> Bytes {
        var bytes = Bytes()
        for x in s.utf16 {
            bytes.append(x < 0x100 ? Byte(x) : 63)
        }
        return bytes
    }

    static func getUTF8Bytes(_ s: String) -> Bytes {
        var bytes = Bytes()
        for x in s.utf16 {
            if x < 0x80 {
                bytes.append(Byte(x))
            } else if x < 0x800 {
                bytes.append(Byte(0xc0 | (x >> 6)))
                bytes.append(Byte(0x80 | (x & 0x3f)))
            } else {
                bytes.append(63)
            }
        }
        return bytes
    }

    static func getUTF16Bytes(_ s: String) -> Bytes {
        var bytes = Bytes()
        for x in s.utf16 {
            bytes.append(Byte((x >> 8) & 0xff))
            bytes.append(Byte(x & 0xff))
        }
        return bytes
    }

}

extension Data {

    mutating func append(_ s: String) {
        self.append(s.data(using: .utf8)!)
    }
}
