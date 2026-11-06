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
import {AdminTokenHeaders} from '../../adminTokenHeaders'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  BlogPostsResponse,
  BlogSlugTakenError,
  CmsEventsResponse,
  CreateVexlProductNotificationRequest,
  DuplicateVexlProductNotificationUuidError,
  InvalidContentAdminTokenError,
  VexlProductNotificationResponse,
} from './contracts'

export const CreateVexlProductNotificationEndpoint = HttpApiEndpoint.post(
  'createVexlProductNotification',
  '/content/vexl-product-notifications/admin'
)
  .setHeaders(AdminTokenHeaders)
  .setPayload(CreateVexlProductNotificationRequest)
  .addSuccess(VexlProductNotificationResponse)
  .addError(InvalidContentAdminTokenError, {status: 401})
  .addError(DuplicateVexlProductNotificationUuidError, {status: 400})

const BlogPostPath = Schema.Struct({id: BlogId})
const EventPath = Schema.Struct({id: EventId})

export const ListBlogPostsEndpoint = HttpApiEndpoint.get(
  'listBlogPosts',
  '/content/admin/blog-posts'
)
  .setHeaders(AdminTokenHeaders)
  .addSuccess(BlogPostsResponse)
  .addError(InvalidContentAdminTokenError, {status: 401})

export const CreateBlogPostEndpoint = HttpApiEndpoint.post(
  'createBlogPost',
  '/content/admin/blog-posts'
)
  .setHeaders(AdminTokenHeaders)
  .setPayload(BlogPostInput)
  .addSuccess(BlogPost)
  .addError(InvalidContentAdminTokenError, {status: 401})
  .addError(BlogSlugTakenError, {status: 400})

export const UpdateBlogPostEndpoint = HttpApiEndpoint.put(
  'updateBlogPost',
  '/content/admin/blog-posts/:id'
)
  .setPath(BlogPostPath)
  .setHeaders(AdminTokenHeaders)
  .setPayload(BlogPostInput)
  .addSuccess(BlogPost)
  .addError(InvalidContentAdminTokenError, {status: 401})
  .addError(BlogSlugTakenError, {status: 400})

export const PublishBlogPostEndpoint = HttpApiEndpoint.post(
  'publishBlogPost',
  '/content/admin/blog-posts/:id/publish'
)
  .setPath(BlogPostPath)
  .setHeaders(AdminTokenHeaders)
  .addSuccess(BlogPost)
  .addError(InvalidContentAdminTokenError, {status: 401})

export const UnpublishBlogPostEndpoint = HttpApiEndpoint.post(
  'unpublishBlogPost',
  '/content/admin/blog-posts/:id/unpublish'
)
  .setPath(BlogPostPath)
  .setHeaders(AdminTokenHeaders)
  .addSuccess(BlogPost)
  .addError(InvalidContentAdminTokenError, {status: 401})

export const DeleteBlogPostEndpoint = HttpApiEndpoint.del(
  'deleteBlogPost',
  '/content/admin/blog-posts/:id'
)
  .setPath(BlogPostPath)
  .setHeaders(AdminTokenHeaders)
  .addSuccess(NoContentResponse)
  .addError(InvalidContentAdminTokenError, {status: 401})

export const ListEventsEndpoint = HttpApiEndpoint.get(
  'listEvents',
  '/content/admin/events'
)
  .setHeaders(AdminTokenHeaders)
  .addSuccess(CmsEventsResponse)
  .addError(InvalidContentAdminTokenError, {status: 401})

export const CreateEventEndpoint = HttpApiEndpoint.post(
  'createEvent',
  '/content/admin/events'
)
  .setHeaders(AdminTokenHeaders)
  .setPayload(EventInput)
  .addSuccess(CmsEvent)
  .addError(InvalidContentAdminTokenError, {status: 401})

export const UpdateEventEndpoint = HttpApiEndpoint.put(
  'updateEvent',
  '/content/admin/events/:id'
)
  .setPath(EventPath)
  .setHeaders(AdminTokenHeaders)
  .setPayload(EventInput)
  .addSuccess(CmsEvent)
  .addError(InvalidContentAdminTokenError, {status: 401})

export const PublishEventEndpoint = HttpApiEndpoint.post(
  'publishEvent',
  '/content/admin/events/:id/publish'
)
  .setPath(EventPath)
  .setHeaders(AdminTokenHeaders)
  .addSuccess(CmsEvent)
  .addError(InvalidContentAdminTokenError, {status: 401})

export const UnpublishEventEndpoint = HttpApiEndpoint.post(
  'unpublishEvent',
  '/content/admin/events/:id/unpublish'
)
  .setPath(EventPath)
  .setHeaders(AdminTokenHeaders)
  .addSuccess(CmsEvent)
  .addError(InvalidContentAdminTokenError, {status: 401})

export const DeleteEventEndpoint = HttpApiEndpoint.del(
  'deleteEvent',
  '/content/admin/events/:id'
)
  .setPath(EventPath)
  .setHeaders(AdminTokenHeaders)
  .addSuccess(NoContentResponse)
  .addError(InvalidContentAdminTokenError, {status: 401})

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
