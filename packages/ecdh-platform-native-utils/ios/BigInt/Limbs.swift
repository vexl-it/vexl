//
//  Limbs.swift
//  BigInt
//
//  Created by Leif Ibsen on 24/12/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

extension Array where Element == Limb {
    
    static let UMasks: Limbs = [
        0x1,0x2,0x4,0x8,
        0x10,0x20,0x40,0x80,
        0x100,0x200,0x400,0x800,
        0x1000,0x2000,0x4000,0x8000,
        0x10000,0x20000,0x40000,0x80000,
        0x100000,0x200000,0x400000,0x800000,
        0x1000000,0x2000000,0x4000000,0x8000000,
        0x10000000,0x20000000,0x40000000,0x80000000,
        0x100000000,0x200000000,0x400000000,0x800000000,
        0x1000000000,0x2000000000,0x4000000000,0x8000000000,
        0x10000000000,0x20000000000,0x40000000000,0x80000000000,
        0x100000000000,0x200000000000,0x400000000000,0x800000000000,
        0x1000000000000,0x2000000000000,0x4000000000000,0x8000000000000,
        0x10000000000000,0x20000000000000,0x40000000000000,0x80000000000000,
        0x100000000000000,0x200000000000000,0x400000000000000,0x800000000000000,
        0x1000000000000000,0x2000000000000000,0x4000000000000000,0x8000000000000000]

    // Ensure no leading 0 Limbs - except if self = [0]
    mutating func normalize() {
        if self.count == 0 {
            self = [0]
        } else {
            var n = 0
            var i = self.count - 1
            while i > 0 && self[i] == 0 {
                n += 1
                i -= 1
            }
            self.removeLast(n)
        }
    }

    mutating func ensureSize(_ size: Int) {
        self.reserveCapacity(size)
        while self.count < size {
            self.append(0)
        }
    }

    func trailingZeroBitCount() -> Int {
        if self == [0] {
            return 0
        }
        var i = 0
        while self[i] == 0 {
            i += 1
        }
        return i * 64 + self[i].trailingZeroBitCount
    }

    /*
     * Bit operations
     */
    
    var bitWidth: Int {
        var lastBits = 0
        var last = self.last!
        while last != 0 {
            last >>= 1
            lastBits += 1
        }
        return (self.count - 1) * 64 + lastBits
    }
    
    func testBitAt(_ i: Int) -> Bool {
        if i < 0 {
            return false
        }
        let limbIndex = i >> 6
        return limbIndex < self.count ? (self[limbIndex] & Limbs.UMasks[i & 0x3f]) != 0 : false
    }

    mutating func clearBitAt(_ i: Int) {
        if i >= 0 {
            let limbIndex = i >> 6
            if limbIndex < self.count {
                self[limbIndex] &= ~Limbs.UMasks[i & 0x3f]
                self.normalize()
            }
        }
    }

    mutating func setBitAt(_ i: Int) {
        if i >= 0 {
            let limbIndex = i >> 6
            self.ensureSize(limbIndex + 1)
            self[limbIndex] |= Limbs.UMasks[i & 0x3f]
        }
    }

    mutating func flipBitAt(_ i: Int) {
        if i >= 0 {
            let limbIndex = i >> 6
            self.ensureSize(limbIndex + 1)
            self[limbIndex] ^= Limbs.UMasks[i & 0x3f]
            self.normalize()
        }
    }

    /*
     * Comparing
     */

    // return -1 if self < x, +1 if self > x, and 0 if self = x
    func compare(_ x: Limbs) -> Int {
        var scount = self.count
        while scount > 1 && self[scount - 1] == 0 {
            scount -= 1
        }
        var xcount = x.count
        while xcount > 1 && x[xcount - 1] == 0 {
            xcount -= 1
        }
        if scount < xcount {
            return -1
        } else if scount > xcount {
            return 1
        }
        var i = xcount - 1
        while i >= 0 {
            if self[i] < x[i] {
                return -1
            } else if self[i] > x[i] {
                return 1
            }
            i -= 1
        }
        return 0
    }

    // return -1 if self < x, +1 if self > x, and 0 if self = x
    func compare(_ x: Limb) -> Int {
        var scount = self.count
        while scount > 1 && self[scount - 1] == 0 {
            scount -= 1
        }
        if scount > 1 {
            return 1
        }
        return self[0] == x ? 0 : (self[0] < x ? -1 : 1)
    }

    // return self < x
    func lessThan(_ x: Limbs) -> Bool {
        return self.compare(x) < 0
    }

    // return self > x
    func greaterThan(_ x: Limbs) -> Bool {
        return self.compare(x) > 0
    }

    // return self = x
    func equalTo(_ x: Limb) -> Bool {
        return self.count == 1 && self[0] == x
    }

    /*
     * Shifting
     */

    // self = self << 1
    mutating func shift1Left() {
        var b = self[0] & 0x8000000000000000 != 0
        self.withUnsafeMutableBufferPointer {unsafeself in
            unsafeself[0] <<= 1
            for i in 1 ..< unsafeself.count {
                let b1 = unsafeself[i] & 0x8000000000000000 != 0
                unsafeself[i] <<= 1
                if b {
                    unsafeself[i] |= 1
                }
                b = b1
            }
        }
        if b {
            self.append(1)
        }
    }

    // self = self << shifts
    mutating func shiftLeft(_ shifts: Int) {
        if self.equalTo(0) {
            return
        }
        let limbShifts = shifts >> 6
        let bitShifts = shifts & 0x3f
        var b = self[0] >> (64 - bitShifts)
        if bitShifts > 0 {
            self.withUnsafeMutableBufferPointer { unsafeself in
                unsafeself[0] <<= bitShifts
                for i in 1 ..< unsafeself.count {
                    let b1 = unsafeself[i] >> (64 - bitShifts)
                    unsafeself[i] <<= bitShifts
                    unsafeself[i] |= b
                    b = b1
                }
            }
        }
        if b != 0 {
            self.append(b)
        }
        if limbShifts > 1 {
            self.insert(contentsOf: Limbs(repeating: 0, count: limbShifts), at: 0)
        } else if limbShifts == 1 {
            self.insert(0, at: 0)
        }
    }

    // return self << 1
    func shifted1Left() -> Limbs {
        var res = self
        res.shift1Left()
        return res
    }

    // return self << shifts
    func shiftedLeft(_ shifts: Int) -> Limbs {
        var res = self
        res.shiftLeft(shifts)
        return res
    }
    
    // self = self >> 1
    mutating func shift1Right() {
        self.withUnsafeMutableBufferPointer { unsafeself in
            for i in 0 ..< unsafeself.count {
                if i > 0 && unsafeself[i] & 1 == 1 {
                    unsafeself[i - 1] |= 0x8000000000000000
                }
                unsafeself[i] >>= 1
            }
        }
        self.normalize()
    }

    // self = self >> shifts
    mutating func shiftRight(_ shifts: Int) {
        let limbShifts = Swift.min(shifts >> 6, self.count)
        self.removeFirst(limbShifts)
        let bitShifts = shifts & 0x3f
        if bitShifts > 0 {
            self.withUnsafeMutableBufferPointer { unsafeself in
                for i in 0 ..< unsafeself.count {
                    if i > 0 {
                        unsafeself[i - 1] |= unsafeself[i] << (64 - bitShifts)
                    }
                    unsafeself[i] >>= bitShifts
                }
            }
        }
        self.normalize()
    }

    // return self >> 1
    func shifted1Right() -> Limbs {
        var res = self
        res.shift1Right()
        return res
    }

    // return self >> shifts
    func shiftedRight(_ shifts: Int) -> Limbs {
        var res = self
        res.shiftRight(shifts)
        return res
    }

    /*
     * Addition
     */

    // self[offset ..< self.count] = self[offset ..< self.count] + x
    mutating func add(_ x: Limbs, _ offset: Int = 0, _ uselastcarry: Bool = true) {
        if x.equalTo(0) {
            return
        }
        self.ensureSize(x.count + offset)
        var carry = false
        self.withUnsafeMutableBufferPointer { unsafeself in
            for i in 0 ..< x.count {
                let io = i + offset
                if carry {
                    unsafeself[io] &+= 1
                    if unsafeself[io] == 0 {
                        unsafeself[io] = x[i]
                        // carry still lives
                    } else {
                        (unsafeself[io], carry) = unsafeself[io].addingReportingOverflow(x[i])
                    }
                } else {
                    (unsafeself[io], carry) = unsafeself[io].addingReportingOverflow(x[i])
                }
            }
            var i = x.count + offset
            while carry && i < unsafeself.count {
                unsafeself[i] &+= 1
                carry = unsafeself[i] == 0
                i += 1
            }
        }
        if carry && uselastcarry {
            self.append(1)
        }
    }

    // self = self + [x]
    mutating func add(_ x: Limb) {
        var carry: Bool
        (self[0], carry) = self[0].addingReportingOverflow(x)
        var i = 1
        while carry && i < self.count {
            self[i] &+= 1
            carry = self[i] == 0
            i += 1
        }
        if carry {
            self.append(1)
        }
    }

    /*
     * Subtraction
     */

    // self[offset ..< self.count] = self[offset ..< self.count] - x, return borrow
    // self is not necessarily normalized
    mutating func subtract(_ x: Limbs, _ offset: Int) -> Bool {
        self.ensureSize(x.count + offset)
        var borrow = false
        self.withUnsafeMutableBufferPointer {unsafeself in
            for i in 0 ..< x.count {
                let io = i + offset
                if borrow {
                    if unsafeself[io] == 0 {
                        unsafeself[io] = 0xffffffffffffffff - x[i]
                        // borrow still lives
                    } else {
                        unsafeself[io] &-= 1
                        (unsafeself[io], borrow) = unsafeself[io].subtractingReportingOverflow(x[i])
                    }
                } else {
                    (unsafeself[io], borrow) = unsafeself[io].subtractingReportingOverflow(x[i])
                }
            }
            var i = x.count + offset
            while borrow && i < unsafeself.count {
                unsafeself[i] &-= 1
                borrow = unsafeself[i] == 0xffffffffffffffff
                i += 1
            }
        }
        return borrow
    }

    // self = abs(self - x), return self.compare(x)
    mutating func difference(_ x: Limbs) -> Int {
        var xx = x
        let cmp = self.compare(xx)
        if cmp < 0 {
            swap(&self, &xx)
        }
        var borrow = false
        self.withUnsafeMutableBufferPointer { unsafeself in
            for i in 0 ..< xx.count {
                if borrow {
                    if unsafeself[i] == 0 {
                        unsafeself[i] = 0xffffffffffffffff - xx[i]
                        // borrow still lives
                    } else {
                        unsafeself[i] &-= 1
                        (unsafeself[i], borrow) = unsafeself[i].subtractingReportingOverflow(xx[i])
                    }
                } else {
                    (unsafeself[i], borrow) = unsafeself[i].subtractingReportingOverflow(xx[i])
                }
            }
            var i = xx.count
            while borrow && i < unsafeself.count {
                unsafeself[i] &-= 1
                borrow = unsafeself[i] == 0xffffffffffffffff
                i += 1
            }
        }
        self.normalize()
        return cmp
    }

    // self = abs(self - [x]), return self.compare([x])
    mutating func difference(_ x: Limb) -> Int {
        var xx = [x]
        let cmp = self.compare(xx)
        if cmp < 0 {
            swap(&self, &xx)
        }
        var borrow: Bool
        (self[0], borrow) = self[0].subtractingReportingOverflow(xx[0])
        var i = 1
        while borrow && i < self.count {
            self[i] &-= 1
            borrow = self[i] == 0xffffffffffffffff
            i += 1
        }
        self.normalize()
        return cmp
    }

    /*
     * Multiplication
     */

    // Limb threshold for Karatsuba multiplication
    static let KA_THR = 100
    // Limb threshold for ToomCook multiplication
    static let TC_THR = 200
    // Limb threshold for FFT multiplication
    static let FFT_THR = 6000

    // self = self * x
    // [KNUTH] - chapter 4.3.1, algorithm M
    mutating func multiply(_ x: Limbs) {
        let m = self.count
        let n = x.count
        var w : Limbs
        if m < Limbs.KA_THR || n < Limbs.KA_THR {
            w = Limbs(repeating: 0, count: m + n)
            var carry = Limb(0)
            var ovfl1 = false
            var ovfl2 = false
            w.withUnsafeMutableBufferPointer { unsafew in
                for i in 0 ..< m {
                    carry = 0
                    for j in 0 ..< n {
                        let ipj = i + j
                        let (hi, lo) = self[i].multipliedFullWidth(by: x[j])
                        (unsafew[ipj], ovfl1) = unsafew[ipj].addingReportingOverflow(lo)
                        (unsafew[ipj], ovfl2) = unsafew[ipj].addingReportingOverflow(carry)
                        carry = hi
                        if ovfl1 {
                            carry &+= 1
                        }
                        if ovfl2 {
                            carry &+= 1
                        }
                    }
                    unsafew[i + n] = carry
                }
            }
        } else if m < Limbs.TC_THR || n < Limbs.TC_THR {
            w = self.karatsubaTimes(x)
        } else if m < Limbs.FFT_THR || n < Limbs.FFT_THR {
            w = self.toomCookTimes(x)
        } else {
            w = self.fftTimes(x)
        }
        w.normalize()
        self = w
    }

    // self = self * x
    mutating func multiply(_ x: Limb) {
        let m = self.count
        var w = Limbs(repeating: 0, count: m + 1)
        var ovfl = false
        w.withUnsafeMutableBufferPointer { unsafew in
            for i in 0 ..< m {
                let (hi, lo) = self[i].multipliedFullWidth(by: x)
                (unsafew[i], ovfl) = unsafew[i].addingReportingOverflow(lo)
                unsafew[i + 1] = hi
                if ovfl {
                    unsafew[i + 1] &+= 1
                }
            }
        }
        w.normalize()
        self = w
    }

    func times(_ x: Limbs) -> Limbs {
        var w = self
        w.multiply(x)
        return w
    }

    func times(_ x: Limb) -> Limbs {
        var w = self
        w.multiply(x)
        return w
    }

    // self = self * self
    mutating func square() {
        let n = self.count
        var w: Limbs
        if n < Limbs.KA_THR {
            w = Limbs(repeating: 0, count: n * 2)
            var carry = Limb(0)
            var ovfl1 = false
            var ovfl2 = false
            var ovfl3 = false
            w.withUnsafeMutableBufferPointer { unsafew in
                // Compute off-diagonal elements
                for i in 0 ..< n {
                    carry = 0
                    for j in i + 1 ..< n {
                        let ipj = i + j
                        let (hi, lo) = self[i].multipliedFullWidth(by: self[j])
                        (unsafew[ipj], ovfl1) = unsafew[ipj].addingReportingOverflow(lo)
                        (unsafew[ipj], ovfl2) = unsafew[ipj].addingReportingOverflow(carry)
                        carry = hi
                        if ovfl1 {
                            carry &+= 1
                        }
                        if ovfl2 {
                            carry &+= 1
                        }
                    }
                    unsafew[i + n] = carry
                }
            }
            // Multiply by 2
            w.shift1Left()
            w.withUnsafeMutableBufferPointer { unsafew in
                // Add diagonal elements
                carry = 0
                for i in 0 ..< n {
                    let i2 = i << 1
                    let i2p1 = i2 + 1
                    let (hi, lo) = self[i].multipliedFullWidth(by: self[i])
                    (unsafew[i2], ovfl1) = unsafew[i2].addingReportingOverflow(lo)
                    (unsafew[i2], ovfl2) = unsafew[i2].addingReportingOverflow(carry)
                    (unsafew[i2p1], ovfl3) = unsafew[i2p1].addingReportingOverflow(hi)
                    if ovfl1 {
                        (unsafew[i2p1], ovfl1) = unsafew[i2p1].addingReportingOverflow(1)
                    }
                    if ovfl2 {
                        (unsafew[i2p1], ovfl2) = unsafew[i2p1].addingReportingOverflow(1)
                    }
                    carry = 0
                    if ovfl1 {
                        carry &+= 1
                    }
                    if ovfl2 {
                        carry &+= 1
                    }
                    if ovfl3 {
                        carry &+= 1
                    }
                    assert(carry < 2)
                }
            }
        } else if n < Limbs.TC_THR {
            w = self.karatsubaSquare()
        } else if n < Limbs.FFT_THR {
            w = self.toomCookSquare()
        } else {
            w = self.fftSquare()
        }
        w.normalize()
        self = w
    }

    func squared() -> Limbs {
        var w = self
        w.square()
        return w
    }

    /*
     * Division and modulus
     */
    
    // [GRANLUND] - algorithm 4
    // (u1 || u0) / d => (q, r)
    static func div128(_ u1: Limb, _ u0: Limb, _ d: Limb, _ dReciprocal: Limb) -> (q: Limb, r: Limb) {
        assert(u1 < d)
        assert(d >= 0x8000000000000000)
        var  ovfl = false
        var (q1, q0) = dReciprocal.multipliedFullWidth(by: u1)
        (q0, ovfl) = q0.addingReportingOverflow(u0)
        (q1, _) = q1.addingReportingOverflow(u1)
        if ovfl {
            q1 &+= 1
        }
        q1 &+= 1
        var r = u0 &- q1 &* d
        if r > q0 {
            q1 &-= 1
            r &+= d
        }
        if r >= d {
            q1 += 1
            r -= d
        }
        return (q1, r)
    }

    // Limbs / Limb => (quotient: Limbs, remainder: Limb)
    // [KNUTH] - chapter 4.3.1, exercise 16
    func divMod(_ v: Limb) -> (quotient: Limbs, remainder: Limb) {
        precondition(v > 0, "Division by zero")
        if self.equalTo(0) {
            return ([0], 0)
        }
        let n = v.leadingZeroBitCount
        let d = v << n
        let dRecip = d.dividingFullWidth((0xffffffffffffffff - d, 0xffffffffffffffff)).quotient
        var w = self.shiftedLeft(n)
        var r = Limb(0)
        for j in (0 ..< w.count).reversed() {
            (w[j], r) = Limbs.div128(r, w[j], d, dRecip)
        }
        w.normalize()
        return (w, r >> n)
    }

    // Limbs / Limbs => (quotient: Limbs, remainder: Limbs)
    // [KNUTH] - chapter 4.3.1, algorithm D
    func divMod(_ v: Limbs) -> (quotient: Limbs, remainder: Limbs) {
        if self.lessThan(v) {
            return ([0], self)
        } else if v.count == 1 {
            let (q, r) = self.divMod(v[0])
            return (q, [r])
        } else {
            var remainder = self
            var v = v
            let n = v.count
            let m = remainder.count
            let d = v[n - 1].leadingZeroBitCount
            v.shiftLeft(d)
            remainder.shiftLeft(d)
            remainder.append(0)
            var qhat = Limb(0)
            var rhat = Limb(0)
            var k = m - n
            let vn1 = v[n - 1]
            let vReciprocal = vn1.dividingFullWidth((0xffffffffffffffff - vn1, 0xffffffffffffffff)).quotient
            var quotient = Limbs(repeating: 0, count: k + 1)
            var ovfl: Bool
            repeat {
                if vn1 == remainder[k + n] {
                    qhat = 0xffffffffffffffff
                    (rhat, ovfl) = remainder[k + n].addingReportingOverflow(remainder[k + n - 1])
                } else {
                    (qhat, rhat) = Limbs.div128(remainder[k + n], remainder[k + n - 1], vn1, vReciprocal)
                    ovfl = false
                }
                while !ovfl {
                    let (hi, lo) = qhat.multipliedFullWidth(by: v[n - 2])
                    if hi < rhat || (hi == rhat && lo <= remainder[k + n - 2]) {
                        break
                    }
                    qhat -= 1
                    (rhat, ovfl) = rhat.addingReportingOverflow(vn1)
                }
                if qhat != 0 {
                    let borrow = remainder.subtract(v.times(qhat), k)
                    if borrow {
                        qhat -= 1
                        remainder.add(v, k, false)
                    }
                }
                quotient[k] = qhat
                k -= 1
            } while k >= 0
            remainder.shiftRight(d)
            quotient.normalize()
            return (quotient, remainder)
        }
    }

    // Returns 1/d mod 2^64
    // [HACKER] - algorithm 10-6
    static func inverseMod64(_ d: Limb) -> Limb {
        var x = d
        while true {
            let t = d &* x
            if t == 1 {
                return x
            }
            x = x &* (2 &- t)
        }
    }
    
    // [JEBELEAN] - EDIV algorithm, exact division
    func divExact(_ v: Limbs) -> Limbs {
        precondition(!v.equalTo(0), "Division by zero")
        if self.equalTo(0) {
            return [0]
        }
        var cm = self
        var am = v
        let t = am.trailingZeroBitCount()
        cm.shiftRight(t)
        am.shiftRight(t)
        let a1 = Limbs.inverseMod64(am[0])
        let K = cm.count - am.count + 1
        var bm = Limbs(repeating: 0, count: K)
        for k in 0 ..< K {
            let bk = a1 &* cm[k]
            bm[k] = bk
            let n = Swift.min(am.count, K - k)
            var w = Limbs(repeating: 0, count: n + 1)
            var ovfl = false
            w.withUnsafeMutableBufferPointer { unsafew in
                for i in 0 ..< n {
                    let (hi, lo) = am[i].multipliedFullWidth(by: bk)
                    (unsafew[i], ovfl) = unsafew[i].addingReportingOverflow(lo)
                    unsafew[i + 1] = hi
                    if ovfl {
                        unsafew[i + 1] &+= 1
                    }
                }
            }
            _ = cm.subtract(w, k)
        }
        return bm
    }

    // Binary gcd algorithm
    // [HANDBOOK] - algorithm 14.54
    static func binaryGcd(_ a: Limb, _ b: Limb) -> Limb {
        assert(a > 0)
        assert(b > 0)
        let az = a.trailingZeroBitCount
        let bz = b.trailingZeroBitCount
        var a = a >> az
        var b = b >> bz
        while a != b {
            if a > b {
                a -= b
                a >>= a.trailingZeroBitCount
            } else {
                b -= a
                b >>= b.trailingZeroBitCount
            }
        }
        return a << (az < bz ? az : bz)
    }

    /*
     * Exponentiation
     */
    
    func raisedTo(_ x: Int) -> Limbs {
        if x == 0 {
            return [1]
        }
        if x == 1 {
            return self
        }
        var base = self
        var exponent = x
        var y: Limbs = [1]
        while exponent > 1 {
            if exponent & 1 != 0 {
                y.multiply(base)
            }
            base.square()
            exponent >>= 1
        }
        return base.times(y)
    }
}

