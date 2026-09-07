import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {EnqueueVexlProductNotification} from '@vexl-next/server-utils/src/ContentServiceVexlProductNotificationMq'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, pipe} from 'effect'
import {VexlProductNotificationsDbService} from '../../db/VexlProductNotificationsDbService'
import {validateAdminToken} from './validateAdminToken'

export const createVexlProductNotificationHandler = makeHttpApiHandler(
  ContentApiSpecification,
  'VexlProductNotifications',
  'createVexlProductNotification',
  (req) =>
    Effect.gen(function* () {
      yield* validateAdminToken(req.headers[HEADER_ADMIN_TOKEN])

      const db = yield* VexlProductNotificationsDbService
      const enqueueVexlProductNotification =
        yield* EnqueueVexlProductNotification
      const normalizedVexlProductNotification = {
        ...req.payload.vexlProductNotification,
        issuePushNotification: req.payload.issuePushNotification,
      }
      const vexlProductNotification = yield* Effect.gen(function* () {
        const inserted = yield* db.insertVexlProductNotification({
          vexlProductNotification: normalizedVexlProductNotification,
        })

        if (req.payload.issuePushNotification) {
          yield* pipe(
            enqueueVexlProductNotification(inserted),
            Effect.catch((e) =>
              Effect.andThen(
                Effect.logError(
                  'Failed to enqueue Vexl product notification',
                  e
                ),
                Effect.fail(
                  new UnexpectedServerError({
                    status: 500,
                    cause: e,
                    message: 'Failed to enqueue Vexl product notification push',
                  })
                )
              )
            )
          )
        }

        return inserted
      }).pipe(withDbTransaction)

      return {vexlProductNotification}
    }).pipe(
      Effect.withSpan('createVexlProductNotificationHandler'),
      makeEndpointEffect
    )
)
