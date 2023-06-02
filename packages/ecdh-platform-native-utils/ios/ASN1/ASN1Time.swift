//
//  ASN1Time.swift
//  ASN1
//
//  Created by Leif Ibsen on 29/10/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

import Foundation

/// Superclass for ASN1GeneralizedTime and ASN1UTCTime
public class ASN1Time: ASN1SimpleType {
    
    init(_ tag: Byte, _ date: Date, _ generalizedTime: Bool) {
        super.init(tag, ASN1Time.encodeTime(date, generalizedTime))
    }
    
    init(_ tag: Byte, _ bytes: Bytes, _ generalizedTime: Bool) {
        super.init(tag, bytes)
    }

    static func encodeTime(_ date: Date, _ generalizedTime: Bool) -> Bytes {
        let df = DateFormatter()
        let dfs1 = generalizedTime ? "yyyyMMddHHmmss" : "yyMMddHHmmss"
        let dfs2 = df.timeZone.secondsFromGMT() == 0 ? "'Z'" : "ZZZ"
        df.dateFormat = dfs1 + dfs2
        return Bytes(df.string(from: date).utf8)
    }

}
