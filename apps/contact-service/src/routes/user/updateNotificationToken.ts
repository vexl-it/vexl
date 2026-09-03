import {HttpApiBuilder} from '@effect/platform/index'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {Effect} from 'effect'

// No-op kept for clients up to 26.9.0, which call it on resume and report an
// error on 404. TODO https://github.com/vexl-it/vexl/issues/2715
export const updateNotificationToken = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'updateNotificationToken',
  () => Effect.succeed({})
)
