//
//  BurnikelZiegler.swift
//  BigIntTest
//
//  Created by Leif Ibsen on 05/12/2021.
//


extension Array where Element == Limb {

    // Divisor limb limit for Burnikel-Ziegler division
    static let BZ_DIV_LIMIT = 60

    /*
     * [BURNIKEL] - algorithm 3
     */
    func bzDivMod(_ v: Limbs) -> (quotient: Limbs, remainder: Limbs) {
        var quotient: Limbs = [0]
        var remainder: Limbs = []
        var A = self
        var B = v
        let s = B.count
        let m = 1 << (64 - (s / Limbs.BZ_DIV_LIMIT).leadingZeroBitCount)
        let j = (s + m - 1) / m
        let n = j * m
        let n64 = n << 6
        let sigma = Swift.max(0, n64 - B.bitWidth)
        A.shiftLeft(sigma)
        B.shiftLeft(sigma)
        let t = Swift.max(2, (A.bitWidth + n64) / n64)
        var Z = Limbs(repeating: 0, count: 2 * n)
        var from = (t - 1) * n
        var zi = n
        for ai in from ..< A.count {
            Z[zi] = A[ai]
            zi += 1
        }
        from -= n
        zi = 0
        for ai in from ..< from + n {
            Z[zi] = A[ai]
            zi += 1
        }
        for i in (0 ... t - 2).reversed() {
            var (Q, R) = Div2n1n(n, Z, B)
            R.normalize()
            quotient.add(Q, from)
            if i > 0 {
                from -= n
                for zi in 0 ..< R.count {
                    Z[n + zi] = R[zi]
                }
                for zi in R.count ..< n {
                    Z[n + zi] = 0
                }
                zi = 0
                for ai in from ..< from + n {
                    Z[zi] = A[ai]
                    zi += 1
                }
            } else {
                remainder = R
                remainder.shiftRight(sigma)
            }
        }
        return (quotient, remainder)
    }

    /*
     * [BURNIKEL] - algorithm 1
     */
    func Div2n1n(_ n: Int, _ A: Limbs, _ B: Limbs) -> (Limbs, Limbs) {
        if B.count & 1 == 1 || B.count < Limbs.BZ_DIV_LIMIT {
            
            // Basecase

            var a = A
            a.normalize()
            var b = B
            b.normalize()
            return a.divMod(b)
        }
        var A1: Limbs
        var A2: Limbs
        var A3: Limbs
        var A4: Limbs
        let n12 = n >> 1
        let n32 = 3 * n12
        if A.count > n32 {
            A1 = Limbs(A[n32 ..< A.count])
            A2 = Limbs(A[n ..< n32])
            A3 = Limbs(A[n12 ..< n])
            A4 = Limbs(A[0 ..< n12])
        } else if A.count > n {
            A1 = [0]
            A2 = Limbs(A[n ..< A.count])
            A3 = Limbs(A[n12 ..< n])
            A4 = Limbs(A[0 ..< n12])
        } else if A.count > n12 {
            A1 = [0]
            A2 = [0]
            A3 = Limbs(A[n12 ..< A.count])
            A4 = Limbs(A[0 ..< n12])
        } else {
            A1 = [0]
            A2 = [0]
            A3 = [0]
            A4 = Limbs(A[0 ..< A.count])
        }
        let (Q1, R1) = Div3n2n(n12, A1, A2, A3, B)
        let R11 = Limbs(R1.count > n12 ? R1[n12 ..< R1.count] : [0])
        let R12 = Limbs(R1.count > n12 ? R1[0 ..< n12] : R1[0 ..< R1.count])
        let (Q2, R) = Div3n2n(n12, R11, R12, A4, B)
        var Q = Q1.shiftedLeft(n12 << 6)
        Q.add(Q2, 0)
        return (Q, R)
    }

    /*
     * [BURNIKEL] - algorithm 2
     */
    func Div3n2n(_ n: Int, _ A1: Limbs, _ A2: Limbs, _ A3: Limbs, _ B: Limbs) -> (Limbs, Limbs) {
        let B1 = Limbs(B.count > n ? B[n ..< B.count] : [0])
        let B2 = Limbs(B.count > n ? B[0 ..< n] : B[0 ..< B.count])
        var Q: Limbs
        var R1: Limbs
        if A1.compare(B1) < 0 {
            var A = A1.shiftedLeft(n << 6)
            A.add(A2, 0)
            (Q, R1) = Div2n1n(n, A, B1)
        } else {
            R1 = A1
            _ = R1.subtract(B1, 0)
            R1.shiftLeft(n << 6)
            R1.add(B1, 0)
            Q = Limbs(repeating: 0xffffffffffffffff, count: n)
        }
        var D = Q
        D.multiply(B2)
        var R = R1.shiftedLeft(n << 6)
        R.add(A3)
        while R.compare(D) < 0 {
            R.add(B)
            _ = Q.subtract([1], 0)
        }
        _ = R.subtract(D, 0)
        return (Q, R)
    }

}
