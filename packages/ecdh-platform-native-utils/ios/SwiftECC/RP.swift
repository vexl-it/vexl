//
//  RP.swift
//  AEC
//
//  Created by Leif Ibsen on 26/10/2019.
//



///
/// RP instances contain reduction polynomials like
/// x^m + x^k3 + x^k2 + x^k1 + 1 where m > k3 > k2 > k1 > 0
/// or x^m + x^k1 + 1 where m > k1 > 0
///
public struct RP: CustomStringConvertible, Equatable {


    // MARK: Initializers

    /// Creates a reduction polynomial x^m + x^k3 + x^k2 + x^k1 + 1
    ///
    /// - Parameters:
    ///   - m: The m exponent
    ///   - k3: The k3 exponent
    ///   - k2: The k2 exponent
    ///   - k1: The k1 exponent
    public init(_ m: Int, _ k3: Int, _ k2: Int, _ k1: Int) {
        self.m = m
        self.k3 = k3
        self.k2 = k2
        self.k1 = k1
        self.p = (BInt.ONE << m) | (BInt.ONE << k3) | (BInt.ONE << k2) | (BInt.ONE << k1) | BInt.ONE
        self.t = (self.m + 63) / 64
        self.mask = Limb((1 << (self.m % 64)) - 1)
    }

    /// Creates a reduction polynomial x^m + x^k1 + 1
    ///
    /// - Parameters:
    ///   - m: The m exponent
    ///   - k1: The k3 exponent
    public init(_ m: Int, _ k1: Int) {
        self.init(m, 0, 0, k1)
    }


    // MARK: Stored Properties

    /// The *m* exponent
    public let m: Int
    /// The *k3* exponent
    public let k3: Int
    /// The *k2* exponent
    public let k2: Int
    /// The *k1* exponent
    public let k1: Int
    /// The reduction polynomial as a BInt
    public let p: BInt

    let t: Int
    let mask: Limb


    // MARK: Computed Properties

    /// Textual description of *self*
    public var description: String { get { return "x^" + self.m.description
        + (self.k1 == 0 ? "" : "+x^" + self.k1.description)
        + (self.k2 == 0 ? "" : "+x^" + self.k2.description)
        + (self.k3 == 0 ? "" : "+x^" + self.k3.description)
        + "+1" } }


    // MARK: Instance Methods

    /// Tests equality of reduction polynomials
    ///
    /// - Parameters:
    ///   - rp1: First reduction polynomial
    ///   - rp2: Second reduction polynomial
    /// - Returns: *true* iff rp1 = rp2
    public static func == (rp1: RP, rp2: RP) -> Bool {
        return rp1.m == rp2.m && rp1.k3 == rp2.k3 && rp1.k2 == rp2.k2 && rp1.k1 == rp2.k1
    }

}
