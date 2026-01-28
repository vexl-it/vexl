import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {OfferId} from '@vexl-next/domain/src/general/offers'
import {HashSet, Schema} from 'effect'

export const ClubStats = Schema.Struct({
  allOffersIdsForClub: Schema.HashSet(OfferId),
  allChatsIdsForClub: Schema.HashSet(ChatId),
})
export type ClubStats = typeof ClubStats.Type

export const ClubWithMembers = Schema.Struct({
  club: ClubInfo,
  vexlNotificationToken: Schema.optionalWith(VexlNotificationToken, {
    as: 'Option',
  }),
  members: Schema.Array(PublicKeyPemBase64),
  isModerator: Schema.Boolean,
  stats: Schema.optionalWith(ClubStats, {
    default: () => ({
      allOffersIdsForClub: HashSet.empty(),
      allChatsIdsForClub: HashSet.empty(),
    }),
  }),
})
export type ClubWithMembers = typeof ClubWithMembers.Type
