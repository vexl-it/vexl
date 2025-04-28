import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  ClubAlreadyReportedError,
  ReportClubErrors,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ReportClubEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {reportClubLimitCountConfig} from '../../../configs'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {deactivateAndClearClubs} from '../../../internalServer/routes/deactivateAndClearClubs'

export const reportClub = Handler.make(ReportClubEndpoint, (req, security) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const clubsDb = yield* _(ClubsDbService)
      const membersDb = yield* _(ClubMembersDbService)
      const reportClubLimitCount = yield* _(reportClubLimitCountConfig)

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

      const clubAlreadyReportedByThisUser = yield* _(
        clubsDb.listUserIdsForReportedClubOffer(req.body.offerId),
        Effect.map(
          Array.some((publicKey) => publicKey === security['public-key'])
        )
      )

      if (clubAlreadyReportedByThisUser)
        return yield* _(Effect.fail(new ClubAlreadyReportedError()))

      yield* _(
        clubsDb.insertClubOfferReportedBy({
          offerId: req.body.offerId,
          userPublicKey: security['public-key'],
        })
      )

      yield* _(clubsDb.reportClub({clubUuid: club.uuid}))

      const reportedClub = yield* _(clubsDb.findClubByUuid({uuid: club.uuid}))

      if (
        Option.isSome(reportedClub) &&
        reportedClub.value.report >= reportClubLimitCount
      ) {
        yield* _(deactivateAndClearClubs)
      }

      return {}
    }),
    ReportClubErrors
  )
)
