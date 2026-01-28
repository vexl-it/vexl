import {HttpApiBuilder} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {MemberAlreadyInClubError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {reportUserJoinedClubAndImportedContacts} from '../../../metrics'
import {UserNotificationService} from '../../../services/UserNotificationService'
import {withClubJoiningActionRedisLock} from '../../../utils/withClubJoiningActionRedisLock'
import {clubHasCapacityForAnotherUser} from '../utils/clubHasCapacityForAnotherUser'

export const joinClub = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsMember',
  'joinClub',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const clubsDb = yield* _(ClubsDbService)
      const membersDb = yield* _(ClubMembersDbService)
      const linksDb = yield* _(ClubInvitationLinkDbService)
      const userNotificationService = yield* _(UserNotificationService)

      const inviteLink = yield* _(
        linksDb.findInvitationLinkByCode({
          code: req.payload.code,
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
              cause: new Error(
                'Club not found by id from invitation link. This should not happen'
              ),
            })
        )
      )

      return yield* _(
        Effect.gen(function* (_) {
          yield* _(clubHasCapacityForAnotherUser(club))
          yield* _(
            membersDb.findClubMemberByPublicKey({
              publicKey: req.payload.publicKey,
            }),
            Effect.filterOrFail(
              Option.isNone,
              () => new MemberAlreadyInClubError()
            )
          )

          const member = yield* _(
            membersDb.insertClubMember({
              clubId: club.id,
              publicKey: req.payload.publicKey,
              isModerator: inviteLink.forAdmin,
              lastRefreshedAt: new Date(),
              notificationToken: Option.getOrNull(
                req.payload.notificationToken
              ),
              vexlNotificationToken: Option.getOrNull(
                req.payload.vexlNotificationToken
              ),
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
            userNotificationService.notifyOthersAboutNewClubUser(
              club.uuid,
              req.payload.publicKey
            )
          )

          yield* _(
            reportUserJoinedClubAndImportedContacts({
              clubUUid: club.uuid,
              contactsImported: req.payload.contactsImported,
              value: 1,
            })
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
        }),
        withClubJoiningActionRedisLock(club.uuid)
      )
    }).pipe(withDbTransaction, makeEndpointEffect)
)
