import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ReportOfferLimitReachedError} from '@vexl-next/rest-api/src/services/offer/contracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {reportLimitCountConfig} from '../configs'
import {OfferDbService} from '../db/OfferDbService'
import {reportClubOfferReported} from '../metrics'
import {withReportClubOfferRedisLock} from '../utils/withReportClubOfferRedisLock'

export const reportClubOffer = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'reportClubOffer',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      yield* _(validateChallengeInBody(req.payload))

      const offerDbService = yield* _(OfferDbService)
      const reportLimitCount = yield* _(reportLimitCountConfig)

      const offerForMe = yield* _(
        offerDbService.queryOfferByPublicKeyAndOfferId({
          userPublicKey: req.payload.publicKey,
          id: req.payload.offerId,
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
          userPublicKey: req.payload.publicKey,
          offerId: req.payload.offerId,
        })
      )

      yield* _(
        offerDbService.insertOfferReportedRecord({
          userPublicKey: security['public-key'],
          reportedAt: new Date(),
        })
      )

      return {}
    }).pipe(
      withReportClubOfferRedisLock({
        publicKeyE: CurrentSecurity.pipe(
          Effect.map((security) => security['public-key'])
        ),
        offerId: req.payload.offerId,
      }),
      withDbTransaction,
      Effect.zipLeft(reportClubOfferReported(req.payload.offerId)),
      makeEndpointEffect
    )
)
