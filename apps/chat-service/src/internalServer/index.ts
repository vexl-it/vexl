import {HttpRouter, HttpServerResponse} from '@effect/platform'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {makeInternalServer} from '@vexl-next/server-utils/src/InternalServer'
import {Effect} from 'effect'
import {ChallengeDbService} from '../db/ChallegeDbService'

export const internalServerLive = makeInternalServer(
  HttpRouter.empty.pipe(
    HttpRouter.post(
      '/clean-invalid-challenges',
      Effect.gen(function* (_) {
        const db = yield* _(ChallengeDbService)
        yield* _(db.deleteInvalidAndExpiredChallenges())

        return HttpServerResponse.text('ok', {status: 200})
      }).pipe(
        // No redis lock. What if it gets called twice? No biggie
        Effect.withSpan('Clean invalid challenges')
      )
    )
  ),
  {
    port: internalServerPortConfig,
  }
)
