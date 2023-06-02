//
//  Factorial.swift
//  BigIntTest
//
//  Created by Leif Ibsen on 19/05/2022.
//

// SplitRecursive algorithm from https://www.luschny.de

class Factorial {
    
    static let smallFacs: [Int] = [
        1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800,
        479001600, 6227020800, 87178291200, 1307674368000, 20922789888000,
        355687428096000, 6402373705728000, 121645100408832000, 2432902008176640000]

    var N: Limbs = [1]
    var result = BInt.ZERO
    
    init(_ n: Int) {
        self.result = n < Factorial.smallFacs.count ? BInt(Factorial.smallFacs[n]) : compute(n)
    }
    
    func compute(_ n: Int) -> BInt {
        var p: Limbs = [1]
        var r: Limbs = [1]
        var h = 0
        var pow2 = 0
        var high = 1
        var width = 63 - n.leadingZeroBitCount
        while h != n {
            pow2 += h
            h = n >> width
            width -= 1
            var len = high
            high = (h - 1) | 1
            len = (high - len) >> 1
            if len > 0 {
                p.multiply(product(len))
                r.multiply(p)
            }
        }
        return BInt(r.shiftedLeft(pow2))
    }
    
    func product(_ n: Int) -> Limbs {
        let m = n >> 1
        if m == 0 {
            self.N.add(2)
            return self.N
        } else if n == 2 {
            self.N.add(2)
            var x = self.N
            self.N.add(2)
            x.multiply(self.N)
            return x
        } else {
            var p1 = product(n - m)
            p1.multiply(product(m))
            return p1
        }
    }
}

