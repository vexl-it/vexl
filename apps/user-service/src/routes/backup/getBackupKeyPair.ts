import {HttpApiBuilder} from '@effect/platform/index'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {consumePhoneVerification} from '../login/utils/consumePhoneVerification'
import {deriveBackupKeyPair} from './deriveBackupKeyPair'

export const getBackupKeyPairHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'Backup',
  'getBackupKeyPair',
  (req) =>
    Effect.gen(function* (_) {
      const verification = yield* _(consumePhoneVerification(req.payload))
      const keyPair = yield* _(deriveBackupKeyPair(verification.phoneNumber))

      return {keyPair}
    }).pipe(Effect.withSpan('getBackupKeyPairHandler'), makeEndpointEffect)
)
