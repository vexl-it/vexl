import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from '@effect/platform'
import {makeInternalServer} from '@vexl-next/server-utils/src/InternalServer'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {Effect, Schema} from 'effect'
import {clubReportLimitIntervalDaysConfig} from '../configs'
import {ClubMembersDbService} from '../db/ClubMemberDbService'
import {UserNotificationService} from '../services/UserNotificationService'
import {checkForInactiveUsers} from './routes/checkForInactiveUsers'
import {deactivateAndClearClubs} from './routes/deactivateAndClearClubs'
import {testHasingSpeed} from './routes/testHashingSpeed'

export const internalServerLive = makeInternalServer(
  HttpRouter.empty.pipe(
    HttpRouter.post(
      '/process-user-inactivity',
      Effect.gen(function* (_) {
        const userNotificationService = yield* _(UserNotificationService)
        yield* _(userNotificationService.notifyUsersAboutInactivity())
      }).pipe(
        Effect.mapBoth({
          onFailure: (error) =>
            HttpServerResponse.text(error.message, {status: 500}),
          onSuccess: () => HttpServerResponse.text('ok', {status: 200}),
        })
      )
    ),
    HttpRouter.post(
      '/process-new-content-notification',
      Effect.gen(function* (_) {
        const userNotificationService = yield* _(UserNotificationService)
        yield* _(userNotificationService.notifyUsersAboutNewContent())
      }).pipe(
        Effect.mapBoth({
          onFailure: (error) =>
            HttpServerResponse.text(error.message, {status: 500}),
          onSuccess: () => HttpServerResponse.text('ok', {status: 200}),
        })
      )
    ),
    HttpRouter.post(
      '/deactivate-and-clear-clubs',
      deactivateAndClearClubs.pipe(
        Effect.mapBoth({
          onFailure: (error) =>
            HttpServerResponse.text(error._tag, {status: 500}),
          onSuccess: () => HttpServerResponse.text('ok', {status: 200}),
        })
      )
    ),
    HttpRouter.post(
      '/delete-inactive-club-members',
      checkForInactiveUsers.pipe(
        Effect.mapBoth({
          onFailure: (error) =>
            HttpServerResponse.text(error._tag, {status: 500}),
          onSuccess: () => HttpServerResponse.text('ok', {status: 200}),
        })
      )
    ),
    HttpRouter.post(
      '/clean-reported-club-records',
      Effect.gen(function* (_) {
        const db = yield* _(ClubMembersDbService)
        const clubReportLimitIntervalDays = yield* _(
          clubReportLimitIntervalDaysConfig
        )
        yield* _(
          db.deleteClubReportedRecordByReportedAtBefore(
            clubReportLimitIntervalDays
          )
        )

        return HttpServerResponse.text('ok', {status: 200})
      })
    ),
    HttpRouter.post(
      '/test-hashing-speed',
      Effect.gen(function* (_) {
        const body = yield* _(
          HttpServerRequest.schemaBodyJson(
            Schema.Struct({
              iterations: Schema.Number,
              numberOfElements: Schema.Number,
            })
          )
        )
        const durationMs = yield* _(
          testHasingSpeed(body.iterations, body.numberOfElements)
        )

        return yield* _(HttpServerResponse.json({durationMs}, {status: 200}))
      })
    )
  ),
  {port: internalServerPortConfig}
)
