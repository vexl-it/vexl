import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {ReportOfferLimitReachedError} from '@vexl-next/rest-api/src/services/offer/contracts'
import {
  ReportOfferEndpoint,
  ReportOfferEndpointErrors,
} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import {Effect, Metric, Option} from 'effect'
import {Handler} from 'effect-http'
import {reportLimitIntervalDays} from '../configs'
import {OfferDbService} from '../db/OfferDbService'
import {makeOfferReportedCounter} from '../metrics'

export const reportOffer = Handler.make(ReportOfferEndpoint, (req, security) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const offerDbService = yield* _(OfferDbService)
      const reportLimitCount = yield* _(reportLimitIntervalDays)

      const offerForMe = yield* _(
        offerDbService.queryOfferByPublicKeyAndOfferId({
          userPublicKey: security['public-key'],
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
        return Effect.fail(new ReportOfferLimitReachedError())
      }

      yield* _(
        offerDbService.updateReportOffer({
          userPublicKey: security['public-key'],
          offerId: req.body.offerId,
        })
      )
      return null
    }).pipe(
      withRedisLock(`reportOffer:${security['public-key']}`),
      Effect.zipLeft(
        Metric.incrementBy(makeOfferReportedCounter(req.body.offerId), 1)
      )
    ),
    ReportOfferEndpointErrors
  )
)
