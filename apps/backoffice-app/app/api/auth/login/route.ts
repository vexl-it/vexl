import {signIn, takeChallenge} from '@/src/server/access/ceremony'
import {accessError} from '@/src/server/access/errors'
import {findCredential, recordPasskeyUse} from '@/src/server/access/repository'
import {assertSameOrigin} from '@/src/server/access/session'
import {
  AuthenticationResponse,
  verifyAuthentication,
} from '@/src/server/access/webauthn'
import {decodeBody, handleAccessRequest} from '@/src/server/http'
import {Effect} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

const unknownPasskey = () =>
  accessError(401, 'This passkey does not have access to the backoffice')

export const POST = (request: NextRequest) =>
  handleAccessRequest(
    Effect.gen(function* (_) {
      yield* _(assertSameOrigin(request))
      const response = yield* _(decodeBody(request, AuthenticationResponse))
      const challenge = yield* _(takeChallenge(request))
      if (challenge.kind !== 'login') {
        return yield* _(accessError(400, 'Expected a sign-in'))
      }

      const credential = yield* _(
        findCredential(response.id),
        Effect.flatMap(Effect.orElseFail(unknownPasskey))
      )
      const counter = yield* _(
        verifyAuthentication(response, challenge.challenge, credential)
      )
      const passkey = yield* _(
        recordPasskeyUse(credential.passkeyId, counter),
        Effect.flatMap(Effect.orElseFail(unknownPasskey))
      )
      return yield* _(signIn(passkey))
    })
  )
