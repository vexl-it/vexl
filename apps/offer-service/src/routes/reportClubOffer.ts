import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ReportOfferLimitReachedError} from '@vexl-next/rest-api/src/services/offer/contracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {reportLimitCountConfig} from '../configs'
import {OfferDbService} from '../db/OfferDbService'
import {reportClubOfferReported} from '../metrics'
import {withReportClubOfferRedisLock} from '../utils/withReportClubOfferRedisLock'

export const reportClubOffer = makeHttpApiHandler(
  OfferApiSpecification,
  'root',
  'reportClubOffer',
  (req) =>
    Effect.gen(function* () {
      const security = yield* CurrentSecurity
      yield* validateChallengeInBody(req.payload)

      const offerDbService = yield* OfferDbService
      const reportLimitCount = yield* reportLimitCountConfig

      const offerForMe = yield* offerDbService.queryOfferByPublicKeyAndOfferId({
        userPublicKey: req.payload.publicKey,
        userPublicKeyV2: req.payload.publicKeyV2,
        id: req.payload.offerId,
      })

      if (Option.isNone(offerForMe)) {
        return yield* Effect.fail(new NotFoundError())
      }

      const numberOfReportsForUser =
        yield* offerDbService.queryNumberOfReportsForUser(security.publicKey)

      if (numberOfReportsForUser >= reportLimitCount) {
        return yield* Effect.fail(new ReportOfferLimitReachedError())
      }

      yield* offerDbService.updateReportOffer({
        userPublicKey: req.payload.publicKey,
        offerId: req.payload.offerId,
      })

      yield* offerDbService.insertOfferReportedRecord({
        userPublicKey: security.publicKey,
        reportedAt: new Date(),
      })

      return {}
    }).pipe(
      withReportClubOfferRedisLock({
        publicKeyE: CurrentSecurity.pipe(
          Effect.map((security) => security.publicKey)
        ),
        offerId: req.payload.offerId,
      }),
      withDbTransaction,
      Effect.tap(
        reportClubOfferReported(
          req.payload.offerId,
          commonMetricAttributesFromHeaders(req.headers)
        )
      ),
      makeEndpointEffect
    )
)
