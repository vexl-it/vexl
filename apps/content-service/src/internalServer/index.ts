import {HttpApiBuilder} from '@effect/platform/index'
import {ContentInternalApiSpecification} from '@vexl-next/rest-api/src/services/content/internalSpecification'
import {makeInternalApiServer} from '@vexl-next/server-utils/src/InternalServer'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {Layer} from 'effect'
import {VexlProductNotificationsDbService} from '../db/VexlProductNotificationsDbService'
import {clearCacheHandler} from '../handlers/clearCache'
import {
  createBlogPostHandler,
  deleteBlogPostHandler,
  publishBlogPostHandler,
  unpublishBlogPostHandler,
  updateBlogPostHandler,
} from '../handlers/cms/adminBlogPosts'
import {
  createEventHandler,
  deleteEventHandler,
  publishEventHandler,
  unpublishEventHandler,
  updateEventHandler,
} from '../handlers/cms/adminEvents'
import {createVexlProductNotificationHandler} from '../handlers/vexlProductNotifications/createVexlProductNotification'

const CmsApiGroupLive = HttpApiBuilder.group(
  ContentInternalApiSpecification,
  'Cms',
  (h) =>
    h
      .handle('clearCache', clearCacheHandler)
      .handle('createBlogPost', createBlogPostHandler)
      .handle('updateBlogPost', updateBlogPostHandler)
      .handle('publishBlogPost', publishBlogPostHandler)
      .handle('unpublishBlogPost', unpublishBlogPostHandler)
      .handle('deleteBlogPost', deleteBlogPostHandler)
      .handle('createEvent', createEventHandler)
      .handle('updateEvent', updateEventHandler)
      .handle('publishEvent', publishEventHandler)
      .handle('unpublishEvent', unpublishEventHandler)
      .handle('deleteEvent', deleteEventHandler)
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
