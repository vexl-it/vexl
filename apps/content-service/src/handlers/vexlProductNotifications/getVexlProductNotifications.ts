import {HttpApiBuilder} from '@effect/platform/index'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {VexlProductNotificationsDbService} from '../../db/VexlProductNotificationsDbService'

export const getVexlProductNotificationsHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'VexlProductNotifications',
  'getVexlProductNotifications',
  (req) =>
    Effect.gen(function* (_) {
      const db = yield* _(VexlProductNotificationsDbService)
      const vexlProductNotifications = yield* _(
        db.queryVexlProductNotifications(req.urlParams)
      )

      return {vexlProductNotifications}
    }).pipe(
      Effect.withSpan('getVexlProductNotificationsHandler'),
      makeEndpointEffect
    )
)
