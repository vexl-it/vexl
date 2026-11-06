import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {deriveBackupKeyPair} from './deriveBackupKeyPair'

export const getBackupPublicKeyHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'Backup',
  'getBackupPublicKey',
  () =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const {publicKey} = yield* _(deriveBackupKeyPair(security.hash))

      return {publicKey}
    }).pipe(Effect.withSpan('getBackupPublicKeyHandler'), makeEndpointEffect)
)
