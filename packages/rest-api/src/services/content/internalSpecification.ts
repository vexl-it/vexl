import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  BlogId,
  BlogPost,
  BlogPostInput,
  CmsEvent,
  EventId,
  EventInput,
} from '@vexl-next/domain/src/general/cms'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect'
import {AdminTokenMiddleware} from '../../adminTokenMiddleware'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  BlogPostsResponse,
  BlogSlugTakenError,
  CmsEventsResponse,
  CreateVexlProductNotificationRequest,
  DuplicateVexlProductNotificationUuidError,
  VexlProductNotificationResponse,
} from './contracts'

export const CreateVexlProductNotificationEndpoint = HttpApiEndpoint.post(
  'createVexlProductNotification',
  '/content/vexl-product-notifications/admin'
)
  .setPayload(CreateVexlProductNotificationRequest)
  .addSuccess(VexlProductNotificationResponse)
  .addError(DuplicateVexlProductNotificationUuidError, {status: 400})

const BlogPostPath = Schema.Struct({id: BlogId})
const EventPath = Schema.Struct({id: EventId})

export const ListBlogPostsEndpoint = HttpApiEndpoint.get(
  'listBlogPosts',
  '/content/admin/blog-posts'
).addSuccess(BlogPostsResponse)

export const CreateBlogPostEndpoint = HttpApiEndpoint.post(
  'createBlogPost',
  '/content/admin/blog-posts'
)
  .setPayload(BlogPostInput)
  .addSuccess(BlogPost)
  .addError(BlogSlugTakenError, {status: 400})

export const UpdateBlogPostEndpoint = HttpApiEndpoint.put(
  'updateBlogPost',
  '/content/admin/blog-posts/:id'
)
  .setPath(BlogPostPath)
  .setPayload(BlogPostInput)
  .addSuccess(BlogPost)
  .addError(BlogSlugTakenError, {status: 400})

export const PublishBlogPostEndpoint = HttpApiEndpoint.post(
  'publishBlogPost',
  '/content/admin/blog-posts/:id/publish'
)
  .setPath(BlogPostPath)
  .addSuccess(BlogPost)

export const UnpublishBlogPostEndpoint = HttpApiEndpoint.post(
  'unpublishBlogPost',
  '/content/admin/blog-posts/:id/unpublish'
)
  .setPath(BlogPostPath)
  .addSuccess(BlogPost)

export const DeleteBlogPostEndpoint = HttpApiEndpoint.del(
  'deleteBlogPost',
  '/content/admin/blog-posts/:id'
)
  .setPath(BlogPostPath)
  .addSuccess(NoContentResponse)

export const ListEventsEndpoint = HttpApiEndpoint.get(
  'listEvents',
  '/content/admin/events'
).addSuccess(CmsEventsResponse)

export const CreateEventEndpoint = HttpApiEndpoint.post(
  'createEvent',
  '/content/admin/events'
)
  .setPayload(EventInput)
  .addSuccess(CmsEvent)

export const UpdateEventEndpoint = HttpApiEndpoint.put(
  'updateEvent',
  '/content/admin/events/:id'
)
  .setPath(EventPath)
  .setPayload(EventInput)
  .addSuccess(CmsEvent)

export const PublishEventEndpoint = HttpApiEndpoint.post(
  'publishEvent',
  '/content/admin/events/:id/publish'
)
  .setPath(EventPath)
  .addSuccess(CmsEvent)

export const UnpublishEventEndpoint = HttpApiEndpoint.post(
  'unpublishEvent',
  '/content/admin/events/:id/unpublish'
)
  .setPath(EventPath)
  .addSuccess(CmsEvent)

export const DeleteEventEndpoint = HttpApiEndpoint.del(
  'deleteEvent',
  '/content/admin/events/:id'
)
  .setPath(EventPath)
  .addSuccess(NoContentResponse)

const CmsApiGroup = HttpApiGroup.make('Cms')
  .add(ListBlogPostsEndpoint)
  .add(CreateBlogPostEndpoint)
  .add(UpdateBlogPostEndpoint)
  .add(PublishBlogPostEndpoint)
  .add(UnpublishBlogPostEndpoint)
  .add(DeleteBlogPostEndpoint)
  .add(ListEventsEndpoint)
  .add(CreateEventEndpoint)
  .add(UpdateEventEndpoint)
  .add(PublishEventEndpoint)
  .add(UnpublishEventEndpoint)
  .add(DeleteEventEndpoint)

const VexlProductNotificationsApiGroup = HttpApiGroup.make(
  'VexlProductNotifications'
).add(CreateVexlProductNotificationEndpoint)

export const ContentInternalApiSpecification = HttpApi.make(
  'Content Internal API'
)
  .add(CmsApiGroup)
  .add(VexlProductNotificationsApiGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
  .middleware(AdminTokenMiddleware)
