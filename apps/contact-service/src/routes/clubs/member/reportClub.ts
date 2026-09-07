import {OfferIdHashed} from '@vexl-next/domain/src/general/clubs'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ReportClubLimitReachedError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect, Option, pipe, Schema} from 'effect'
import {clubReportLimistCount} from '../../../configs'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {deactivateAndClearClubs} from '../../../internalServer/routes/deactivateAndClearClubs'
import {reportClubDeactivated, reportClubReported} from '../../../metrics'
import {findClubMemberByPublicKeyV1OrV2} from '../../../utils/findClubMemberByPublicKeyV1OrV2'

export const reportClub = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsMember',
  'reportClub',
  (req) =>
    Effect.gen(function* () {
      const commonMetricAttributes = commonMetricAttributesFromHeaders(
        req.headers
      )
      yield* validateChallengeInBody(req.payload)
      const security = yield* CurrentSecurity

      const clubsDb = yield* ClubsDbService
      const membersDb = yield* ClubMembersDbService
      const reportLimitCount = yield* clubReportLimistCount

      const member = yield* findClubMemberByPublicKeyV1OrV2(
        Option.getOrElse(req.payload.publicKeyV2, () => req.payload.publicKey)
      )

      const club = yield* pipe(
        clubsDb.findClubByUuid({
          uuid: req.payload.clubUuid,
        }),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag(
          'NoSuchElementError',
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

      const numberOfReportsForUser =
        yield* membersDb.queryNumberOfClubReportsForUser(security.publicKey)

      if (numberOfReportsForUser >= reportLimitCount) {
        return yield* Effect.fail(new ReportClubLimitReachedError())
      }

      const offerIdHashed = yield* pipe(
        hashSha256(req.payload.offerId),
        Effect.flatMap(Schema.decodeEffect(OfferIdHashed)),
        Effect.catch(
          (e) =>
            new UnexpectedServerError({
              status: 500,
              cause: e,
              message: 'Error while hashing offerId for club report',
            })
        )
      )

      const clubAlreadyReportedByThisOffer = yield* pipe(
        clubsDb.findReportInfoForOfferIdHashed(offerIdHashed),
        Effect.map(
          Option.match({
            onNone: () => false,
            onSome: () => true,
          })
        )
      )

      if (clubAlreadyReportedByThisOffer) return {}

      yield* clubsDb.insertClubOfferReportedInfo({
        offerId: offerIdHashed,
        clubUuid: club.uuid,
        reportedAt: new Date(),
      })

      yield* clubsDb.reportClub({clubUuid: club.uuid})

      yield* membersDb.insertClubReportedRecord({
        userPublicKey: security.publicKey,
        reportedAt: new Date(),
      })

      yield* reportClubReported(1, commonMetricAttributes)

      const reportedClub = yield* clubsDb.findClubByUuid({uuid: club.uuid})

      if (
        Option.isSome(reportedClub) &&
        reportedClub.value.report >= club.reportLimit
      ) {
        yield* deactivateAndClearClubs
        yield* reportClubDeactivated(1, commonMetricAttributes)
      }

      return {}
    }).pipe(makeEndpointEffect)
)
