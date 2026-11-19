import {signIn, takeChallenge} from '@/src/server/access/ceremony'
import {accessError} from '@/src/server/access/errors'
import {
  registerFirstPasskey,
  registerInvitedPasskey,
} from '@/src/server/access/repository'
import {assertSameOrigin} from '@/src/server/access/session'
import {
  RegistrationResponse,
  verifyRegistration,
} from '@/src/server/access/webauthn'
import {decodeBody, handleAccessRequest} from '@/src/server/http'
import {Effect} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

/** Finishes a first-admin setup or an invite and signs the new passkey in. */
export const POST = (request: NextRequest) =>
  handleAccessRequest(
    Effect.gen(function* (_) {
      yield* _(assertSameOrigin(request))
      const response = yield* _(decodeBody(request, RegistrationResponse))
      const challenge = yield* _(takeChallenge(request))
      if (challenge.kind === 'login') {
        return yield* _(accessError(400, 'Expected a registration'))
      }

      const credential = yield* _(
        verifyRegistration(response, challenge.challenge)
      )
      const passkey = yield* _(
        challenge.kind === 'setup'
          ? registerFirstPasskey(credential, challenge.label)
          : registerInvitedPasskey(credential, challenge.inviteTokenHash)
      )
      return yield* _(signIn(passkey))
    })
  )
