//
//  CRT.swift
//  BigIntTest
//
//  Created by Leif Ibsen on 25/04/2023.
//

/// CRT instances implement the Chinese Remainder Theorem
///
/// Create an instance from a given set of moduli which fullfill the following conditions:
/// - at least two moduli
/// - all moduli are positive
/// - the moduli are pairwise coprime
///
/// Then use the *compute* method to compute the CRT value for a given set of residues.
/// The same CRT instance can be used for different inputs, as long as the moduli are the same.
public struct CRT {

    static func uc(_ m: [BInt]) -> ([BInt], [BInt]) {
        var u = [BInt](repeating: BInt.ZERO, count: m.count)
        var c = [BInt](repeating: BInt.ZERO, count: m.count)
        for i in 1 ..< m.count {
            u[i] = BInt.ONE
            for j in 0 ..< i {
                u[i] *= m[j]
            }
            c[i] = u[i].modInverse(m[i])
        }
        return (u, c)
    }

    let m: [BInt]
    let u: [BInt]
    let c: [BInt]
    let M: BInt

    // MARK: - Initializers

    /// Constructs a CRT instance from the moduli - BInt version
    ///
    /// - Parameters:
    ///   - m: The moduli
    /// - Returns: The CRT instance for the moduli, *nil* if they do not fullfill the conditions
    public init?(_ m: [BInt]) {
        guard m.count > 1 else {
            return nil
        }
        for i in 0 ..< m.count - 1 {
            guard m[i] > BInt.ZERO else {
                return nil
            }
            for j in i + 1 ..< m.count {
                guard m[i].gcd(m[j]).isOne else {
                    return nil
                }
            }
        }
        self.m = m
        (self.u, self.c) = CRT.uc(m)
        self.M = self.u[self.u.count - 1] * self.m[self.m.count - 1]
    }
    
    /// Constructs a CRT instance from the moduli - Int version
    ///
    /// - Parameters:
    ///   - m: The moduli
    /// - Returns: The CRT instance for the moduli, *nil* if they do not fullfill the conditions
    public init?(_ m: [Int]) {
        var x = [BInt](repeating: BInt.ZERO, count: m.count)
        for i in 0 ..< m.count {
            x[i] = BInt(m[i])
        }
        self.init(x)
    }
    
    
    // MARK: - Instance methods
    
    /// Compute the CRT value - BInt version
    ///
    /// - Precondition: r.count = number of moduli
    /// - Parameters:
    ///   - r: The residues
    /// - Returns: The CRT value
    public func compute(_ r: [BInt]) -> BInt {
        precondition(r.count == self.m.count, "CRT wrong count")
        var x = r[0]
        for i in 1 ..< self.m.count {
            let uu = ((r[i] - x) * self.c[i]).mod(self.m[i])
            x += uu * self.u[i]
        }
        return x.mod(self.M)
    }
    
    /// Compute the CRT value - Int version
    ///
    /// - Precondition: r.count = number of moduli
    /// - Parameters:
    ///   - r: The residues
    /// - Returns: The CRT value
    public func compute(_ r: [Int]) -> BInt {
        var x = [BInt](repeating: BInt.ZERO, count: r.count)
        for i in 0 ..< x.count {
            x[i] = BInt(r[i])
        }
        return compute(x)
    }
    
}
