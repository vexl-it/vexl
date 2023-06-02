//
//  ASN1Exception.swift
//  ASN1
//
//  Created by Leif Ibsen on 29/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

/// ASN1 exceptions
public enum ASN1Exception: Error {

    /// An ASN1 value is too long, max four length bytes are supported
    /// - Parameters:
    ///   - position: position in input
    ///   - length: number of length bytes
    case tooLong(position: Int, length: Int)
    
    /// Unsupported tag
    /// - Parameters:
    ///   - position: position in input
    ///   - tag: tag that is not supported
    case unsupportedTag(position: Int, tag: Byte)
    
    /// Application tag class (1) and private tag class (3) are not supported
    /// - Parameters:
    ///   - position: position in input
    ///   - tagClass: tag class that is not supported - 1 or 3
    case unsupportedTagClass(position: Int, tagClass: Byte)
    
    /// Tag number must be less than 128
    /// - Parameters:
    ///   - position: position in input
    case tagTooBig(position: Int)

    /// Not enough input, eof encountered
    /// - Parameters:
    ///   - position: position in input
    ///   - length: number of bytes required
    case inputTooShort(position: Int, length: Int)

    /// Indefinite length only supported for sets and sequences
    /// - Parameters:
    ///   - position: position in input
    case indefiniteLength(position: Int)

    /// Wrong input data
    /// - Parameters:
    ///   - position: position in input
    case wrongData(position: Int)

}
