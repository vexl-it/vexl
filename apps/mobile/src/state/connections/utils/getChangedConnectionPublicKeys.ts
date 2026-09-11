import {
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {Array, HashMap, Option} from 'effect'
import {type ConnectionsState} from '../domain'

type PublicKey = PublicKeyPemBase64 | PublicKeyV2
type ConnectionSnapshot = Pick<
  ConnectionsState,
  'firstLevel' | 'secondLevel' | 'commonFriends' | 'verifiedFriends'
>

function sameMembers<T>(left: readonly T[], right: readonly T[]): boolean {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  return (
    leftSet.size === rightSet.size &&
    Array.every(left, (value) => rightSet.has(value))
  )
}

export function getChangedConnectionPublicKeys(
  previous: ConnectionSnapshot,
  next: ConnectionSnapshot
): PublicKey[] {
  const previousFirstLevelConnections = new Set(previous.firstLevel)
  const previousSecondLevelConnections = new Set(previous.secondLevel)
  const nextFirstLevelConnections = new Set(next.firstLevel)
  const nextSecondLevelConnections = new Set(next.secondLevel)
  const publicKeys = new Set([
    ...previous.firstLevel,
    ...previous.secondLevel,
    ...next.firstLevel,
    ...next.secondLevel,
    ...HashMap.keys(previous.commonFriends),
    ...HashMap.keys(next.commonFriends),
    ...HashMap.keys(previous.verifiedFriends),
    ...HashMap.keys(next.verifiedFriends),
  ])
  return Array.filter(
    Array.fromIterable(publicKeys),
    (key) =>
      previousFirstLevelConnections.has(key) !==
        nextFirstLevelConnections.has(key) ||
      (!nextFirstLevelConnections.has(key) &&
        previousSecondLevelConnections.has(key) !==
          nextSecondLevelConnections.has(key)) ||
      !sameMembers(
        Option.getOrElse(HashMap.get(previous.commonFriends, key), () => []),
        Option.getOrElse(HashMap.get(next.commonFriends, key), () => [])
      ) ||
      !sameMembers(
        Option.getOrElse(HashMap.get(previous.verifiedFriends, key), () => []),
        Option.getOrElse(HashMap.get(next.verifiedFriends, key), () => [])
      )
  )
}
