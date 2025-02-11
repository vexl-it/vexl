import {HttpRouter, HttpServerResponse} from '@effect/platform'
import {makeInternalServer} from '@vexl-next/server-utils/src/InternalServer'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {cleanInvalidChallenges} from '@vexl-next/server-utils/src/services/challenge/internalServer/routes/cleanInvalidChallenges'
import {Effect} from 'effect'
import {reportLimitIntervalDaysConfig} from './configs'
import {OfferDbService} from './db/OfferDbService'

export const InternalServerLive = makeInternalServer(
  HttpRouter.empty.pipe(
    HttpRouter.post(
      '/clean-reported-records',
      Effect.gen(function* (_) {
        const db = yield* _(OfferDbService)
        const reportLimitIntervalDays = yield* _(reportLimitIntervalDaysConfig)
        yield* _(
          db.deleteOfferReportedRecordByReportedAtBefore(
            reportLimitIntervalDays
          )
        )

        return HttpServerResponse.text('ok', {status: 200})
      })
    ),
    HttpRouter.post('/clean-invalid-challenges', cleanInvalidChallenges)
  ),
  {port: internalServerPortConfig}
)
