import {respondWithChallenge} from '@/src/server/access/ceremony'
import {accessError} from '@/src/server/access/errors'
import {isSetupRequired} from '@/src/server/access/repository'
import {assertSameOrigin} from '@/src/server/access/session'
import {timingSafeStringEqual} from '@/src/server/access/tokens'
import {makeRegistrationOptions} from '@/src/server/access/webauthn'
import {adminTokenConfig} from '@/src/server/config'
import {decodeBody, handleAccessRequest, jsonOk} from '@/src/server/http'
import {SetupOptionsRequest} from '@/src/services/access/domain'
import {Effect, Redacted} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export const GET = () =>
  handleAccessRequest(
    Effect.map(isSetupRequired, (setupRequired) => jsonOk({setupRequired}))
  )

/** Registration options for the first passkey, which gets every section. */
export const POST = (request: NextRequest) =>
  handleAccessRequest(
    Effect.gen(function* (_) {
      yield* _(assertSameOrigin(request))
      const {adminToken, label} = yield* _(
        decodeBody(request, SetupOptionsRequest)
      )
      if (!(yield* _(isSetupRequired))) {
        return yield* _(accessError(409, 'The first admin is already set up'))
      }
      const expectedToken = Redacted.value(yield* _(adminTokenConfig))
      if (!timingSafeStringEqual(adminToken, expectedToken)) {
        return yield* _(accessError(401, 'Wrong admin token'))
      }

      const options = yield* _(makeRegistrationOptions(label))
      return yield* _(respondWithChallenge(options, {kind: 'setup', label}))
    })
  )
