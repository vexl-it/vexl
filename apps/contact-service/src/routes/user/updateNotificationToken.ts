import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {UserDbService} from '../../db/UserDbService'

export const updateNotificationToken = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'updateNotificationToken',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const userDb = yield* _(UserDbService)
      yield* _(
        userDb.findUserByPublicKeyAndHash({
          hash: security.hash,
          publicKey: security['public-key'],
        }),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', () =>
          Effect.fail(new UserNotFoundError())
        )
      )

      yield* _(
        userDb.updateExpoToken({
          publicKey: security['public-key'],
          hash: security.hash,
          expoToken: Option.fromNullable(req.payload.expoToken),
        })
      )
      return {}
    }).pipe(makeEndpointEffect)
)
