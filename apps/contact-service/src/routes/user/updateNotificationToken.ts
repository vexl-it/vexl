import {HttpApiBuilder} from '@effect/platform/index'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {Effect} from 'effect'

// No-op kept for clients up to 26.9.0, which call it on resume and report an
// error on 404. Remove once those clients are gone.
export const updateNotificationToken = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'updateNotificationToken',
  () => Effect.succeed({})
)
