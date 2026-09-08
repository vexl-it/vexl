import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {DateTime, Effect, Option, pipe} from 'effect'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {findClubMemberByPublicKeyV1OrV2} from '../../../utils/findClubMemberByPublicKeyV1OrV2'

export const getClubInfo = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsMember',
  'getClubInfo',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const clubsDb = yield* ClubsDbService
      const membersDb = yield* ClubMembersDbService

      const member = yield* findClubMemberByPublicKeyV1OrV2(
        Option.getOrElse(req.payload.publicKeyV2, () => req.payload.publicKey)
      )

      // todo #2124 - Remove notification token update when fully migrated to VexlNotificationToken
      yield* membersDb.updateNotificationToken({
        id: member.clubId,
        publicKey: member.publicKey,
        notificationToken: Option.getOrNull(req.payload.notificationToken),
      })

      if (Option.isSome(req.payload.vexlNotificationToken)) {
        yield* membersDb.updateVexlNotificationToken({
          id: member.clubId,
          publicKey: member.publicKey,
          vexlNotificationToken: req.payload.vexlNotificationToken.value,
        })
      }

      const club = yield* pipe(
        clubsDb.findClub({
          id: member.clubId,
        }),
        Effect.flatMap(Effect.fromOption),
        Effect.filterOrFail(
          (club) =>
            Option.isNone(club.madeInactiveAt) ||
            (Option.isSome(club.madeInactiveAt) &&
              DateTime.isLessThan(
                DateTime.makeUnsafe(club.madeInactiveAt.value)
              )(DateTime.makeUnsafe(new Date()))),
          () => new NotFoundError({message: 'Club not found'})
        ),
        Effect.catchTag(
          'NoSuchElementError',
          () =>
            new UnexpectedServerError({
              status: 500,
              message: 'Club not found. This should not happen',
            })
        )
      )
      return {
        clubInfoForUser: {
          club,
          isModerator: member.isModerator,
          vexlNotificationToken: Option.fromNullishOr(
            member.vexlNotificationToken
          ),
        },
      }
    }).pipe(makeEndpointEffect)
)
