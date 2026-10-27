import {HttpApiBuilder} from '@effect/platform/index'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {Effect} from 'effect'

// No-op kept so clients up to 26.9.5, which call it when their Expo token
// changes, don't report a 404 to Sentry. TODO https://github.com/vexl-it/vexl/issues/2715
export const updateNotificationToken = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'updateNotificationToken',
  () => Effect.succeed({})
)
