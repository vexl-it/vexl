import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {ChatIdE} from '@vexl-next/domain/src/general/messaging'
import {OfferIdE} from '@vexl-next/domain/src/general/offers'
import {HashSet, Schema} from 'effect'

export const ClubStats = Schema.Struct({
  allOffersIdsForClub: Schema.HashSet(OfferIdE),
  allChatsIdsForClub: Schema.HashSet(ChatIdE),
})
export type ClubStats = typeof ClubStats.Type

export const ClubWithMembers = Schema.Struct({
  club: ClubInfo,
  members: Schema.Array(PublicKeyPemBase64E),
  isModerator: Schema.Boolean,
  stats: Schema.optionalWith(ClubStats, {
    default: () => ({
      allOffersIdsForClub: HashSet.empty(),
      allChatsIdsForClub: HashSet.empty(),
    }),
  }),
})
export type ClubWithMembers = typeof ClubWithMembers.Type
