import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {OfferId} from '@vexl-next/domain/src/general/offers'
import {Effect, HashSet, Option, Schema} from 'effect'

export const ClubStats = Schema.Struct({
  allOffersIdsForClub: Schema.toCodecJson(Schema.HashSet(OfferId)),
  allChatsIdsForClub: Schema.toCodecJson(Schema.HashSet(ChatId)),
})
export type ClubStats = typeof ClubStats.Type

export const ClubWithMembers = Schema.Struct({
  club: ClubInfo,
  vexlNotificationToken: Schema.OptionFromOptional(VexlNotificationToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  members: Schema.Array(Schema.Union([PublicKeyPemBase64, PublicKeyV2])),
  isModerator: Schema.Boolean,
  stats: ClubStats.pipe(
    Schema.withDecodingDefaultType(
      Effect.sync(() => ({
        allOffersIdsForClub: HashSet.empty(),
        allChatsIdsForClub: HashSet.empty(),
      }))
    ),
    Schema.withConstructorDefault(
      Effect.sync(() => ({
        allOffersIdsForClub: HashSet.empty(),
        allChatsIdsForClub: HashSet.empty(),
      }))
    )
  ),
})
export type ClubWithMembers = typeof ClubWithMembers.Type
