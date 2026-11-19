import {respondWithChallenge} from '@/src/server/access/ceremony'
import {assertSameOrigin} from '@/src/server/access/session'
import {makeAuthenticationOptions} from '@/src/server/access/webauthn'
import {handleAccessRequest} from '@/src/server/http'
import {Effect} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export const POST = (request: NextRequest) =>
  handleAccessRequest(
    Effect.gen(function* (_) {
      yield* _(assertSameOrigin(request))
      const options = yield* _(makeAuthenticationOptions)
      return yield* _(respondWithChallenge(options, {kind: 'login'}))
    })
  )
