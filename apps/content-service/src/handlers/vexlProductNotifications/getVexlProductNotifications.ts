import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'
import {VexlProductNotificationsDbService} from '../../db/VexlProductNotificationsDbService'

export const getVexlProductNotificationsHandler = makeHttpApiHandler(
  ContentApiSpecification,
  'VexlProductNotifications',
  'getVexlProductNotifications',
  (req) =>
    Effect.gen(function* () {
      const db = yield* VexlProductNotificationsDbService
      const vexlProductNotifications = yield* db.queryVexlProductNotifications(
        req.query
      )

      return {vexlProductNotifications}
    }).pipe(
      Effect.withSpan('getVexlProductNotificationsHandler'),
      makeEndpointEffect
    )
)
