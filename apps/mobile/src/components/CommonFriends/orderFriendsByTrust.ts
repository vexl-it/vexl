import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, pipe} from 'effect'

export function orderFriendsByTrust<
  Friend extends {
    readonly computedValues: {readonly hash: HashedPhoneNumber}
  },
>(
  friends: readonly Friend[],
  verifiedHashes: readonly HashedPhoneNumber[],
  enabled: boolean
): {
  readonly trustedFriends: readonly Friend[]
  readonly otherCommonFriends: readonly Friend[]
  readonly sortedFriends: readonly Friend[]
  readonly trustedHashes: ReadonlySet<HashedPhoneNumber>
} {
  const verified = new Set(enabled ? verifiedHashes : [])
  const [otherCommonFriends, trustedFriends] = pipe(
    friends,
    Array.partition((friend) => verified.has(friend.computedValues.hash))
  )
  return {
    trustedFriends,
    otherCommonFriends,
    sortedFriends: Array.appendAll(trustedFriends, otherCommonFriends),
    trustedHashes: new Set(
      pipe(
        trustedFriends,
        Array.map((friend) => friend.computedValues.hash)
      )
    ),
  }
}
