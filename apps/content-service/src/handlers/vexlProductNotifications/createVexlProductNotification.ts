import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {EnqueueVexlProductNotification} from '@vexl-next/server-utils/src/ContentServiceVexlProductNotificationMq'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {VexlProductNotificationsDbService} from '../../db/VexlProductNotificationsDbService'
import {validateAdminToken} from './validateAdminToken'

export const createVexlProductNotificationHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'VexlProductNotifications',
  'createVexlProductNotification',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.urlParams.adminToken))

      const db = yield* _(VexlProductNotificationsDbService)
      const enqueueVexlProductNotification = yield* _(
        EnqueueVexlProductNotification
      )
      const normalizedVexlProductNotification = {
        ...req.payload.vexlProductNotification,
        issuePushNotification: req.payload.issuePushNotification,
      }
      const vexlProductNotification = yield* _(
        Effect.gen(function* (_) {
          const inserted = yield* _(
            db.insertVexlProductNotification({
              vexlProductNotification: normalizedVexlProductNotification,
            })
          )

          if (req.payload.issuePushNotification) {
            yield* _(
              enqueueVexlProductNotification(inserted),
              Effect.catchAll((e) =>
                Effect.zipRight(
                  Effect.logError(
                    'Failed to enqueue Vexl product notification',
                    e
                  ),
                  Effect.fail(
                    new UnexpectedServerError({
                      status: 500,
                      cause: e,
                      message:
                        'Failed to enqueue Vexl product notification push',
                    })
                  )
                )
              )
            )
          }

          return inserted
        }).pipe(withDbTransaction)
      )

      return {vexlProductNotification}
    }).pipe(
      Effect.withSpan('createVexlProductNotificationHandler'),
      makeEndpointEffect
    )
)
