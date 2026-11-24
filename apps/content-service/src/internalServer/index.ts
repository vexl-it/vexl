import {HttpApiBuilder} from '@effect/platform/index'
import {ContentInternalApiSpecification} from '@vexl-next/rest-api/src/services/content/internalSpecification'
import {AdminTokenMiddlewareLive} from '@vexl-next/server-utils/src/adminTokenMiddleware'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {makeInternalApiServer} from '@vexl-next/server-utils/src/InternalServer'
import {Layer} from 'effect'
import {VexlProductNotificationsDbService} from '../db/VexlProductNotificationsDbService'
import {getPublishedBlogPosts} from '../handlers/blog'
import {
  createBlogPostHandler,
  deleteBlogPostHandler,
  listBlogPostsHandler,
  publishBlogPostHandler,
  unpublishBlogPostHandler,
  updateBlogPostHandler,
} from '../handlers/cms/adminBlogPosts'
import {
  createEventHandler,
  deleteEventHandler,
  listEventsHandler,
  publishEventHandler,
  unpublishEventHandler,
  updateEventHandler,
} from '../handlers/cms/adminEvents'
import {getPublishedEvents} from '../handlers/events'
import {createVexlProductNotificationHandler} from '../handlers/vexlProductNotifications/createVexlProductNotification'

const CmsApiGroupLive = HttpApiBuilder.group(
  ContentInternalApiSpecification,
  'Cms',
  (h) =>
    h
      .handle('listBlogPosts', listBlogPostsHandler)
      .handle('createBlogPost', createBlogPostHandler)
      .handle('updateBlogPost', updateBlogPostHandler)
      .handle('publishBlogPost', publishBlogPostHandler)
      .handle('unpublishBlogPost', unpublishBlogPostHandler)
      .handle('deleteBlogPost', deleteBlogPostHandler)
      .handle('listEvents', listEventsHandler)
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

const WebsiteApiGroupLive = HttpApiBuilder.group(
  ContentInternalApiSpecification,
  'Website',
  (h) =>
    h
      .handle('getPublishedBlogPosts', () => getPublishedBlogPosts)
      .handle('getPublishedEvents', () => getPublishedEvents)
)

export const ContentInternalApiLive = HttpApiBuilder.api(
  ContentInternalApiSpecification
).pipe(
  Layer.provide(CmsApiGroupLive),
  Layer.provide(VexlProductNotificationsApiGroupLive),
  Layer.provide(WebsiteApiGroupLive),
  Layer.provide(VexlProductNotificationsDbService.Live),
  Layer.provide(AdminTokenMiddlewareLive)
)

export const internalServerLive = makeInternalApiServer(
  ContentInternalApiLive,
  {port: internalServerPortConfig}
)
