import {
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Array, Record} from 'effect'
import {subtractArrays} from '../utils/array'

type PublicKey = PublicKeyPemBase64 | PublicKeyV2

export interface OfferConnections {
  readonly firstLevel: readonly PublicKey[]
  readonly secondLevel: readonly PublicKey[]
  readonly clubs: Record<ClubUuid, readonly PublicKey[]>
}

export function planPrivatePartsUpdate({
  currentConnections,
  targetConnections,
  connectionsToRefresh = [],
}: {
  readonly currentConnections: OfferConnections
  readonly targetConnections: OfferConnections
  readonly connectionsToRefresh?: readonly PublicKeyV2[]
}): {
  readonly newConnections: OfferConnections
  readonly encryptionCandidates: ReadonlySet<PublicKey>
} {
  const newConnections: OfferConnections = {
    firstLevel: subtractArrays(
      targetConnections.firstLevel,
      currentConnections.firstLevel
    ),
    secondLevel: subtractArrays(
      targetConnections.secondLevel,
      currentConnections.secondLevel
    ),
    clubs: Record.map(targetConnections.clubs, (members, clubUuid) =>
      subtractArrays(members, currentConnections.clubs[clubUuid] ?? [])
    ),
  }
  const encryptionCandidates = new Set([
    ...newConnections.firstLevel,
    ...newConnections.secondLevel,
    ...Array.flatten(Record.values(newConnections.clubs)),
    ...connectionsToRefresh,
  ])
  return {newConnections, encryptionCandidates}
}
