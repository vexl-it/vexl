import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {type OfferConnections} from '@vexl-next/resources-utils/src/offers/planPrivatePartsUpdate'
import {Array, pipe, Record} from 'effect'
import {type ClubWithMembers} from '../../clubs/domain'
import {type ConnectionsState} from '../domain'

export function getOfferTargetConnections({
  offer,
  connectionState,
  clubs,
  intendedClubs = offer?.ownershipInfo?.intendedClubs ?? [],
  intendedConnectionLevel = offer?.ownershipInfo?.intendedConnectionLevel ??
    'ALL',
}: {
  readonly offer: OneOfferInState | undefined
  readonly connectionState: ConnectionsState
  readonly clubs: readonly ClubWithMembers[]
  readonly intendedClubs?: readonly ClubUuid[]
  readonly intendedConnectionLevel?: IntendedConnectionLevel
}): {
  readonly connectionLevel: IntendedConnectionLevel
  readonly targetConnections: OfferConnections
} {
  return {
    connectionLevel: intendedConnectionLevel,
    targetConnections: {
      firstLevel: connectionState.firstLevel,
      secondLevel:
        intendedConnectionLevel === 'ALL' ? connectionState.secondLevel : [],
      clubs: pipe(
        clubs,
        Array.filter((one) => Array.contains(intendedClubs, one.club.uuid)),
        Array.map(({club, members}): [ClubUuid, ClubWithMembers['members']] => [
          club.uuid,
          members,
        ]),
        Record.fromEntries
      ),
    },
  }
}
