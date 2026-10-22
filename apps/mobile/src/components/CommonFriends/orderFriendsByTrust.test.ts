import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, Schema, pipe} from 'effect'
import {orderFriendsByTrust} from './orderFriendsByTrust'

const hash = Schema.decodeSync(HashedPhoneNumber)
const friends = pipe(
  ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  Array.map((value) => ({computedValues: {hash: hash(value)}}))
)
const hashes = (values: typeof friends): readonly string[] =>
  pipe(
    values,
    Array.map((friend) => friend.computedValues.hash)
  )

describe('orderFriendsByTrust', () => {
  it('keeps trusted friends ahead of the five-chip cut and preserves group order', () => {
    const result = orderFriendsByTrust(friends, [hash('g'), hash('b')], true)
    expect(hashes(Array.take(result.sortedFriends, 5))).toEqual([
      'b',
      'g',
      'a',
      'c',
      'd',
    ])
    expect(hashes(Array.fromIterable(result.otherCommonFriends))).toEqual([
      'a',
      'c',
      'd',
      'e',
      'f',
    ])
    expect(result.trustedHashes.size).toBe(2)
  })

  it('does not mark or reorder friends with the feature disabled', () => {
    const result = orderFriendsByTrust(friends, [hash('g'), hash('b')], false)
    expect(result.sortedFriends).toEqual(friends)
    expect(result.trustedFriends).toEqual([])
    expect(result.trustedHashes.size).toBe(0)
  })

  it('ignores unknown hashes and repeated trust entries', () => {
    const result = orderFriendsByTrust(
      friends,
      [hash('unknown'), hash('b'), hash('b')],
      true
    )
    expect(hashes(Array.fromIterable(result.trustedFriends))).toEqual(['b'])
    expect(result.trustedHashes.size).toBe(1)
    expect(orderFriendsByTrust([], [hash('b')], true).sortedFriends).toEqual([])
  })
})
