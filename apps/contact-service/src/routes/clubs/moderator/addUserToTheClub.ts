import {HttpApiBuilder} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  type AddUserToTheClubResponse,
  MemberAlreadyInClubError,
  UserIsNotModeratorError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {UserNotificationService} from '../../../services/UserNotificationService'
import {withClubJoiningActionRedisLock} from '../../../utils/withClubJoiningActionRedisLock'
import {clubHasCapacityForAnotherUser} from '../utils/clubHasCapacityForAnotherUser'

export const addUserToTheClub = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsModerator',
  'addUserToTheClub',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const clubsDb = yield* _(ClubsDbService)
      const membersDb = yield* _(ClubMembersDbService)
      const userNotificationService = yield* _(UserNotificationService)

      const moderatorMember = yield* _(
        membersDb.findClubMemberByPublicKey({publicKey: req.payload.publicKey}),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () => new NotFoundError({message: 'Member not found'})
        ),
        Effect.filterOrFail(
          (member) => member.isModerator,
          () => new UserIsNotModeratorError()
        )
      )

      const club = yield* _(
        clubsDb.findClub({id: moderatorMember.clubId}),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () =>
            new UnexpectedServerError({
              status: 500,
              message: 'Club not found. This should not happen',
            })
        ),
        Effect.filterOrFail(
          (club) => club.uuid === req.payload.clubUuid,
          () => new NotFoundError({message: 'Club not found'})
        )
      )

      yield* _(
        membersDb.findClubMemberByPublicKey({
          publicKey: req.payload.adminitionRequest.publicKey,
        }),
        Effect.filterOrFail(Option.isNone, () => new MemberAlreadyInClubError())
      )

      const newCount = yield* _(clubHasCapacityForAnotherUser(club))

      yield* _(
        membersDb.insertClubMember({
          clubId: club.id,
          publicKey: req.payload.adminitionRequest.publicKey,
          isModerator: false,
          lastRefreshedAt: new Date(),
          notificationToken: Option.getOrNull(
            req.payload.adminitionRequest.notificationToken
          ),
          vexlNotificationToken: Option.getOrNull(
            req.payload.adminitionRequest.vexlNotificationToken
          ),
        })
      )

      yield* _(
        userNotificationService.notifyUserAboutClubAddmission(
          req.payload.adminitionRequest.publicKey
        )
      )

      yield* _(
        userNotificationService.notifyOthersAboutNewClubUser(
          club.uuid,
          req.payload.adminitionRequest.publicKey
        )
      )

      return {
        newCount,
      } satisfies AddUserToTheClubResponse
    }).pipe(
      withDbTransaction,
      withClubJoiningActionRedisLock(req.payload.clubUuid),
      makeEndpointEffect
    )
)
