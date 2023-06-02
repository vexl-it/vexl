//
//  ASN1ObjectIdentifier.swift
//  ASN1
//
//  Created by Leif Ibsen on 29/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//



/// ASN1 ObjectIdentifier class
public class ASN1ObjectIdentifier: ASN1SimpleType, CustomStringConvertible, Hashable {

    // MARK: - Initializers

    /// Constructs an ASN1ObjectIdentifier instance from a branch of an ASN1ObjectIdentifier, *nil* if *branch* is negative
    ///
    /// - Parameters:
    ///   - oid: Object identifier
    ///   - branch: Branch number
    public init?(_ oid: ASN1ObjectIdentifier, _ branch: Int) {
        if branch < 0 {
            return nil
        }
        do {
            let value = try ASN1ObjectIdentifier.oid2bytes(oid.oid + "." + branch.description)
            self.oid = try ASN1ObjectIdentifier.bytes2oid(value)
            super.init(ASN1.TAG_ObjectIdentifier, value)
        } catch {
            return nil
        }
    }

    /// Constructs an ASN1ObjectIdentifier instance from a String, *nil* if *oid* is wrong
    ///
    /// - Parameter oid: String value
    public init?(_ oid: String) {
        do {
            let bytes = try ASN1ObjectIdentifier.oid2bytes(oid)
            self.oid = try ASN1ObjectIdentifier.bytes2oid(bytes)
            super.init(ASN1.TAG_ObjectIdentifier, bytes)
        } catch {
            return nil
        }
    }

    /// Constructs an ASN1ObjectIdentifier instance from a byte array, *nil* if *value* is wrong
    ///
    /// - Parameter value: Byte array
    public init?(_ value: Bytes) {
        do {
            self.oid = try ASN1ObjectIdentifier.bytes2oid(value)
            super.init(ASN1.TAG_ObjectIdentifier, value)
        } catch {
            return nil
        }
    }

    // MARK: Stored properties

    /// Value of *self*
    public let oid: String

    // MARK: Computed properties

    /// Description of *self*
    public override var description: String {
        return "Object Identifier: " + self.oid
    }

    // MARK: - Functions

    /// Get a specified branch of *self*
    ///
    /// - Parameter i: Branch number
    /// - Returns: The specified branch
    public func branch(_ i: Int) -> ASN1ObjectIdentifier? {
        return ASN1ObjectIdentifier(self, i)
    }

    /// The hash function
    ///
    /// - Parameter into: The hasher
    public func hash(into: inout Hasher) {
        into.combine(self.oid)
    }

    static func encodeInt(_ x: BInt) -> Bytes {
        let mask = BInt(127)
        var bytes: Bytes = []
        var xx = x
        var la: Bytes = []
        la.append(Byte((xx & mask).asInt()!))
        xx >>= 7
        while xx > 0 {
            la.append(Byte((xx & mask).asInt()!) | 0x80)
            xx >>= 7
        }
        for b in la.reversed() {
            bytes.append(b)
        }
        return bytes
    }

    static func oid2bytes(_ oid: String) throws -> Bytes {
        let components = oid.components(separatedBy: ".")
        var bytes: Bytes = []
        guard components.count > 1 else {
            throw ASN1Exception.wrongData(position: 0)
        }
        guard let c0 = BInt(components[0]) else {
            throw ASN1Exception.wrongData(position: 0)
        }
        guard let c1 = BInt(components[1]) else {
            throw ASN1Exception.wrongData(position: 0)
        }
        if c1 < 0 {
            throw ASN1Exception.wrongData(position: 0)
        }
        if c0 == 0 {
            if c1 < 40 {
                bytes.append(Byte(c1.asInt()!))
            } else {
                throw ASN1Exception.wrongData(position: 0)
            }
        } else if c0 == 1 {
            if c1 < 40 {
                bytes.append(Byte(40 + c1.asInt()!))
            } else {
                throw ASN1Exception.wrongData(position: 0)
            }
        } else if c0 == 2 {
            bytes.append(contentsOf: encodeInt(c1 + 80))
        } else {
            throw ASN1Exception.wrongData(position: 0)
        }
        for i in 2 ..< components.count {
            guard let x = BInt(components[i]) else {
                throw ASN1Exception.wrongData(position: 0)
            }
            if x < 0 {
                throw ASN1Exception.wrongData(position: 0)
            }
            bytes.append(contentsOf: encodeInt(x))
        }
        return bytes
    }

    static func bytes2oid(_ bytes: Bytes) throws -> String {
        guard bytes.count > 0 else {
            throw ASN1Exception.wrongData(position: 0)
        }
        guard bytes[bytes.count - 1] < 128 else {
            throw ASN1Exception.wrongData(position: 0)
        }
        guard bytes[0] != 128 else {
            throw ASN1Exception.wrongData(position: 0)
        }
        var sb = ""
        var n = 1
        var l = BInt.ZERO
        if bytes[0] < 40 {
            sb.append("0." + bytes[0].description)
        } else if bytes[0] < 80 {
            sb.append("1." + (bytes[0] - 40).description)
        } else if bytes[0] < 128 {
            sb.append("2." + (bytes[0] - 80).description)
        } else {
            l = BInt(Int(bytes[0]) & 0x7f)
            n = 0
            while bytes[n] >= 128 {
                l *= 128
                n += 1
                l += BInt(Int(bytes[n] & 0x7f))
            }
            l -= 80
            sb.append("2." + l.asString())
            n += 1
        }
        l = BInt.ZERO
        for i in n ..< bytes.count {
            l *= 128
            l += BInt(Int(bytes[i] & 0x7f))
            if bytes[i] < 128 {
                sb.append("." + l.asString())
                l = BInt.ZERO
            }
        }
        return sb
    }

}
