import {HttpApiBuilder} from '@effect/platform/index'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
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
      const vexlProductNotification = yield* _(
        db.insertVexlProductNotification({
          vexlProductNotification: req.payload.vexlProductNotification,
        })
      )

      return {vexlProductNotification}
    }).pipe(
      Effect.withSpan('createVexlProductNotificationHandler'),
      makeEndpointEffect
    )
)
