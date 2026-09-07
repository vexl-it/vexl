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
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option, pipe} from 'effect'
import {ClubMemberCountChangeDbService} from '../../../db/ClubMemberCountChangeDbService'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {UserNotificationService} from '../../../services/UserNotificationService'
import {withClubJoiningActionRedisLock} from '../../../utils/withClubJoiningActionRedisLock'
import {clubHasCapacityForAnotherUser} from '../utils/clubHasCapacityForAnotherUser'

export const addUserToTheClub = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsModerator',
  'addUserToTheClub',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const clubsDb = yield* ClubsDbService
      const membersDb = yield* ClubMembersDbService
      const memberCountChangesDb = yield* ClubMemberCountChangeDbService
      const userNotificationService = yield* UserNotificationService

      const moderatorMember = yield* pipe(
        membersDb.findClubMemberByPublicKey({publicKey: req.payload.publicKey}),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag(
          'NoSuchElementError',
          () => new NotFoundError({message: 'Member not found'})
        ),
        Effect.filterOrFail(
          (member) => member.isModerator,
          () => new UserIsNotModeratorError()
        )
      )

      const club = yield* pipe(
        clubsDb.findClub({id: moderatorMember.clubId}),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag(
          'NoSuchElementError',
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

      yield* pipe(
        membersDb.findClubMemberByPublicKey({
          publicKey: req.payload.adminitionRequest.publicKey,
        }),
        Effect.filterOrFail(Option.isNone, () => new MemberAlreadyInClubError())
      )

      const newCount = yield* clubHasCapacityForAnotherUser(club)

      yield* membersDb.insertClubMember({
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
        publicKeyV2: req.payload.adminitionRequest.publicKeyV2,
      })

      yield* memberCountChangesDb.incrementJoined({clubId: club.id, count: 1})

      yield* userNotificationService.notifyUserAboutClubAddmission(
        req.payload.adminitionRequest.publicKey
      )

      yield* userNotificationService.notifyOthersAboutNewClubUser(
        club.uuid,
        req.payload.adminitionRequest.publicKey
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
