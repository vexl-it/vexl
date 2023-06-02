//
//  Point2.swift
//  AEC
//
//  Created by Leif Ibsen on 21/10/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//



// Internal representation of curve points in a characteristic 2 domain
// The x- and y-coordinates are bitvectors
struct Point2: Equatable {

    static let INFINITY = Point2()

    private init() {
        self.x = BitVector()
        self.y = BitVector()
        self.infinity = true
    }

    init(_ x: BitVector, _ y: BitVector) {
        self.x = x
        self.y = y
        self.infinity = false
    }

    let x: BitVector
    let y: BitVector
    let infinity: Bool

    static func == (p1: Point2, p2: Point2) -> Bool {
        return p1.x == p2.x && p1.y == p2.y && p1.infinity == p2.infinity
    }

    // Make a Point2 from a Point
    static func fromPoint(_ rp: RP, _ p: Point) -> Point2 {
        return p.infinity ? Point2.INFINITY : Point2(BitVector(rp.t, p.x.magnitude), BitVector(rp.t, p.y.magnitude))
    }

    // Make a Point from this Point2
    func toPoint() -> Point {
        return self.infinity ? Point.INFINITY : Point(self.x.asBInt(), self.y.asBInt())
    }

}
