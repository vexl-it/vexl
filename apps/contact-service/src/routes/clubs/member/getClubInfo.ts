import {HttpApiBuilder} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {DateTime, Effect, Option} from 'effect'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'

export const getClubInfo = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsMember',
  'getClubInfo',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const clubsDb = yield* _(ClubsDbService)
      const membersDb = yield* _(ClubMembersDbService)

      const member = yield* _(
        membersDb.findClubMemberByPublicKey({
          publicKey: req.payload.publicKey,
        }),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () => new NotFoundError({message: 'Member not found'})
        )
      )

      // todo #2124 - Remove notification token update when fully migrated to VexlNotificationToken
      yield* _(
        membersDb.updateNotificationToken({
          id: member.clubId,
          publicKey: member.publicKey,
          notificationToken: Option.getOrNull(req.payload.notificationToken),
        })
      )

      if (Option.isSome(req.payload.vexlNotificationToken)) {
        yield* _(
          membersDb.updateVexlNotificationToken({
            id: member.clubId,
            publicKey: member.publicKey,
            vexlNotificationToken: req.payload.vexlNotificationToken.value,
          })
        )
      }

      const club = yield* _(
        clubsDb.findClub({
          id: member.clubId,
        }),
        Effect.flatten,
        Effect.filterOrFail(
          (club) =>
            Option.isNone(club.madeInactiveAt) ||
            (Option.isSome(club.madeInactiveAt) &&
              DateTime.lessThan(DateTime.unsafeMake(club.madeInactiveAt.value))(
                DateTime.unsafeMake(new Date())
              )),
          () => new NotFoundError({message: 'Club not found'})
        ),
        Effect.catchTag(
          'NoSuchElementException',
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
          vexlNotificationToken: Option.fromNullable(
            member.vexlNotificationToken
          ),
        },
      }
    }).pipe(makeEndpointEffect)
)
