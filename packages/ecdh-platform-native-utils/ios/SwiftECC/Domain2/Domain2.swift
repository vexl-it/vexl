//
//  Domain2.swift
//  AEC
//
//  Created by Leif Ibsen on 07/10/2019.
//




class Domain2 {

    // Generator point multiplication window width
    static let WW = 4
    static let WWMASK = Limb(0xf)
    static let WWEXP = 16 // 2 ** WW

    let name: String
    let oid: ASN1ObjectIdentifier?
    let rp: RP
    let a: BitVector
    let b: BitVector
    let g: Point2
    let order: BInt
    let cofactor: Int

    // Precomputed multiples of the generator point

    var gpts: [Point2] = []

    init(_ name: String, _ rp: RP, _ a: BInt, _ b: BInt, _ gx: BInt, _ gy: BInt, _ order: BInt, _ cofactor: Int, _ oid: ASN1ObjectIdentifier? = nil) {
        self.name = name
        self.oid = oid
        self.rp = rp
        self.a = BitVector(self.rp.t, a.magnitude)
        self.b = BitVector(self.rp.t, b.magnitude)
        self.g = Point2(BitVector(self.rp.t, gx.magnitude), BitVector(self.rp.t, gy.magnitude))
        self.order = order
        self.cofactor = cofactor

        // Precompute multiples of the generator point to speed-up generator point multiplication

        self.gpts = computeGWpts(self.g.toPoint())
    }

    func computeGWpts(_ w: Point) -> [Point2] {
        let d = (self.order.bitWidth + Domain2.WW - 1) / Domain2.WW
        var wpts = [Point2](repeating: Point2.INFINITY, count: d)
        wpts[0] = Point2.fromPoint(self.rp, w)
        for i in 1 ..< d {
            wpts[i] = wpts[i - 1]
            for _ in 0 ..< Domain2.WW {
                wpts[i] = double(wpts[i])
            }
        }
        return wpts
    }

    func double(_ pt: Point2) -> Point2 {
        if pt.x.isZero {
            return Point2.INFINITY
        }
        let l = pt.x.plus(mulModP(pt.y, pt.x.inverse(self.rp)))
        let x3 = mulModP(l, l).plus((l.plus(self.a)))
        let y3 = mulModP(pt.x, pt.x).plus((mulModP(l, x3).plus(x3)))
        return Point2(x3, y3)
    }

    // [GUIDE] - chapter 3.1.2
    func add(_ pt1: Point2, _ pt2: Point2) -> Point2 {
        if pt1.infinity {
            return pt2
        }
        if pt2.infinity {
            return pt1
        }
        if pt1.x == pt2.x {
            if pt1.y == pt2.y {
                return double(pt1)
            } else {
                return Point2.INFINITY
            }
        }
        let l = mulModP(pt1.y.plus(pt2.y), pt1.x.plus(pt2.x).inverse(self.rp))
        var x3 = squareModP(l)
        x3.add(l)
        x3.add(pt1.x)
        x3.add(pt2.x)
        x3.add(self.a)
        let y3 = mulModP(l, (pt1.x.plus(x3))).plus((x3.plus(pt1.y)))
        return Point2(x3, y3)
    }

    func subtract(_ pt1: Point2, _ pt2: Point2) -> Point2 {
        return add(pt1, negate(pt2))
    }

    func negate(_ pt: Point2) -> Point2 {
        return pt.infinity ? Point2.INFINITY : Point2(pt.x, pt.x.plus(pt.y))
    }

/*
    // [CRANDALL] - algorithm 7.2.4
    func multiply(_ pt: Point2, _ n: BInt) -> Point2 {
        assert(0 <= n && n < self.order)
        if n.isZero {
            return Point2.INFINITY
        }
        if n.isOne {
            return pt
        }
        var q = pt
        let npt = negate(pt)
        let m = n * 3
        for i in (1 ... m.bitWidth - 2).reversed() {
            q = double(q)
            let mi = m.testBit(i)
            let ni = n.testBit(i)
            if mi && !ni {
                q = add(q, pt)
            } else if !mi && ni {
                q = add(q, npt)
            }
        }
        return q
    }
*/

    // Montgomery ladder algorithm, about 40% slower than the above algorithm but runs in constant time
    func multiply(_ pt: Point2, _ n: BInt) -> Point2 {
        assert(0 <= n && n < self.order)
        var r0 = Point2.INFINITY
        var r1 = pt
        for i in (0 ..< n.bitWidth).reversed() {
            if n.testBit(i) {
                r0 = add(r0, r1)
                r1 = double(r1)
            } else {
                r1 = add(r0, r1)
                r0 = double(r0)
            }
        }
        return r0
    }

    // Multiply the generator point by n
    func multiplyG(_ n: BInt) -> Point {
        return multiplyGW(n, &self.gpts)
    }

    // Multiply a public key w by n
    func multiplyW(_ n: BInt, _ wpts: inout [Point2]) -> Point {
        return multiplyGW(n, &wpts)
    }

    // [GUIDE] - algorithm 3.41
    func multiplyGW(_ n: BInt, _ gwpts: inout [Point2]) -> Point {
        var a = Point2.INFINITY
        var b = Point2.INFINITY
        for j in (1 ..< Domain2.WWEXP).reversed() {
            var mx = 0
            var mi = 0
            for i in 0 ..< gwpts.count {
                if (n.magnitude[mx] >> mi) & Domain2.WWMASK == j {
                    b = add(b, gwpts[i])
                }
                mi += Domain2.WW
                if mi == 64 {
                    mi = 0
                    mx += 1
                    if mx == n.magnitude.count {
                        break
                    }
                }
            }
            a = add(a, b)
        }
        return a.toPoint()
    }

    // y^2 + xy = x^3 + ax^2 + b
    func contains(_ pt: Point2) -> Bool {
        if pt.infinity {
            return true
        }
        let x3 = mulModP(squareModP(pt.x), pt.x).plus((mulModP(self.a, squareModP(pt.x)).plus(self.b)))
        let y2 = squareModP(pt.y).plus(mulModP(pt.x, pt.y))
        return x3 == y2
    }

    func asn1(_ explicit: Bool) -> ASN1 {
        if explicit || self.oid == nil {
            let seq1 = ASN1Sequence()
                .add(ASN1Integer(BInt(self.rp.m)))
            if self.rp.k3 == 0 {
                _ = seq1.add(ASN1Integer(BInt(self.rp.k1)))
            } else {
                _ = seq1.add(ASN1Sequence()
                    .add(ASN1Integer(BInt(self.rp.k1)))
                    .add(ASN1Integer(BInt(self.rp.k2)))
                    .add(ASN1Integer(BInt(self.rp.k3))))
            }
            return ASN1Sequence()
                .add(ASN1Integer(BInt.ONE))
                .add(ASN1Sequence()
                    .add(Domain.OID_2)
                    .add(seq1))
                .add(ASN1Sequence()
                    .add(ASN1OctetString(BInt(self.a.bv).asMagnitudeBytes()))
                    .add(ASN1OctetString(BInt(self.b.bv).asMagnitudeBytes())))
                .add(ASN1OctetString(encodePoint(self.g.toPoint(), false)))
                .add(ASN1Integer(self.order))
                .add(ASN1Integer(BInt(self.cofactor)))
        }
        return self.oid!
    }

    // [KNUTH] chapter 4.6.1 - algorithm D
    func reduceModP(_ x: BitVector) -> BitVector {
        let m = x.bitWidth - 1
        let n = self.rp.m
        var r = x
        var q = BitVector(self.rp.t)
        if m >= n {
            for k in (0 ... m - n).reversed() {
                if r.testBit(n + k) {
                    q.setBit(k)
                }
                if q.testBit(k) {
                    r.addRp(k, self.rp)
                }
            }
        }
        r.bv[self.rp.t - 1] &= self.rp.mask
        return BitVector(self.rp.t, r.bv)
    }

    func mulModP(_ x: BitVector, _ y: BitVector) -> BitVector {
        let a = Limbs(repeating: 0, count: self.rp.t << 1)
        var xy = BitVector(self.rp.t, a, true)
        var xx = BitVector(self.rp.t, x.bv, true)
        for i in 0 ..< y.bitWidth {
            if y.testBit(i) {
                xy.add(xx)
            }
            xx.shiftLeft()
        }
        return self.reduceModP(xy)
    }

    func squareModP(_ x: BitVector) -> BitVector {
        let a = Limbs(repeating: 0, count: self.rp.t << 1)
        var xx = BitVector(self.rp.t, a, true)
        for i in 0 ..< x.bitWidth {
            if x.testBit(i) {
                xx.setBit(i << 1)
            }
        }
        return self.reduceModP(xx)
    }

    // [SEC 1] section 2.3.3
    func encodePoint(_ pt: Point, _ compress: Bool) -> Bytes {
        var b: Bytes
        if pt.infinity {
            b = [0]
        } else {
            let l = (self.rp.m + 7) / 8
            let bx = pt.x.asMagnitudeBytes()
            if compress {
                b = Bytes(repeating: 0, count: l + 1)
                if pt.x.isZero {
                    b[0] = 2
                } else {
                    let vx = BitVector(self.rp.t, pt.x.magnitude)
                    let vy = BitVector(self.rp.t, pt.y.magnitude)
                    let vx1 = vx.inverse(self.rp)
                    let z = mulModP(vy, vx1)
                    b[0] = z.testBit(0) ? 3 : 2
                }
                var x = 1 + l - bx.count
                for i in 0 ..< bx.count {
                    b[x] = bx[i]
                    x += 1
                }
            } else {
                let by = pt.y.asMagnitudeBytes()
                b = Bytes(repeating: 0, count: 2 * l + 1)
                b[0] = 4
                var x = 1 + l - bx.count
                for i in 0 ..< bx.count {
                    b[x] = bx[i]
                    x += 1
                }
                x += l - by.count
                for i in 0 ..< by.count {
                    b[x] = by[i]
                    x += 1
                }
            }
        }
        return b
    }

    // [SEC 1] section 2.3.4
    func decodePoint(_ bytes: Bytes) throws -> Point {
        var p: Point
        let l = bytes.count
        let bw = (self.rp.m + 7) / 8
        if l == 1 {
            if bytes[0] == 0 {
                p = Point.INFINITY
            } else {
                throw ECException.decodePoint
            }
        } else if l == bw + 1 {

            // Compressed format
            // X9.62 - appendix D.1.6

            let x = BInt(magnitude: Bytes(bytes[1 ..< l]))
            if x.isZero {
                var B = self.b
                for _ in 0 ..< self.rp.m - 1 {
                    B = squareModP(B)
                }
                p = Point(x, B.asBInt())
            } else {
                var beta = BitVector(self.rp.t, x.magnitude)
                let xx = beta
                beta = mulModP(beta, beta)
                beta = beta.inverse(self.rp)
                beta = mulModP(beta, self.b)
                beta.add(self.a)
                beta.add(xx)
                var z = halfTrace(beta)
                var gamma = mulModP(z, z)
                gamma.add(z)
                if gamma == beta {
                    if (bytes[0] == 2 && z.testBit(0)) || (bytes[0] == 3 && !z.testBit(0)) {
                        z.flipBit(0)
                    }
                    let y = mulModP(xx, z)
                    p = Point(x, y.asBInt())
                } else {
                    throw ECException.decodePoint
                }
            }
        } else if l == 2 * bw + 1 {

            // Uncompressed format

            if bytes[0] != 4 {
                throw ECException.decodePoint
            }
            let x = BInt(magnitude: Bytes(bytes[1 ... l / 2]))
            let y = BInt(magnitude: Bytes(bytes[l / 2 + 1 ..< l]))
            p = Point(x, y)
        } else {
            throw ECException.decodePoint
        }
        return p
    }

    // [X9.62] - appendix D.1.5
    func halfTrace(_ x: BitVector) -> BitVector {
        var t = x
        for _ in 1 ... (self.rp.m - 1) / 2 {
            t = mulModP(t, t)
            t = mulModP(t, t)
            t.add(x)
        }
        return t
    }
}
