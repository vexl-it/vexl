//
//  Exception.swift
//  SwiftECC
//
//  Created by Leif Ibsen on 18/02/2020.
//

///
/// Elliptic curve exceptions
///
public enum ECException: Error, CustomStringConvertible {
    
    /// Textual description of *self*
    public var description: String {
        switch self {
        case .authentication:
            return "Authentication failed"
        case .asn1Structure:
            return "ASN1 has wrong structure"
        case .pemStructure:
            return "PEM structure is wrong"
        case .base64:
            return "Base64 decoding exception"
        case .encodePoint:
            return "Point encode exception"
        case .decodePoint:
            return "Point decode exception"
        case .domainParameter:
            return "Domain parameter exception"
        case .publicKeyParameter:
            return "Invalid public key parameter"
        case .privateKeyParameter:
            return "Invalid private key parameter"
        case .notEnoughInput:
            return "Not enough input to decrypt"
        case .padding:
            return "Padding is wrong"
        case .unknownOid:
            return "Unknown domain OID"
        case .notOnCurve:
            return "Point not on curve"
        case .keyAgreementParameter:
            return "Invalid key agreement parameter"
        }
    }
    
    /// ASN1 has wrong structure
    case asn1Structure

    /// Authentication failed
    case authentication
    
    /// Base64 decoding exception
    case base64

    /// Invalid input to point decoding
    case decodePoint

    /// Either 4 * a^3 + 27 * b^2 = 0 when creating a prime domain or b = 0 when creating a characteristic 2 domain
    case domainParameter

    /// Point to encode does not lie on the domain curve
    case encodePoint

    /// Invalid key agreement parameter
    case keyAgreementParameter

    /// Not enough input to decrypt
    case notEnoughInput

    /// Padding is wrong
    case padding
    
    /// PEM structure is wrong
    case pemStructure

    /// Invalid parameter to ECPrivateKey constructor
    case privateKeyParameter
    
    /// Invalid parameter to ECPublicKey constructor
    case publicKeyParameter

    /// Unknown domain OID
    case unknownOid
    
    /// Point not on curve
    case notOnCurve

}
