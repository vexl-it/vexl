import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type Atom, atom} from 'jotai'
import {offersAtom} from './offersState'

export const createClubOffersAtom = (
  clubUuid: ClubUuid
): Atom<OneOfferInState[]> =>
  atom((get) =>
    get(offersAtom).filter((one) =>
      one.offerInfo.privatePart.clubIds.includes(clubUuid)
    )
  )
