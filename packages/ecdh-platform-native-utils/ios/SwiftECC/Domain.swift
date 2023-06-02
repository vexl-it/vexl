//
//  Domain.swift
//  AEC
//
//  Created by Leif Ibsen on 23/10/2019.
//




///
/// An 8-bit unsigned integer
///
public typealias Byte = UInt8
///
/// An array of 8-bit unsigned integers
///
public typealias Bytes = [Byte]

///
/// A Domain instance contains an elliptic curve domain - either with characteristic 2 or characteristic an odd prime.
/// Please refer [SEC 1] section 3.1.
///
public class Domain: CustomStringConvertible, Equatable {

    init(_ domainP: DomainP) {
        self.name = domainP.name
        self.p = domainP.p
        self.a = domainP.a
        self.b = domainP.b
        self.g = Point(domainP.g.x, domainP.g.y)
        self.order = domainP.order
        self.cofactor = domainP.cofactor
        self.oid = domainP.oid
        self.characteristic2 = false
        self.domainP = domainP
        self.domain2 = nil
    }

    init(_ domain2: Domain2) {
        self.name = domain2.name
        self.p = domain2.rp.p
        self.a = domain2.a.asBInt()
        self.b = domain2.b.asBInt()
        self.g = Point(domain2.g.x.asBInt(), domain2.g.y.asBInt())
        self.order = domain2.order
        self.cofactor = domain2.cofactor
        self.oid = domain2.oid
        self.characteristic2 = true
        self.domainP = nil
        self.domain2 = domain2
    }


    // MARK: - Constants

    /// Prime characteristic domain OID
    public static let OID_P = ASN1ObjectIdentifier("1.2.840.10045.1.1")!
    /// Characteristic 2 domain OID
    public static let OID_2 = ASN1ObjectIdentifier("1.2.840.10045.1.2")!
    /// Elliptic curve OID
    public static let OID_EC = ASN1ObjectIdentifier("1.2.840.10045.2.1")!


    // MARK: Static Methods

    /// Returns a predefined domain from its curve
    ///
    /// - Parameters:
    ///   - curve: The domain curve
    /// - Returns: The corresponding domain
    public static func instance(curve: ECCurve) -> Domain {
        switch curve {
        case .BP160r1:
            return Domain(BP160r1())
        case .BP160t1:
            return Domain(BP160t1())
        case .BP192r1:
            return Domain(BP192r1())
        case .BP192t1:
            return Domain(BP192t1())
        case .BP224r1:
            return Domain(BP224r1())
        case .BP224t1:
            return Domain(BP224t1())
        case .BP256r1:
            return Domain(BP256r1())
        case .BP256t1:
            return Domain(BP256t1())
        case .BP320r1:
            return Domain(BP320r1())
        case .BP320t1:
            return Domain(BP320t1())
        case .BP384r1:
            return Domain(BP384r1())
        case .BP384t1:
            return Domain(BP384t1())
        case .BP512r1:
            return Domain(BP512r1())
        case .BP512t1:
            return Domain(BP512t1())
        case .EC163k1:
            return Domain(EC163k1())
        case .EC163r2:
            return Domain(EC163r2())
        case .EC192k1:
            return Domain(EC192k1())
        case .EC192r1:
            return Domain(EC192r1())
        case .EC224k1:
            return Domain(EC224k1())
        case .EC224r1:
            return Domain(EC224r1())
        case .EC233k1:
            return Domain(EC233k1())
        case .EC233r1:
            return Domain(EC233r1())
        case .EC256k1:
            return Domain(EC256k1())
        case .EC256r1:
            return Domain(EC256r1())
        case .EC283k1:
            return Domain(EC283k1())
        case .EC283r1:
            return Domain(EC283r1())
        case .EC384r1:
            return Domain(EC384r1())
        case .EC409k1:
            return Domain(EC409k1())
        case .EC409r1:
            return Domain(EC409r1())
        case .EC521r1:
            return Domain(EC521r1())
        case .EC571k1:
            return Domain(EC571k1())
        case .EC571r1:
            return Domain(EC571r1())
        }
    }

    /// Returns a predefined domain from its OID
    ///
    /// - Parameters:
    ///   - oid: The domain OID
    /// - Returns: The corresponding domain
    /// - Throws: An *unknownOid* exception if *oid* does not match any domain
    public static func instance(oid: ASN1ObjectIdentifier) throws -> Domain {
        if oid == BP160r1.oid {
            return Domain(BP160r1())
        } else if oid == BP160t1.oid {
            return Domain(BP160t1())
        } else if oid == BP192r1.oid {
            return Domain(BP192r1())
        } else if oid == BP192t1.oid {
            return Domain(BP192t1())
        } else if oid == BP224r1.oid {
            return Domain(BP224r1())
        } else if oid == BP224t1.oid {
            return Domain(BP224t1())
        } else if oid == BP256r1.oid {
            return Domain(BP256r1())
        } else if oid == BP256t1.oid {
            return Domain(BP256t1())
        } else if oid == BP320r1.oid {
            return Domain(BP320r1())
        } else if oid == BP320t1.oid {
            return Domain(BP320t1())
        } else if oid == BP384r1.oid {
            return Domain(BP384r1())
        } else if oid == BP384t1.oid {
            return Domain(BP384t1())
        } else if oid == BP512r1.oid {
            return Domain(BP512r1())
        } else if oid == BP512t1.oid {
            return Domain(BP512t1())
        } else if oid == EC163k1.oid {
            return Domain(EC163k1())
        } else if oid == EC163r2.oid {
            return Domain(EC163r2())
        } else if oid == EC192k1.oid {
            return Domain(EC192k1())
        } else if oid == EC192r1.oid {
            return Domain(EC192r1())
        } else if oid == EC224k1.oid {
            return Domain(EC224k1())
        } else if oid == EC224r1.oid {
            return Domain(EC224r1())
        } else if oid == EC233k1.oid {
            return Domain(EC233k1())
        } else if oid == EC233r1.oid {
            return Domain(EC233r1())
        } else if oid == EC256k1.oid {
            return Domain(EC256k1())
        } else if oid == EC256r1.oid {
            return Domain(EC256r1())
        } else if oid == EC283k1.oid {
            return Domain(EC283k1())
        } else if oid == EC283r1.oid {
            return Domain(EC283r1())
        } else if oid == EC384r1.oid {
            return Domain(EC384r1())
        } else if oid == EC409k1.oid {
            return Domain(EC409k1())
        } else if oid == EC409r1.oid {
            return Domain(EC409r1())
        } else if oid == EC521r1.oid {
            return Domain(EC521r1())
        } else if oid == EC571k1.oid {
            return Domain(EC571k1())
        } else if oid == EC571r1.oid {
            return Domain(EC571r1())
        }
        throw ECException.unknownOid
    }

    /// Constructs a domain from its PEM encoding
    ///
    /// - Parameters:
    ///   - pem: The PEM encoding of the domain
    /// - Returns: The corresponding domain
    /// - Throws: An exception if the PEM contents is wrong
    public static func instance(pem: String) throws -> Domain {
        return try Domain.domainFromASN1(ASN1.build(Base64.pemDecode(pem, "EC PARAMETERS")))
    }

    /// Constructs an odd prime characteristic domain
    /// based on the curve   y^2 = x^3 + a * x + b
    ///
    /// - Parameters:
    ///   - name: The domain name
    ///   - p: The field order - a prime greater then 3
    ///   - a: The a coefficient
    ///   - b: The b coefficient
    ///   - gx: The generator point x-coordinate
    ///   - gy: The generator point y-coordinate
    ///   - order: The curve order
    ///   - cofactor: The cofactor
    ///   - oid: An optional domain OID
    /// - Returns: The domain
    /// - Throws: A *domainParameter* exception if 4 * a^3 + 27 * b^2 = 0 or the generator point is not on the curve
    public static func instance(name: String, p: BInt, a: BInt, b: BInt, gx: BInt, gy: BInt, order: BInt, cofactor: Int, oid: ASN1ObjectIdentifier? = nil) throws -> Domain {
        if (4 * a * a * a + 27 * b * b) % p == BInt.ZERO {
            throw ECException.domainParameter
        }
        let domain = Domain(DomainP(name, p, a, b, gx, gy, order, cofactor, oid))
        if !domain.contains(domain.g) {
            throw ECException.domainParameter
        }
        return domain
    }

    /// Constructs a characteristic 2 domain
    /// based on the curve   y^2 + x * y = x^3 + a * x^2 + b
    ///
    /// - Parameters:
    ///   - name: The domain name
    ///   - rp: The reduction polynomial
    ///   - a: The a coefficient
    ///   - b: The b coefficient
    ///   - gx: The generator point x-coordinate
    ///   - gy: The generator point y-coordinate
    ///   - order: The curve order
    ///   - cofactor: The cofactor
    ///   - oid: An optional domain OID
    /// - Returns: The domain
    /// - Throws: A *domainParameter* exception if b = 0 or the generator point is not on the curve
    public static func instance(name: String, rp: RP, a: BInt, b: BInt, gx: BInt, gy: BInt, order: BInt, cofactor: Int, oid: ASN1ObjectIdentifier? = nil) throws -> Domain {
        if b.isZero {
            throw ECException.domainParameter
        }
        let domain = Domain(Domain2(name, rp, a, b, gx, gy, order, cofactor, oid))
        if !domain.contains(domain.g) {
            throw ECException.domainParameter
        }
        return domain
    }


    // MARK: Stored Properties

    /// The domain name
    public let name: String
    /// The modulus
    public let p: BInt
    /// The curve *a* coefficient
    public let a: BInt
    /// The curve *b* coefficient
    public let b: BInt
    /// The generator point
    public let g: Point
    /// The curve order
    public let order: BInt
    /// The cofactor
    public let cofactor: Int
    /// An optional domain OID
    public let oid: ASN1ObjectIdentifier?
    /// Is *true* if *self* has characteristic 2, *false* if it has an odd prime characteristic
    public let characteristic2: Bool

    let domainP: DomainP?
    let domain2: Domain2?


    // MARK: Computed Properties

    /// The ASN1 encoding of *self*
    public var asn1: ASN1 { get { return self.characteristic2 ? self.domain2!.asn1(false) : self.domainP!.asn1(false) } }
    /// The PEM encoding of *self*
    public var pem: String { get { return Base64.pemEncode(self.asn1.encode(), "EC PARAMETERS") } }
    /// A textual representation of the ASN1 encoding of *self*
    public var description: String { get { return self.asn1.description } }


    // MARK: Instance Methods

    /// Generates a private- and public key pair for *self*
    ///
    /// - Returns: (ECPublicKey, ECPrivateKey)
    public func makeKeyPair() -> (ECPublicKey, ECPrivateKey) {
        let s = (self.order - BInt.ONE).randomLessThan() + BInt.ONE
        do {
            return try (ECPublicKey(domain: self, w: self.multiplyG(s)), ECPrivateKey(domain: self, s: s))
        } catch {
            fatalError("'makeKeyPair' inconsistency")
        }
    }

    /// Equality of two Domain instances
    ///
    /// - Parameters:
    ///   - d1: a Domain instance
    ///   - d2: a Domain instance
    /// - Returns: *true* if d1 and d2 are equal, *false* otherwise
    public static func == (d1: Domain, d2: Domain) -> Bool {
        if d1.characteristic2 != d2.characteristic2 {
            return false
        }
        return d1.p == d2.p && d1.a == d2.a && d1.b == d2.b && d1.g == d2.g && d1.order == d2.order && d1.cofactor == d2.cofactor
    }

    /// Doubles a curve Point
    ///
    /// - Parameters:
    ///   - p: A curve point
    /// - Returns: p + p
    /// - Throws: A *notOnCurve* exception if *p* is not on the curve
    public func doublePoint(_ p: Point) throws -> Point {
        guard self.contains(p) else {
            throw ECException.notOnCurve
        }
        return self.characteristic2 ? self.domain2!.double(Point2.fromPoint(domain2!.rp, p)).toPoint() : self.domainP!.double(p)
    }

    /// Adds two curve Points
    ///
    /// - Parameters:
    ///   - p1: The first curve point
    ///   - p2: The second curve point
    /// - Returns: p1 + p2
    /// - Throws: A *notOnCurve* exception if *p1* or *p2* is not on the curve
    public func addPoints(_ p1: Point, _ p2: Point) throws -> Point {
        guard self.contains(p1) && self.contains(p2) else {
            throw ECException.notOnCurve
        }
        return self.characteristic2 ? self.domain2!.add(Point2.fromPoint(domain2!.rp, p1), Point2.fromPoint(domain2!.rp, p2)).toPoint() : self.domainP!.add(p1, p2)
    }

    /// Subtracts two curve Points
    ///
    /// - Parameters:
    ///   - p1: The first curve point
    ///   - p2: The second curve point
    /// - Returns: p1 - p2
    /// - Throws: A *notOnCurve* exception if *p1* or *p2* is not on the curve
    public func subtractPoints(_ p1: Point, _ p2: Point) throws -> Point {
        guard self.contains(p1) && self.contains(p2) else {
            throw ECException.notOnCurve
        }
        return self.characteristic2 ? self.domain2!.subtract(Point2.fromPoint(domain2!.rp, p1), Point2.fromPoint(domain2!.rp, p2)).toPoint() : self.domainP!.subtract(p1, p2)
    }

    /// Negates a curve Point
    ///
    /// - Parameters:
    ///   - p: A curve point
    /// - Returns: -p
    /// - Throws: A *notOnCurve* exception if *p* is not on the curve
    public func negatePoint(_ p: Point) throws -> Point {
        guard self.contains(p) else {
            throw ECException.notOnCurve
        }
        return self.characteristic2 ? self.domain2!.negate(Point2.fromPoint(domain2!.rp, p)).toPoint() : self.domainP!.negate(p)
    }

    /// Multiplies a curve Point by an integer
    ///
    /// - Parameters:
    ///   - p: The curve point to multiply
    ///   - n: The integer to multiply with
    /// - Returns: n * p
    /// - Throws: A *notOnCurve* exception if *p* is not on the curve
    public func multiplyPoint(_ p: Point, _ n: BInt) throws -> Point {
        guard self.contains(p) else {
            throw ECException.notOnCurve
        }
        let multiplier = n.mod(self.order)
        return self.characteristic2 ? self.domain2!.multiply(Point2.fromPoint(domain2!.rp, p), multiplier).toPoint() : self.domainP!.multiply(p, multiplier)
    }

    /// Tests if point is on curve
    ///
    /// - Parameters:
    ///   - p: The point
    /// - Returns: *true* iff p is on the domain curve
    public func contains(_ p: Point) -> Bool {
        return self.characteristic2 ? self.domain2!.contains(Point2.fromPoint(domain2!.rp, p)) : self.domainP!.contains(p)
    }

    /// Encodes a Point to a byte array - please refer [SEC 1] section 2.3.3
    ///
    /// - Parameters:
    ///   - p: The point to encode
    ///   - compress: If *true* use compressed encoding, if *false* use uncompressed encoding - *false* is default
    /// - Returns: Encoding of p
    /// - Throws: An *encodePoint* exception if *p* is not on the curve
    public func encodePoint(_ p: Point, _ compress: Bool = false) throws -> Bytes {
        if !self.contains(p) {
            throw ECException.encodePoint
        }
        return self.characteristic2 ? self.domain2!.encodePoint(p, compress) : self.domainP!.encodePoint(p, compress)
    }

    /// Decodes a Point from a byte array - please refer [SEC 1] section 2.3.4
    ///
    /// - Parameters:
    ///   - bytes: The byte array to decode
    ///   - Returns: The point
    /// - Throws: An *decodePoint* exception if *bytes* contains invalid data
    public func decodePoint(_ bytes: Bytes) throws -> Point {
        let p = try self.characteristic2 ? self.domain2!.decodePoint(bytes) : self.domainP!.decodePoint(bytes)
        if !self.contains(p) {
            throw ECException.decodePoint
        }
        return p
    }

    /// Encodes a Point to an ASN1 structure
    ///
    /// - Parameters:
    ///   - p: The point to encode
    ///   - compress: If *true* use compressed encoding, if *false* use uncompressed encoding - *false* is default
    /// - Returns: ASN1 encoding of p
    /// - Throws: An *encodePoint* exception if *p* does not lie on the curve
    public func asn1EncodePoint(_ p: Point, _ compress: Bool = false) throws -> ASN1 {
        return try ASN1OctetString(encodePoint(p, compress))
    }

    /// Decodes a Point from an ASN1 octet string
    ///
    /// - Parameters:
    ///   - asn1: The ASN1 octet string to decode
    /// - Returns: The point
    /// - Throws: An *decodePoint* exception if the octet string contains invalid data
    public func asn1DecodePoint(_ asn1: ASN1OctetString) throws -> Point {
        return try decodePoint(asn1.value)
    }

    /// Decodes a Point from an ASN1 bit string
    ///
    /// - Parameters:
    ///   - asn1: The ASN1 bit string to decode
    /// - Returns: The point
    /// - Throws: An *decodePoint* exception if the bit string contains invalid data
    public func asn1DecodePoint(_ asn1: ASN1BitString) throws -> Point {
        if asn1.unused > 0 {
            throw ECException.decodePoint
        }
        return try decodePoint(asn1.bits)
    }

    /// Explicit ASN1 encoding of *self* - please refer [SEC 1] appendix C.2<br/>
    /// All domain components are included in the encoding - not just the domain OID
    ///
    /// - Returns: Explicit ASN1 encoding of *self*
    public func asn1Explicit() -> ASN1 {
        return self.characteristic2 ? self.domain2!.asn1(true) : self.domainP!.asn1(true)
    }

    // Multiply the generator point by n
    func multiplyG(_ n: BInt) -> Point {
        return self.characteristic2 ? self.domain2!.multiplyG(n) : self.domainP!.multiplyG(n)
    }

    func align(_ b: Bytes) -> Bytes {
        var bb = b
        while bb.count < (self.p.bitWidth + 7) / 8 {
            bb.insert(0, at: 0)
        }
        return bb
    }

    static func fieldFromASN1(_ seq: ASN1Sequence, _ fp: inout BInt, _ m: inout Int, _ k3: inout Int, _ k2: inout Int, _ k1: inout Int, _ characteristic2: inout Bool) throws {
        guard let oid = seq.get(0) as? ASN1ObjectIdentifier else {
            throw ECException.asn1Structure
        }
        if oid == Domain.OID_P {
            characteristic2 = false
            guard let p = seq.get(1) as? ASN1Integer else {
                throw ECException.asn1Structure
            }
            fp = p.value
        } else if oid == Domain.OID_2 {
            characteristic2 = true
            let seq1 = seq.get(1) as! ASN1Sequence
            if seq1.getValue().count < 2 {
                throw ECException.asn1Structure
            }
            guard let p = seq1.get(0) as? ASN1Integer else {
                throw ECException.asn1Structure
            }
            m = p.value.asInt()!
            if let x = seq1.get(1) as? ASN1Integer {
                k1 = x.value.asInt()!
                if !(k1 > 0 && k1 < m) {
                    throw ECException.asn1Structure
                }
            } else {
                guard let seq2 = seq1.get(1) as? ASN1Sequence else {
                    throw ECException.asn1Structure
                }
                if seq2.getValue().count != 3 {
                    throw ECException.asn1Structure
                }
                guard let x1 = seq2.get(0) as? ASN1Integer else {
                    throw ECException.asn1Structure
                }
                guard let x2 = seq2.get(1) as? ASN1Integer else {
                    throw ECException.asn1Structure
                }
                guard let x3 = seq2.get(2) as? ASN1Integer else {
                    throw ECException.asn1Structure
                }
                k1 = x1.value.asInt()!
                k2 = x2.value.asInt()!
                k3 = x3.value.asInt()!
                if !(k1 > 0 && k1 < m) {
                    throw ECException.asn1Structure
                }
                if !(k2 > k1 && k2 < m) {
                    throw ECException.asn1Structure
                }
                if !(k3 > k2 && k3 < m) {
                    throw ECException.asn1Structure
                }
            }
        } else {
            throw ECException.asn1Structure
        }
    }

    static func domainFromASN1(_ asn1: ASN1) throws -> Domain {
        if let oid = asn1 as? ASN1ObjectIdentifier {
            return try Domain.instance(oid: oid)
        }
        guard let seq = asn1 as? ASN1Sequence else {
            throw ECException.asn1Structure
        }
        if seq.getValue().count < 6 {
            throw ECException.asn1Structure
        }
        guard let i0 = seq.get(0) as? ASN1Integer else {
            throw ECException.asn1Structure
        }
        if !i0.value.isOne {
            throw ECException.asn1Structure
        }
        guard let seq1 = seq.get(1) as? ASN1Sequence else {
            throw ECException.asn1Structure
        }
        if seq1.getValue().count < 2 {
            throw ECException.asn1Structure
        }
        guard let seq2 = seq.get(2) as? ASN1Sequence else {
            throw ECException.asn1Structure
        }
        if seq2.getValue().count < 2 {
            throw ECException.asn1Structure
        }
        guard let aa = seq2.get(0) as? ASN1OctetString else {
            throw ECException.asn1Structure
        }
        guard let bb = seq2.get(1) as? ASN1OctetString else {
            throw ECException.asn1Structure
        }
        let a = BInt(magnitude: aa.value)
        let b = BInt(magnitude: bb.value)
        guard let g = seq.get(3) as? ASN1OctetString else {
            throw ECException.asn1Structure
        }
        if g.value.count & 0x1 == 0 || g.value[0] != 4 {
            throw ECException.asn1Structure
        }
        let l = (g.value.count - 1) / 2
        let gx = BInt(magnitude: Bytes(g.value[1 ..< l + 1]))
        let gy = BInt(magnitude: Bytes(g.value[l + 1 ..< g.value.count]))
        guard let ord = seq.get(4) as? ASN1Integer else {
            throw ECException.asn1Structure
        }
        let order = ord.value
        guard let co = seq.get(5) as? ASN1Integer else {
            throw ECException.asn1Structure
        }
        if !co.value.isPositive {
            throw ECException.asn1Structure
        }
        let cofactor = co.value.asInt()!
        var fp = BInt.ZERO
        var m = 0
        var k3 = 0
        var k2 = 0
        var k1 = 0
        var characteristic2 = false
        try fieldFromASN1(seq1, &fp, &m, &k3, &k2, &k1, &characteristic2)
        return characteristic2 ?
            try Domain.instance(name: "", rp: RP(m, k3, k2, k1), a: a, b: b, gx: gx, gy: gy, order: order, cofactor: cofactor) :
            try Domain.instance(name: "", p: fp, a: a, b: b, gx: gx, gy: gy, order: order, cofactor: cofactor)
    }

}
