import {OfferIdHashed} from '@vexl-next/domain/src/general/clubs'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  ReportClubErrors,
  ReportClubLimitReachedError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ReportClubEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect, Option, Schema} from 'effect'
import {Handler} from 'effect-http'
import {clubReportLimistCount} from '../../../configs'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {deactivateAndClearClubs} from '../../../internalServer/routes/deactivateAndClearClubs'
import {reportClubDeactivated, reportClubReported} from '../../../metrics'

export const reportClub = Handler.make(ReportClubEndpoint, (req, security) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const clubsDb = yield* _(ClubsDbService)
      const membersDb = yield* _(ClubMembersDbService)
      const reportLimitCount = yield* _(clubReportLimistCount)

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

      const club = yield* _(
        clubsDb.findClubByUuid({
          uuid: req.body.clubUuid,
        }),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () =>
            new NotFoundError({
              message: 'Club not found',
            })
        ),
        Effect.filterOrFail(
          (club) => club.id === member.clubId,
          () => new NotFoundError({message: 'Club not found'})
        )
      )

      const numberOfReportsForUser = yield* _(
        membersDb.queryNumberOfClubReportsForUser(security['public-key'])
      )

      if (numberOfReportsForUser >= reportLimitCount) {
        return yield* _(Effect.fail(new ReportClubLimitReachedError()))
      }

      const offerIdHashed = yield* _(
        hashSha256(req.body.offerId),
        Effect.flatMap(Schema.decode(OfferIdHashed)),
        Effect.catchAll(
          (e) =>
            new UnexpectedServerError({
              status: 500,
              cause: e,
              detail: 'Error while hashing offerId for club report',
            })
        )
      )

      const clubAlreadyReportedByThisOffer = yield* _(
        clubsDb.findReportInfoForOfferIdHashed(offerIdHashed),
        Effect.map(
          Option.match({
            onNone: () => false,
            onSome: () => true,
          })
        )
      )

      if (clubAlreadyReportedByThisOffer) return {}

      yield* _(
        clubsDb.insertClubOfferReportedInfo({
          offerId: offerIdHashed,
          clubUuid: club.uuid,
          reportedAt: new Date(),
        })
      )

      yield* _(clubsDb.reportClub({clubUuid: club.uuid}))

      yield* _(
        membersDb.insertClubReportedRecord({
          userPublicKey: security['public-key'],
          reportedAt: new Date(),
        })
      )

      yield* _(reportClubReported(1))

      const reportedClub = yield* _(clubsDb.findClubByUuid({uuid: club.uuid}))

      if (
        Option.isSome(reportedClub) &&
        reportedClub.value.report >= club.reportLimit
      ) {
        yield* _(deactivateAndClearClubs)
        yield* _(reportClubDeactivated(1))
      }

      return {}
    }),
    ReportClubErrors
  )
)
