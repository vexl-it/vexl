import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type Option} from 'effect'
import {type Atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {useMemo} from 'react'
import {singleClubAtom} from '../../state/clubs/atom/clubsWithMembersAtom'
import {type ClubWithMembers} from '../../state/clubs/domain'
import {createClubOffersAtom} from '../../state/marketplace/atoms/clubOffersAtom'

export function useClubOffersAtoms(clubUuid: ClubUuid): {
  clubOffersAtom: Atom<OneOfferInState[]>
  clubOfferAtomAtoms: Atom<Array<Atom<OneOfferInState>>>
  singleClubAtom: Atom<Option.Option<ClubWithMembers>>
} {
  return useMemo(() => {
    const clubOffersAtom = createClubOffersAtom(clubUuid)
    const clubOfferAtomAtoms = splitAtom(clubOffersAtom)

    return {
      clubOffersAtom,
      clubOfferAtomAtoms,
      singleClubAtom: singleClubAtom(clubUuid),
    }
  }, [clubUuid])
}
