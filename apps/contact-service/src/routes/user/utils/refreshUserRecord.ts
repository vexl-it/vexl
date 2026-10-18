import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, Option} from 'effect'
import {UserDbService} from '../../../db/UserDbService'
import {type UserRecord} from '../../../db/UserDbService/domain'
import {type ServerHashedNumber} from '../../../utils/serverHashContact'

export interface UserSecurity {
  publicKey: PublicKeyPemBase64
  serverHash: ServerHashedNumber
  publicKeyV2: Option.Option<PublicKeyV2>
}

export const findUserOrFail = (
  security: UserSecurity
): Effect.Effect<
  UserRecord,
  UserNotFoundError | UnexpectedServerError,
  UserDbService
> =>
  Effect.flatMap(UserDbService, (userDb) =>
    userDb.findUserByPublicKeyAndHash({
      hash: security.serverHash,
      publicKey: security.publicKey,
    })
  ).pipe(
    Effect.flatten,
    Effect.catchTag('NoSuchElementException', () =>
      Effect.fail(new UserNotFoundError())
    )
  )

export const refreshUserRecord = ({
  security,
  headers,
  vexlNotificationToken,
}: {
  security: UserSecurity
  headers: CommonHeaders
  vexlNotificationToken: Option.Option<VexlNotificationToken>
}): Effect.Effect<void, UnexpectedServerError, UserDbService> =>
  Effect.gen(function* (_) {
    const userDb = yield* _(UserDbService)

    if (Option.isSome(vexlNotificationToken)) {
      yield* _(
        userDb.clearVexlNotificationTokenHeldByOtherUsers({
          publicKey: security.publicKey,
          hash: security.serverHash,
          token: vexlNotificationToken.value,
        })
      )
    }

    yield* _(
      userDb.updateRefreshUser({
        publicKey: security.publicKey,
        hash: security.serverHash,
        clientVersion: headers.clientVersionOrNone,
        countryPrefix: headers.prefixOrNone,
        appSource: headers.appSourceOrNone,
        vexlNotificationToken,
        refreshedAt: new Date(),
        publicKeyV2: security.publicKeyV2,
      })
    )
  })
