//
//  Curve.swift
//  SwiftECC
//
//  Created by Leif Ibsen on 18/02/2020.
//

///
/// Built-in elliptic curves
///
public enum ECCurve: CaseIterable {
    /// brainpoolP160r1 curve
    case BP160r1
    /// brainpoolP160t1 curve
    case BP160t1
    /// brainpoolP192r1 curve
    case BP192r1
    /// brainpoolP192t1 curve
    case BP192t1
    /// brainpoolP224r1 curve
    case BP224r1
    /// brainpoolP224t1 curve
    case BP224t1
    /// brainpoolP256r1 curve
    case BP256r1
    /// brainpoolP256t1 curve
    case BP256t1
    /// brainpoolP320r1 curve
    case BP320r1
    /// brainpoolP320t1 curve
    case BP320t1
    /// brainpoolP384r1 curve
    case BP384r1
    /// brainpoolP384t1 curve
    case BP384t1
    /// brainpoolP512r1 curve
    case BP512r1
    /// brainpoolP512t1 curve
    case BP512t1
    /// NIST sect163k1 curve
    case EC163k1
    /// NIST sect163r2 curve
    case EC163r2
    /// NIST sect192k1 curve
    case EC192k1
    /// NIST sect192r1 curve
    case EC192r1
    /// NIST sect224k1 curve
    case EC224k1
    /// NIST sect224r1 curve
    case EC224r1
    /// NIST sect233k1 curve
    case EC233k1
    /// NIST sect233r1 curve
    case EC233r1
    /// NIST sect256k1 curve
    case EC256k1
    /// NIST sect256r1 curve
    case EC256r1
    /// NIST sect283k1 curve
    case EC283k1
    /// NIST sect283r1 curve
    case EC283r1
    /// NIST sect384r1 curve
    case EC384r1
    /// NIST sect409k1 curve
    case EC409k1
    /// NIST sect409r1 curve
    case EC409r1
    /// NIST sect521r1 curve
    case EC521r1
    /// NIST sect571k1 curve
    case EC571k1
    /// NIST sect571r1 curve
    case EC571r1
}
