//
//  FFT.swift
//  BigIntTest
//
//  Created by Leif Ibsen on 17/10/2021.
//

// Helper structure for arithmetic modulo N = 2^n + 1
struct Fermat {

    let n: Int
    let N: Limbs
    let k: Int
    let K: Int
    let m: Int
    let theta: Int
    
    // bw = product bitwidth
    init(_ bw: Int) {
        let logBw = 64 - bw.leadingZeroBitCount
        self.k = (logBw - 6) >> 1
        self.K = 1 << self.k
        self.m = 1 << (logBw - 6 - self.k)
        self.n = (((2 << logBw) >> self.k + self.k) >> self.k + 1) << self.k
        var x = Limbs([1]).shiftedLeft(self.n)
        x.setBitAt(0)
        self.N = x
        self.theta = self.n >> self.k
        assert(self.n >= (2 << logBw) >> self.k + self.k)
        assert(self.n % self.K == 0)
        assert(self.n % 64 == 0)
    }

    // Reduce modulo self.N
    func reduce(_ x: inout Limbs) {
        let limbSize = self.N.count - 1
        if x.count > limbSize {
            var k1 = 0
            var k2 = Swift.min(x.count, limbSize)
            var positive = Limbs(x[k1 ..< k2])
            var negative = Limbs(repeating: 0, count: k2)
            var subtract = true
            while k2 < x.count {
                k1 = k2
                k2 = Swift.min(x.count, k2 + limbSize)
                if subtract {
                    negative = addReduce(negative, Limbs(x[k1 ..< k2]))
                } else {
                    positive = addReduce(positive, Limbs(x[k1 ..< k2]))
                }
                subtract = !subtract
            }
            x = subReduce(positive, negative)
        }
    }

    // Add modulo self.N
    func addReduce(_ a: Limbs, _ b: Limbs) -> Limbs {
        assert(a.compare(self.N) < 0)
        assert(b.compare(self.N) < 0)
        var x = a
        x.add(b)
        if x.compare(self.N) >= 0 {
            _ = x.subtract(self.N, 0)
        }
        x.normalize()
        return x
    }

    // Subtract modulo self.N
    func subReduce(_ a: Limbs, _ b: Limbs) -> Limbs {
        assert(a.compare(self.N) < 0)
        assert(b.compare(self.N) < 0)
        var x = a
        if x.compare(b) < 0 {
            x.add(self.N)
        }
        _ = x.subtract(b, 0)
        x.normalize()
        return x
    }

    // Shift left by i and reduce modulo self.N
    func shiftReduce(_ x: inout Limbs, _ i: Int) {
        assert(x.compare(self.N) < 0)
        assert(i >= 0)
        if i > 0 {
            let (q, r) = i.quotientAndRemainder(dividingBy: self.n)
            x.shiftLeft(r)
            reduce(&x)
            if q & 1 == 1 && !x.equalTo(0) {
                _ = x.difference(self.N)
            }
            x.normalize()
        }
    }

    static func bitReversal(_ x: Int, _ size: Int) -> Int {
        var rev = 0
        let n = size.trailingZeroBitCount
        var mask1 = 1
        var mask2 = 1 << n
        for _ in 0 ..< n {
            mask2 >>= 1
            if x & mask1 != 0 {
                rev |= mask2
            }
            mask1 <<= 1
        }
        return rev
    }

    /*
     * [BRENT] - algorithm 2.2
     */
    func forwardFFT(_ a: inout [Limbs], _ w: Int, _ level: Int,  _ start: Int) {
        assert(a.count == self.K)
        let size = self.K >> level
        let step = 1 << level
        if size == 2 {
            (a[start], a[start + step]) = (addReduce(a[start], a[start + step]), subReduce(a[start], a[start + step]))
        } else {
            let size2 = size >> 1
            self.forwardFFT(&a, w << 1, level + 1, start)
            self.forwardFFT(&a, w << 1, level + 1, start + step)
            for i in 0 ..< size2 {
                let i2 = start + i * step * 2
                let br = Fermat.bitReversal(i, size2)
                var odd = a[i2 + step]
                shiftReduce(&odd, w * br)
                (a[i2], a[i2 + step]) = (addReduce(a[i2], odd), subReduce(a[i2], odd))
            }
        }
    }

    /*
     * [BRENT] - algorithm 2.3
     */
    func backwardFFT(_ a: inout [Limbs], _ w: Int, _ level: Int, _ start: Int) {
        assert(a.count == self.K)
        let size = self.K >> level
        if size == 2 {
            (a[start], a[start + 1]) = (addReduce(a[start], a[start + 1]), subReduce(a[start], a[start + 1]))
        } else {
            let size2 = size >> 1
            self.backwardFFT(&a, w << 1, level + 1, start)
            self.backwardFFT(&a, w << 1, level + 1, start + size2)
            for i in 0 ..< size2 {
                let i2 = i + start
                var high = a[i2 + size2]
                shiftReduce(&high, w * (size - i))
                (a[i2], a[i2 + size2]) = (addReduce(a[i2], high), subReduce(a[i2], high))
            }
        }
    }

}

/*
 * FFT multiplication - Schönhage-Strassen algorithm
 */
extension Array where Element == Limb {

    /*
     * Multiply self by x
     * [BRENT] - algorithm 2.4
     */
    func fftTimes(_ x: Limbs) -> Limbs {
        let fmt = Fermat(self.bitWidth + x.bitWidth)
        var a = [Limbs](repeating: [0], count: fmt.K)
        var from = 0
        var i = 0
        var t = 0
        while from < self.count {
            let to = Swift.min(from + fmt.m, self.count)
            a[i] = Limbs(self[from ..< to])
            fmt.shiftReduce(&a[i], t)
            from += fmt.m
            i += 1
            t += fmt.theta
        }
        var b = [Limbs](repeating: [0], count: fmt.K)
        from = 0
        i = 0
        t = 0
        while from < x.count {
            let to = Swift.min(from + fmt.m, x.count)
            b[i] = Limbs(x[from ..< to])
            fmt.shiftReduce(&b[i], t)
            from += fmt.m
            i += 1
            t += fmt.theta
        }
        let w = fmt.theta << 1
        fmt.forwardFFT(&a, w, 0, 0)
        fmt.forwardFFT(&b, w, 0, 0)
        for i in 0 ..< fmt.K {
            a[i].multiply(b[i])
            fmt.reduce(&a[i])
        }
        fmt.backwardFFT(&a, w, 0, 0)
        return finalize(&a, fmt)
    }

    /*
     * Square self
     */
    func fftSquare() -> Limbs {
        let fmt = Fermat(self.bitWidth * 2)
        var a = [Limbs](repeating: [0], count: fmt.K)
        var from = 0
        var i = 0
        var t = 0
        while from < self.count {
            let to = Swift.min(from + fmt.m, self.count)
            a[i] = Limbs(self[from ..< to])
            fmt.shiftReduce(&a[i], t)
            from += fmt.m
            i += 1
            t += fmt.theta
        }
        let w = fmt.theta << 1
        fmt.forwardFFT(&a, w, 0, 0)
        for i in 0 ..< fmt.K {
            a[i].square()
            fmt.reduce(&a[i])
        }
        fmt.backwardFFT(&a, w, 0, 0)
        return finalize(&a, fmt)
    }

    func finalize(_ c: inout [Limbs], _ fmt: Fermat) -> Limbs {
        let m2 = fmt.m << 1
        var C = Limbs(repeating: 0, count: fmt.m * fmt.K)
        var corrections = Limbs(repeating: 0, count: fmt.m * fmt.K)
        var anyCorrections = false
        var t = 2 * fmt.n - fmt.k
        var offset = 0
        for i in 0 ..< fmt.K {
            fmt.shiftReduce(&c[i], t)
            t -= fmt.theta
            if c[i].count > m2 + 1 || (c[i].count == m2 + 1 && c[i][m2] > i) {
                corrections.add(fmt.N, offset)
                anyCorrections = true
            }
            C.add(c[i], offset)
            offset += fmt.m
        }
        if anyCorrections {
            _ = C.subtract(corrections, 0)
        }
        return C
    }

}
