import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {OfferId} from '@vexl-next/domain/src/general/offers'
import {HashSet, Schema} from 'effect'

export const ClubStats = Schema.Struct({
  allOffersIdsForClub: Schema.HashSet(OfferId),
  allChatsIdsForClub: Schema.HashSet(ChatId),
})
export type ClubStats = typeof ClubStats.Type

// Club member with optional V2 public key
export const ClubMember = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  publicKeyV2: Schema.optionalWith(PublicKeyV2, {
    as: 'Option',
    nullable: true,
  }),
})
export type ClubMember = typeof ClubMember.Type

export const ClubWithMembers = Schema.Struct({
  club: ClubInfo,
  members: Schema.Array(ClubMember),
  isModerator: Schema.Boolean,
  stats: Schema.optionalWith(ClubStats, {
    default: () => ({
      allOffersIdsForClub: HashSet.empty(),
      allChatsIdsForClub: HashSet.empty(),
    }),
  }),
})
export type ClubWithMembers = typeof ClubWithMembers.Type
