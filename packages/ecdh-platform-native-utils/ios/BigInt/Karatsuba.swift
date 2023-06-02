//
//  Karatsuba.swift
//  BigInt
//
//  Created by Leif Ibsen on 14/02/2019.
//  Copyright © 2019 Leif Ibsen. All rights reserved.
//

/*
 * Karatsuba multiplication modelled after the Karatsuba algorithm in Java BigInteger
 */
extension Array where Element == Limb {

    func karatsubaSlice0(_ k: Int) -> Limbs {
        return k < self.count ? Limbs(self[0 ..< k]) : self
    }

    func karatsubaSlice1(_ k: Int) -> Limbs {
        return k < self.count ? Limbs(self[k ..< self.count]) : [0]
    }

    func karatsubaTimes(_ x: Limbs) -> Limbs {
        let k = (Swift.max(self.count, x.count) + 1) >> 1
        let xl = x.karatsubaSlice0(k)
        var xh = x.karatsubaSlice1(k)
        let sl = self.karatsubaSlice0(k)
        var sh = self.karatsubaSlice1(k)
        var p1 = xh
        p1.multiply(sh)
        var p2 = xl
        p2.multiply(sl)
        xh.add(xl)
        sh.add(sl)
        var p3 = xh
        p3.multiply(sh)
        _ = p3.subtract(p1, 0)
        _ = p3.subtract(p2, 0)
        var w = Limbs(repeating: 0, count: k << 2)
        w.add(p1, k << 1)
        w.add(p3, k)
        w.add(p2, 0)
        return w
    }

    func karatsubaSquare() -> Limbs {
        let k = (self.count + 1) >> 1
        let xl = self.karatsubaSlice0(k)
        let xh = self.karatsubaSlice1(k)
        let xls = xl.squared()
        let xhs = xh.squared()
        var p: Limbs
        if xh.compare(xl) > 0 {
            p = xh
            _ = p.subtract(xl, 0)
        } else {
            p = xl
            _ = p.subtract(xh, 0)
        }
        p.square()
        var w = Limbs(repeating: 0, count: k << 2)
        w.add(xhs, k << 1)
        w.add(xhs, k)
        w.add(xls, k)
        _ = w.subtract(p, k)
        w.add(xls, 0)
        return w
    }

}
