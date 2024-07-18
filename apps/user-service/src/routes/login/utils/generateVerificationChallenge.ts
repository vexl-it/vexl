import {Schema} from '@effect/schema'
import {generateChallenge} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {VerificationChallenge} from '@vexl-next/rest-api/src/services/user/specification'
import {Effect} from 'effect'

export const generateVerificationChallenge =
  (): Effect.Effect<VerificationChallenge> =>
    generateChallenge().pipe(
      Effect.map(Schema.decodeSync(VerificationChallenge))
    )
