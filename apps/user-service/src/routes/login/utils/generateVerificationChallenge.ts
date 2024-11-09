import {generateChallenge} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {VerificationChallenge} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, Schema} from 'effect'

export const generateVerificationChallenge =
  (): Effect.Effect<VerificationChallenge> =>
    generateChallenge().pipe(
      Effect.map(Schema.decodeSync(VerificationChallenge))
    )
