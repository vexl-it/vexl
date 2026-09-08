import {signLoginChallenge} from '@vexl-next/resources-utils/src/loginChallenge'
import {Effect} from 'effect'
import {NodeTestingApp} from './NodeTestingApp'

export const generateAndSignChallenge = Effect.gen(function* () {
  const client = yield* NodeTestingApp

  const loginChallenge = yield* client.generateLoginChallenge({})
  const clientSignature = yield* signLoginChallenge(loginChallenge.challenge)

  return {
    clientSignature,
    challenge: loginChallenge.challenge,
    serverSignature: loginChallenge.serverSignature,
  }
})
