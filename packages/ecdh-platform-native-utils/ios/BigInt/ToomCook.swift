//
//  ToomCook.swift
//  BigInt
//
//  Created by Leif Ibsen on 07/02/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//

/*
 * ToomCook multiplication modelled after the ToomCook algorithm in Java BigInteger
 */
extension Array where Element == Limb {

    // Works only when the remainder of the division is known to be 0
    static func divideBy3(_ d: BInt) -> BInt {
        var quotient = Limbs(repeating: 0, count: d.magnitude.count)
        var remainder = Limb(0)
        for i in 0 ..< quotient.count {
            let w = remainder > d.magnitude[i] ? remainder - d.magnitude[i] : d.magnitude[i] - remainder
            let x = w &* 0xaaaaaaaaaaaaaaab
            quotient[i] = x
            remainder = x < 0x5555555555555556 ? 0 : (x < 0xaaaaaaaaaaaaaaab ? 1 : 2)
        }
        return BInt(quotient, d.isNegative)
    }

    func toomCookSlice0(_ k: Int) -> BInt {
        let w = k < self.count ? Limbs(self[0 ..< k]) : self
        return BInt(w)
    }

    func toomCookSlice1(_ k: Int) -> BInt {
        let w = k < self.count ? (2 * k < self.count ? Limbs(self[k ..< 2 * k]) : Limbs(self[k ..< self.count])) : [0]
        return BInt(w)
    }

    func toomCookSlice2(_ k: Int) -> BInt {
        let w = 2 * k < self.count ? Limbs(self[2 * k ..< self.count]) : [0]
        return BInt(w)
    }

    func toomCookTimes(_ x: Limbs) -> Limbs {
        let k = (Swift.max(self.count, x.count) + 2) / 3
        let x0 = x.toomCookSlice0(k)
        let x1 = x.toomCookSlice1(k)
        let x2 = x.toomCookSlice2(k)
        let s0 = self.toomCookSlice0(k)
        let s1 = self.toomCookSlice1(k)
        let s2 = self.toomCookSlice2(k)
        let pp = x0 + x2
        let p1 = pp + x1
        let pm1 = pp - x1
        let pm2 = ((pm1 + x2) << 1) - x0
        let qq = s0 + s2
        let q1 = qq + s1
        let qm1 = qq - s1
        let qm2 = ((qm1 + s2) << 1) - s0
        
        let r0 = x0 * s0
        let r1 = p1 * q1
        let rm1 = pm1 * qm1
        let rm2 = pm2 * qm2
        let rinf = x2 * s2
        var rr3 = Limbs.divideBy3(rm2 - r1)
        var rr1 = (r1 - rm1) >> 1
        var rr2 = rm1 - r0
        
        rr3 = (rr2 - rr3) >> 1 + (rinf << 1)
        rr2 += rr1
        rr2 -= rinf
        rr1 -= rr3
        
        var result = Limbs(repeating: 0, count: 6 * k)
        var offset = k << 2
        result.add(rinf.magnitude, offset)
        offset -= k
        result.add(rr3.magnitude, offset)
        offset -= k
        result.add(rr2.magnitude, offset)
        result.add(rr1.magnitude, k)
        result.add(r0.magnitude, 0)
        return result
    }

    func toomCookSquare() -> Limbs {
        let k = (self.count + 2) / 3
        let a0 = self.toomCookSlice0(k)
        let a1 = self.toomCookSlice1(k)
        let a2 = self.toomCookSlice2(k)
        let v0 = a0 ** 2
        var da1 = a2 + a0
        let vm1 = (da1 - a1) ** 2
        da1 += a1
        let v1 = da1 ** 2
        let vinf = a2 ** 2
        let v2 = (((da1 + a2) << 1) - a0) ** 2

        var t2 = Limbs.divideBy3(v2 - vm1)
        var tm1 = (v1 - vm1) >> 1
        var t1 = v1 - v0
        t2 = (t2 - t1) >> 1
        t1 = t1 - tm1 - vinf
        t2 = t2 - (vinf << 1)
        tm1 -= t2

        var result = Limbs(repeating: 0, count: 6 * k)
        var offset = k << 2
        result.add(vinf.magnitude, offset)
        offset -= k
        result.add(t2.magnitude, offset)
        offset -= k
        result.add(t1.magnitude, offset)
        result.add(tm1.magnitude, k)
        result.add(v0.magnitude, 0)
        return result
    }

}
