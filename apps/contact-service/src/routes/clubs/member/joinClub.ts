import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {MemberAlreadyInClubError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option, pipe} from 'effect'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubMemberCountChangeDbService} from '../../../db/ClubMemberCountChangeDbService'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {reportUserJoinedClubAndImportedContacts} from '../../../metrics'
import {UserNotificationService} from '../../../services/UserNotificationService'
import {findClubMemberByPublicKeyV1OrV2} from '../../../utils/findClubMemberByPublicKeyV1OrV2'
import {withClubJoiningActionRedisLock} from '../../../utils/withClubJoiningActionRedisLock'
import {clubHasCapacityForAnotherUser} from '../utils/clubHasCapacityForAnotherUser'

export const joinClub = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsMember',
  'joinClub',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const clubsDb = yield* ClubsDbService
      const membersDb = yield* ClubMembersDbService
      const memberCountChangesDb = yield* ClubMemberCountChangeDbService
      const linksDb = yield* ClubInvitationLinkDbService
      const userNotificationService = yield* UserNotificationService

      const inviteLink = yield* pipe(
        linksDb.findInvitationLinkByCode({
          code: req.payload.code,
        }),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag(
          'NoSuchElementError',
          () =>
            new NotFoundError({
              message: 'Invitation link not found error',
            })
        )
      )

      const club = yield* pipe(
        clubsDb.findClub({
          id: inviteLink.clubId,
        }),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag(
          'NoSuchElementError',
          () =>
            new UnexpectedServerError({
              status: 500,
              cause: new Error(
                'Club not found by id from invitation link. This should not happen'
              ),
            })
        )
      )

      return yield* pipe(
        Effect.gen(function* () {
          yield* clubHasCapacityForAnotherUser(club)
          yield* pipe(
            findClubMemberByPublicKeyV1OrV2(
              Option.getOrElse(
                req.payload.publicKeyV2,
                () => req.payload.publicKey
              )
            ),
            Effect.option,
            Effect.filterOrFail(
              Option.isNone,
              () => new MemberAlreadyInClubError()
            )
          )

          const member = yield* membersDb.insertClubMember({
            clubId: club.id,
            publicKey: req.payload.publicKey,
            publicKeyV2: Option.getOrNull(req.payload.publicKeyV2),
            isModerator: inviteLink.forAdmin,
            lastRefreshedAt: new Date(),
            notificationToken: Option.getOrNull(req.payload.notificationToken),
            vexlNotificationToken: Option.getOrNull(
              req.payload.vexlNotificationToken
            ),
          })

          yield* memberCountChangesDb.incrementJoined({
            clubId: club.id,
            count: 1,
          })

          if (inviteLink.forAdmin) {
            yield* Effect.log('Deleting used invitation link')
            yield* linksDb.deleteInvitationLink({
              id: inviteLink.id,
            })
          }

          yield* userNotificationService.notifyOthersAboutNewClubUser(
            club.uuid,
            Option.getOrElse(
              req.payload.publicKeyV2,
              () => req.payload.publicKey
            )
          )

          yield* reportUserJoinedClubAndImportedContacts({
            clubUUid: club.uuid,
            contactsImported: req.payload.contactsImported,
            value: 1,
            commonMetricAttributes: commonMetricAttributesFromHeaders(
              req.headers
            ),
          })

          return {
            clubInfoForUser: {
              club,
              isModerator: member.isModerator,
              vexlNotificationToken: Option.fromNullishOr(
                member.vexlNotificationToken
              ),
            },
          }
        }),
        withClubJoiningActionRedisLock(club.uuid)
      )
    }).pipe(withDbTransaction, makeEndpointEffect)
)
