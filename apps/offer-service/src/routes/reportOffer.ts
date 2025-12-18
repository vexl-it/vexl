import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ReportOfferLimitReachedError} from '@vexl-next/rest-api/src/services/offer/contracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {withRedisLockFromEffect} from '@vexl-next/server-utils/src/RedisService'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {reportLimitCountConfig} from '../configs'
import {OfferDbService} from '../db/OfferDbService'
import {reportOfferReported} from '../metrics'

export const reportOffer = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'reportOffer',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const offerDbService = yield* _(OfferDbService)
      const reportLimitCount = yield* _(reportLimitCountConfig)

      const offerForMe = yield* _(
        offerDbService.queryOfferByPublicKeyAndOfferId({
          userPublicKey: security['public-key'],
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
          userPublicKey: security['public-key'],
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
      withRedisLockFromEffect(
        CurrentSecurity.pipe(
          Effect.map((security) => `reportOffer:${security['public-key']}`)
        ),
        500
      ),
      Effect.zipLeft(reportOfferReported(req.payload.offerId)),
      makeEndpointEffect
    )
)
