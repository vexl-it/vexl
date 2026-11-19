import {
  HttpApiMiddleware,
  HttpApiSchema,
  HttpApiSecurity,
} from '@effect/platform'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect'
import {HEADER_ADMIN_TOKEN} from './constants'

export class InvalidAdminTokenError extends Schema.TaggedError<InvalidAdminTokenError>(
  'InvalidAdminTokenError'
)(
  'InvalidAdminTokenError',
  {
    status: Schema.optionalWith(Schema.Literal(401), {default: () => 401}),
  },
  HttpApiSchema.annotations({status: 401})
) {}

export class AdminTokenMiddleware extends HttpApiMiddleware.Tag<AdminTokenMiddleware>()(
  'AdminTokenMiddleware',
  {
    failure: Schema.Union(InvalidAdminTokenError, UnexpectedServerError),
    security: {
      adminToken: HttpApiSecurity.apiKey({
        in: 'header',
        key: HEADER_ADMIN_TOKEN,
      }),
    },
  }
) {}
