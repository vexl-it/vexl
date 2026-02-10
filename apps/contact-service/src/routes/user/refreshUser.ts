import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {UserDbService} from '../../db/UserDbService'
import {reportUserRefresh} from '../../metrics'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'

export const refreshUser = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'refreshUser',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(reportUserRefresh())
      const security = yield* _(
        CurrentSecurity,
        Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash))
      )
      const userDb = yield* _(UserDbService)
      yield* _(
        userDb.findUserByPublicKeyAndHash({
          hash: security.serverHash,
          publicKey: security.publicKey,
        }),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', () =>
          Effect.fail(new UserNotFoundError())
        )
      )

      yield* _(
        userDb.updateRefreshUser({
          publicKey: security.publicKey,
          hash: security.serverHash,
          clientVersion: req.headers.clientVersionOrNone,
          countryPrefix: req.payload.countryPrefix,
          appSource: req.headers.appSourceOrNone,
          refreshedAt: new Date(),
          publicKeyV2: req.payload.publicKeyV2,
        })
      )
      return {}
    }).pipe(makeEndpointEffect)
)
