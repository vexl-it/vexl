import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  JoinClubErrors,
  MemberAlreadyInClubError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {JoinClubEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {reportUserJoinedClubAndImportedContacts} from '../../../metrics'
import {NewClubUserNotificationsService} from '../../../utils/NewClubUserNotificationService'
import {withClubJoiningActionRedisLock} from '../../../utils/withClubJoiningActionRedisLock'
import {clubHasCapacityForAnotherUser} from '../utils/clubHasCapacityForAnotherUser'

export const joinClub = Handler.make(JoinClubEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const clubsDb = yield* _(ClubsDbService)
      const membersDb = yield* _(ClubMembersDbService)
      const linksDb = yield* _(ClubInvitationLinkDbService)

      const inviteLink = yield* _(
        linksDb.findInvitationLinkByCode({
          code: req.body.code,
        }),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () =>
            new NotFoundError({
              message: 'Invitation link not found error',
            })
        )
      )

      const club = yield* _(
        clubsDb.findClub({
          id: inviteLink.clubId,
        }),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () =>
            new UnexpectedServerError({
              status: 500,
              detail:
                'Club not found by id from invitation link. This should not happen',
            })
        )
      )

      return yield* _(
        Effect.gen(function* (_) {
          yield* _(clubHasCapacityForAnotherUser(club))
          yield* _(
            membersDb.findClubMemberByPublicKey({
              publicKey: req.body.publicKey,
            }),
            Effect.filterOrFail(
              Option.isNone,
              () => new MemberAlreadyInClubError()
            )
          )

          const member = yield* _(
            membersDb.insertClubMember({
              clubId: club.id,
              publicKey: req.body.publicKey,
              isModerator: inviteLink.forAdmin,
              lastRefreshedAt: new Date(),
              notificationToken: Option.getOrNull(req.body.notificationToken),
            })
          )

          if (inviteLink.forAdmin) {
            yield* _(Effect.log('Deleting used invitation link'))
            yield* _(
              linksDb.deleteInvitationLink({
                id: inviteLink.id,
              })
            )
          }

          yield* _(
            NewClubUserNotificationsService,
            Effect.flatMap((s) =>
              s.registerNewClubNotification({
                clubUuid: club.uuid,
                triggeringUser: req.body.publicKey,
              })
            )
          )

          yield* _(
            reportUserJoinedClubAndImportedContacts({
              clubUUid: club.uuid,
              contactsImported: req.body.contactsImported,
              value: 1,
            })
          )

          return {
            clubInfoForUser: {
              club,
              isModerator: member.isModerator,
            },
          }
        }),
        withClubJoiningActionRedisLock(club.uuid)
      )
    }),
    JoinClubErrors
  ).pipe(withDbTransaction)
)
