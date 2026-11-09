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
    consumePhoneVerification(req.payload, (verification) =>
      deriveBackupKeyPair(verification.phoneNumber)
    ).pipe(
      Effect.map((keyPair) => ({keyPair})),
      Effect.withSpan('getBackupKeyPairHandler'),
      makeEndpointEffect
    )
)
