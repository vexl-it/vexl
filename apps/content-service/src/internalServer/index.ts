import {HttpApiBuilder} from '@effect/platform/index'
import {ContentInternalApiSpecification} from '@vexl-next/rest-api/src/services/content/internalSpecification'
import {makeInternalApiServer} from '@vexl-next/server-utils/src/InternalServer'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {Layer} from 'effect'
import {VexlProductNotificationsDbService} from '../db/VexlProductNotificationsDbService'
import {clearCacheHandler} from '../handlers/clearCache'
import {createVexlProductNotificationHandler} from '../handlers/vexlProductNotifications/createVexlProductNotification'

const CmsApiGroupLive = HttpApiBuilder.group(
  ContentInternalApiSpecification,
  'Cms',
  (h) => h.handle('clearCache', clearCacheHandler)
)

const VexlProductNotificationsApiGroupLive = HttpApiBuilder.group(
  ContentInternalApiSpecification,
  'VexlProductNotifications',
  (h) =>
    h.handle(
      'createVexlProductNotification',
      createVexlProductNotificationHandler
    )
)

export const ContentInternalApiLive = HttpApiBuilder.api(
  ContentInternalApiSpecification
).pipe(
  Layer.provide(CmsApiGroupLive),
  Layer.provide(VexlProductNotificationsApiGroupLive),
  Layer.provide(VexlProductNotificationsDbService.Live)
)

export const internalServerLive = makeInternalApiServer(
  ContentInternalApiLive,
  {port: internalServerPortConfig}
)
