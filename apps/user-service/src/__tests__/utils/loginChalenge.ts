import {signLoginChallenge} from '@vexl-next/resources-utils/src/loginChallenge'
import {Effect} from 'effect/index'
import {NodeTestingApp} from './NodeTestingApp'

export const generateAndSignChallenge = Effect.gen(function* (_) {
  const client = yield* _(NodeTestingApp)

  const loginChallenge = yield* _(client.generateLoginChallenge({}))
  const clientSignature = yield* _(signLoginChallenge(loginChallenge.challenge))

  return {
    clientSignature,
    challenge: loginChallenge.challenge,
    serverSignature: loginChallenge.serverSignature,
  }
})
