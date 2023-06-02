//
//  Base64.swift
//  AEC
//
//  Created by Leif Ibsen on 06/01/2020.
//

///
/// There is no Base64 instances.
/// Base64 exists to provide a namespace. It contains static functions for Base64 encoding and decoding.
///
public struct Base64 {

    static let base64chars = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P",
                        "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f",
                        "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v",
                        "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"]

    private init() {
        // Not meant to be instantiated
    }


    // MARK: Static Methods

    /// PEM encodes a byte array
    ///
    /// - Parameters:
    ///   - input: Bytes to encode
    ///   - pem: The PEM header- and footer string
    /// - Returns: The Base64 PEM encoding of *input*
    public static func pemEncode(_ input: Bytes, _ pem: String) -> String {
        return "-----BEGIN " + pem + "-----\n" + encode(input, 64) + "\n-----END " + pem + "-----"
    }

    /// PEM decodes a string
    ///
    /// - Parameters:
    ///   - input: String to decode
    ///   - pem: The expected PEM header- and footer string
    /// - Returns: The Base64 PEM decoding of *input*
    /// - Throws: A *base64* exception or a *pemStructure* exception if the input is malformed
    public static func pemDecode(_ input: String, _ pem: String) throws -> Bytes {
        let parts = input.components(separatedBy: "-----")
        if parts.count != 5 {
            throw ECException.pemStructure
        }
        if parts[1] != "BEGIN " + pem || parts[3] != "END " + pem {
            throw ECException.pemStructure
        }
        return try decode(parts[2])
    }

    /// Base64 encodes a byte array
    ///
    /// - Parameters:
    ///   - input: Bytes to encode
    ///   - linesize: Number of characters per line - 76 is default
    /// - Returns: The Base64 encoding of *input*
    public static func encode(_ input: Bytes, _ linesize: Int = 76) -> String {
        var base64 = ""
        var i = 0
        var k = 0
        var bbb = Bytes(repeating: 0, count: 3)
        for b in input {
            bbb[i] = b
            i += 1
            if i == 3 {
                if k == linesize {
                    base64 += "\n"
                    k = 0
                }
                base64 += base64chars[Int(bbb[0] >> 2)]
                base64 += base64chars[Int(((bbb[0] & 0x03) << 4) | (bbb[1] >> 4))]
                base64 += base64chars[Int(((bbb[1] & 0x0f) << 2) | (bbb[2] >> 6))]
                base64 += base64chars[Int(bbb[2] & 0x3f)]
                i = 0
                k += 4
            }
        }
        if k == linesize && i > 0 {
            base64 += "\n"
        }
        if i == 1 {
            base64 += base64chars[Int(bbb[0] >> 2)]
            base64 += base64chars[Int((bbb[0] & 0x03) << 4)]
            base64 += "="
            base64 += "="
        } else if i == 2 {
            base64 += base64chars[Int(bbb[0] >> 2)]
            base64 += base64chars[Int(((bbb[0] & 0x03) << 4) | (bbb[1] >> 4))]
            base64 += base64chars[Int((bbb[1] & 0x0f) << 2)]
            base64 += "="
        }
        return base64
    }

    /// Base64 decodes a string
    ///
    /// - Parameters:
    ///   - input: String to decode
    /// - Returns: The Base64 decoding of *input*
    /// - Throws: A *base64* exception if the input is malformed
    public static func decode(_ input: String) throws -> Bytes {
        var bytes: Bytes = []
        var eq = 0
        var i = 0
        var bbbb = Bytes(repeating: 0, count: 4)
        for s in input {
            var x = Int(s.unicodeScalars.first!.value)
            switch x {
            case 65...90: // A .. Z
                if eq > 0 {
                    throw ECException.base64
                }
                x -= 65
            case 97...122: // a .. z
                if eq > 0 {
                    throw ECException.base64
                }
                x -= 71
            case 48...57: // 0 .. 9
                if eq > 0 {
                    throw ECException.base64
                }
                x += 4
            case 43: // +
                if eq > 0 {
                    throw ECException.base64
                }
                x = 62
            case 47: // /
                if eq > 0 {
                    throw ECException.base64
                }
                x = 63
            case 61: // =
                eq += 1
                if eq > 2 {
                    throw ECException.base64
                }
                x = 0
            case 10:
                continue
            case 13:
                continue
            default:
                throw ECException.base64
            }
            bbbb[i] = Byte(x)
            i += 1
            if i == 4 {
                bytes.append((bbbb[0] << 2) | (bbbb[1] >> 4))
                if eq < 2 {
                    bytes.append((bbbb[1] << 4) | (bbbb[2] >> 2))
                    if eq < 1 {
                        bytes.append((bbbb[2] << 6) | bbbb[3])
                    }
                }
                i = 0
            }
        }
        if i > 0 {
            throw ECException.base64
        }
        return bytes
    }

}
