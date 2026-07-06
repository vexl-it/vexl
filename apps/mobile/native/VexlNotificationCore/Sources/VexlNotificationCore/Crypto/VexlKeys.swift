import Foundation

/// Errors thrown while decoding Vexl key material. Every error is a "bail to
/// generic notification content" signal for the NSE.
public enum VexlKeyError: Error, Equatable {
  case invalidPemBase64
  case invalidPem
  case invalidDer
  /// The key is on a curve other than secp256k1 (e.g. legacy secp224r1).
  case unsupportedCurve
  case invalidScalar
  /// Only uncompressed SEC1 points are supported (parity with the TS parser).
  case invalidPoint
}

/// Minimal DER (TLV) reader - just enough to parse the PKCS#8 / SEC1 / SPKI
/// structures produced by packages/cryptography (see keyUtils.ts /
/// ECConverter). Not a general-purpose ASN.1 implementation.
struct DerReader {
  private let bytes: [UInt8]
  private(set) var offset: Int

  init(_ bytes: [UInt8], offset: Int = 0) {
    self.bytes = bytes
    self.offset = offset
  }

  var isAtEnd: Bool { offset >= bytes.count }

  mutating func readElement() throws -> (tag: UInt8, content: [UInt8]) {
    guard offset + 2 <= bytes.count else { throw VexlKeyError.invalidDer }
    let tag = bytes[offset]
    offset += 1

    var length = Int(bytes[offset])
    offset += 1
    if length & 0x80 != 0 {
      let lengthBytes = length & 0x7F
      guard lengthBytes > 0, lengthBytes <= 4, offset + lengthBytes <= bytes.count else {
        throw VexlKeyError.invalidDer
      }
      length = 0
      for _ in 0 ..< lengthBytes {
        length = (length << 8) | Int(bytes[offset])
        offset += 1
      }
    }

    guard length >= 0, offset + length <= bytes.count else { throw VexlKeyError.invalidDer }
    let content = Array(bytes[offset ..< offset + length])
    offset += length
    return (tag, content)
  }

  mutating func readExpecting(tag expectedTag: UInt8) throws -> [UInt8] {
    let (tag, content) = try readElement()
    guard tag == expectedTag else { throw VexlKeyError.invalidDer }
    return content
  }
}

enum DerTag {
  static let integer: UInt8 = 0x02
  static let bitString: UInt8 = 0x03
  static let octetString: UInt8 = 0x04
  static let objectIdentifier: UInt8 = 0x06
  static let sequence: UInt8 = 0x30
  static let contextSpecific0: UInt8 = 0xA0
  static let contextSpecific1: UInt8 = 0xA1
}

enum CurveOid {
  /// 1.3.132.0.10
  static let secp256k1: [UInt8] = [0x2B, 0x81, 0x04, 0x00, 0x0A]
  /// 1.2.840.10045.2.1 (id-ecPublicKey)
  static let idEcPublicKey: [UInt8] = [0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01]
}

/// A parsed secp256k1 private key from the Vexl `privateKeyPemBase64` encoding
/// (standard base64 of the full ASCII PEM text of a PKCS#8 or SEC1 EC key).
public struct VexlPrivateKey: Equatable, Sendable {
  /// 32-byte big-endian scalar (left-padded; the TS encoder strips leading
  /// zero bytes so the DER OCTET STRING may be shorter than 32 bytes).
  public let rawScalar: Data

  public init(pemBase64: String) throws {
    let der = try pemBase64ToDer(
      pemBase64,
      allowedLabels: ["PRIVATE KEY", "EC PRIVATE KEY"]
    )

    var outer = DerReader(der)
    var sequence = try DerReader(outer.readExpecting(tag: DerTag.sequence))

    let version = try sequence.readExpecting(tag: DerTag.integer)

    let ecPrivateKeyBody: DerReader
    if version == [0x00] {
      // PKCS#8: SEQUENCE { INTEGER 0, AlgorithmIdentifier, OCTET STRING { ECPrivateKey } }
      var algorithm = try DerReader(sequence.readExpecting(tag: DerTag.sequence))
      let algorithmOid = try algorithm.readExpecting(tag: DerTag.objectIdentifier)
      guard algorithmOid == CurveOid.idEcPublicKey else { throw VexlKeyError.invalidDer }
      let curveOid = try algorithm.readExpecting(tag: DerTag.objectIdentifier)
      guard curveOid == CurveOid.secp256k1 else { throw VexlKeyError.unsupportedCurve }

      let inner = try sequence.readExpecting(tag: DerTag.octetString)
      var innerReader = DerReader(inner)
      var ecPrivateKey = try DerReader(innerReader.readExpecting(tag: DerTag.sequence))
      guard try ecPrivateKey.readExpecting(tag: DerTag.integer) == [0x01] else {
        throw VexlKeyError.invalidDer
      }
      ecPrivateKeyBody = ecPrivateKey
    } else if version == [0x01] {
      // Plain SEC1 (RFC 5915) "EC PRIVATE KEY": the outer sequence IS the
      // ECPrivateKey; curve OID sits in the [0] tagged parameters.
      ecPrivateKeyBody = sequence
    } else {
      throw VexlKeyError.invalidDer
    }

    var reader = ecPrivateKeyBody
    let scalarBytes = try reader.readExpecting(tag: DerTag.octetString)

    // Optional [0] parameters (curve OID; present in SEC1 form)
    var readerCopy = reader
    if !readerCopy.isAtEnd {
      let (tag, content) = try readerCopy.readElement()
      if tag == DerTag.contextSpecific0 {
        var params = DerReader(content)
        let curveOid = try params.readExpecting(tag: DerTag.objectIdentifier)
        guard curveOid == CurveOid.secp256k1 else { throw VexlKeyError.unsupportedCurve }
      }
    }

    // Left-pad the scalar to 32 bytes (TS encoder strips leading zeros) and
    // reject anything that cannot be a 32-byte scalar.
    var scalar = scalarBytes
    while scalar.count > 32, scalar.first == 0x00 {
      scalar.removeFirst()
    }
    guard scalar.count <= 32, !scalar.isEmpty else { throw VexlKeyError.invalidScalar }
    self.rawScalar = Data(repeating: 0, count: 32 - scalar.count) + Data(scalar)
  }
}

/// A parsed secp256k1 public key from the Vexl `publicKeyPemBase64` encoding
/// (standard base64 of the full ASCII PEM text of an SPKI "PUBLIC KEY").
public struct VexlPublicKey: Equatable, Sendable {
  /// Uncompressed SEC1 point: 0x04 || X(32) || Y(32), 65 bytes.
  public let uncompressedPoint: Data

  public init(pemBase64: String) throws {
    let der = try pemBase64ToDer(pemBase64, allowedLabels: ["PUBLIC KEY"])

    var outer = DerReader(der)
    var sequence = try DerReader(outer.readExpecting(tag: DerTag.sequence))
    var algorithm = try DerReader(sequence.readExpecting(tag: DerTag.sequence))
    let algorithmOid = try algorithm.readExpecting(tag: DerTag.objectIdentifier)
    guard algorithmOid == CurveOid.idEcPublicKey else { throw VexlKeyError.invalidDer }
    let curveOid = try algorithm.readExpecting(tag: DerTag.objectIdentifier)
    guard curveOid == CurveOid.secp256k1 else { throw VexlKeyError.unsupportedCurve }

    let bitString = try sequence.readExpecting(tag: DerTag.bitString)
    // First byte of a BIT STRING is the number of unused bits; must be 0 here.
    guard bitString.first == 0x00 else { throw VexlKeyError.invalidDer }
    let point = Array(bitString.dropFirst())
    guard point.count == 65, point.first == 0x04 else { throw VexlKeyError.invalidPoint }
    self.uncompressedPoint = Data(point)
  }
}

private func pemBase64ToDer(
  _ pemBase64: String,
  allowedLabels: [String]
) throws -> [UInt8] {
  guard let pemData = Data(base64Encoded: pemBase64),
        let pemText = String(data: pemData, encoding: .utf8)
  else {
    throw VexlKeyError.invalidPemBase64
  }

  for label in allowedLabels {
    let begin = "-----BEGIN \(label)-----"
    let end = "-----END \(label)-----"
    guard let beginRange = pemText.range(of: begin),
          let endRange = pemText.range(of: end),
          beginRange.upperBound <= endRange.lowerBound
    else { continue }

    let body = pemText[beginRange.upperBound ..< endRange.lowerBound]
      .components(separatedBy: .whitespacesAndNewlines)
      .joined()
    guard let der = Data(base64Encoded: body) else { throw VexlKeyError.invalidPem }
    return Array(der)
  }

  throw VexlKeyError.invalidPem
}
