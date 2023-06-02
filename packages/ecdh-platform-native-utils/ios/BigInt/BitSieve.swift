//
//  BitSieve.swift
//  BigInt
//
//  Created by Leif Ibsen on 15/11/2018.
//  Copyright © 2018 Leif Ibsen. All rights reserved.
//

/*
 * BitSieve class from Java BigInteger translated to Swift
 */
class BitSieve {
    
    var bits: [UInt64]
    let length: Int
    let base: BInt
    let prob: Int

    static let smallSieve = BitSieve()

    init() {
        self.length = 150 * 64
        self.bits = [UInt64](repeating: 0, count: ((length - 1) >> 6) + 1)
        self.base = BInt.ZERO
        self.prob = 0

        // Mark 1 as composite
        set(0)
        var nextIndex = 1
        var nextPrime = 3
        var more = true
        
        // Find primes and remove their multiples from sieve
        repeat {
            sieveSingle(self.length, nextIndex + nextPrime, nextPrime)
            (nextIndex, more) = sieveSearch(self.length, nextIndex + 1)
            nextPrime = nextIndex << 1 + 1
        } while more && (nextPrime < self.length)
    }

    /**
     * Construct a bit sieve of searchLen bits used for finding prime number
     * candidates. The new sieve begins at the specified base, which must
     * be even.
     */
    init(_ base: BInt, _ prob: Int) {
    /*
     * Candidates are indicated by clear bits in the sieve. As a candidates
     * nonprimality is calculated, a bit is set in the sieve to eliminate
     * it. To reduce storage space and increase efficiency, no even numbers
     * are represented in the sieve (each bit in the sieve represents an
     * odd number).
     */
        self.base = base
        self.length = 16 * base.bitWidth
        self.bits = [UInt64](repeating: 0, count: ((self.length - 1) >> 6) + 1)
        self.prob = prob
        var start = 0
    
        var (step, more) = BitSieve.smallSieve.sieveSearch(BitSieve.smallSieve.length, start)
        var convertedStep = step << 1 + 1

        // Construct the large sieve at an even offset specified by base
        repeat {
            // Calculate base mod convertedStep
            let (_, r) = self.base.magnitude.divMod(UInt64(convertedStep))
            start = Int(r)

            // Take each multiple of step out of sieve
            start = convertedStep - start
            if start & 1 == 0 {
                start += convertedStep
            }
            sieveSingle(self.length, (start - 1) >> 1, convertedStep)
    
            // Find next prime from small sieve
            (step, more) = BitSieve.smallSieve.sieveSearch(BitSieve.smallSieve.length, step + 1)
            convertedStep = step << 1 + 1
        } while more
    }
    
    /**
     * Get the value of the bit at the specified index.
     */
    func get(_ bitIndex: Int) -> Bool {
        return (self.bits[bitIndex >> 6] & Limbs.UMasks[bitIndex & 0x3f]) != 0
    }
    
    /**
     * Set the bit at the specified index.
     */
    func set(_ bitIndex: Int) {
        self.bits[bitIndex >> 6] |= Limbs.UMasks[bitIndex & 0x3f]
    }
    
    /**
     * This method returns the index of the first clear bit in the search
     * array that occurs at or after start. It will not search past the
     * specified limit. It returns false if there is no such clear bit.
     */
    func sieveSearch(_ limit: Int, _ start: Int) -> (Int, Bool) {
        if start >= limit {
            return (0, false)
        }
        var index = start
        repeat {
            if !get(index) {
                return (index, true)
            }
            index += 1
        } while index < limit - 1
        return (0, false)
    }
    
    /**
     * Sieve a single set of multiples out of the sieve. Begin to remove
     * multiples of the specified step starting at the specified start index,
     * up to the specified limit.
     */
    func sieveSingle(_ limit: Int, _ start: Int, _ step: Int) {
        var x = start
        while x < limit {
            set(x)
            x += step
        }
    }
    
    /**
     * Test probable primes in the sieve and return successful candidates.
     */
    func retrieve() -> BInt? {
        // Examine the sieve one word at a time to find possible primes
        var offset = 1
        for i in 0 ..< bits.count {
            let nextWord = ~bits[i]
            for j in 0 ..< 64 {
                if nextWord & Limbs.UMasks[j] != 0 {
                    let candidate = self.base + offset
                    if candidate.isProbablyPrime(prob) {
                        return candidate
                    }
                }
                offset += 2
            }
        }
        return nil
    }

}
