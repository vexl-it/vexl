import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {GetClubInfoErrors} from '@vexl-next/rest-api/src/services/contact/contracts'
import {GetClubInfoEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {DateTime, Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'

export const getClubInfo = Handler.make(GetClubInfoEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const clubsDb = yield* _(ClubsDbService)
      const membersDb = yield* _(ClubMembersDbService)

      const member = yield* _(
        membersDb.findClubMemberByPublicKey({
          publicKey: req.body.publicKey,
        }),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () => new NotFoundError({message: 'Member not found'})
        )
      )

      yield* _(
        membersDb.updateNotificationToken({
          id: member.clubId,
          publicKey: member.publicKey,
          notificationToken: Option.getOrNull(req.body.notificationToken),
        })
      )

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
              detail: 'Club not found. This should not happen',
            })
        )
      )
      return {
        clubInfoForUser: {
          club,
          isModerator: member.isModerator,
        },
      }
    }),
    GetClubInfoErrors
  )
)
