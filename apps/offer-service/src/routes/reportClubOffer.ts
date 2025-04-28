import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  ReportClubOfferEndpointErrors,
  ReportOfferLimitReachedError,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {ReportClubOfferEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {reportLimitCountConfig} from '../configs'
import {OfferDbService} from '../db/OfferDbService'
import {reportClubOfferReported} from '../metrics'
import {withReportClubOfferRedisLock} from '../utils/withReportClubOfferRedisLock'

export const reportClubOffer = Handler.make(
  ReportClubOfferEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        yield* _(validateChallengeInBody(req.body))

        const offerDbService = yield* _(OfferDbService)
        const reportLimitCount = yield* _(reportLimitCountConfig)

        const offerForMe = yield* _(
          offerDbService.queryOfferByPublicKeyAndOfferId({
            userPublicKey: req.body.publicKey,
            id: req.body.offerId,
          })
        )

        if (Option.isNone(offerForMe)) {
          return yield* _(Effect.fail(new NotFoundError()))
        }

        const numberOfReportsForUser = yield* _(
          offerDbService.queryNumberOfReportsForUser(security['public-key'])
        )

        if (numberOfReportsForUser >= reportLimitCount) {
          return yield* _(Effect.fail(new ReportOfferLimitReachedError()))
        }

        yield* _(
          offerDbService.updateReportOffer({
            userPublicKey: req.body.publicKey,
            offerId: req.body.offerId,
          })
        )
        return null
      }).pipe(
        withReportClubOfferRedisLock({
          publicKey: security['public-key'],
          offerId: req.body.offerId,
        }),
        withDbTransaction,
        Effect.zipLeft(reportClubOfferReported(req.body.offerId))
      ),
      ReportClubOfferEndpointErrors
    )
)
