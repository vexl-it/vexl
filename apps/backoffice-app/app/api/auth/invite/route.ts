import {respondWithChallenge} from '@/src/server/access/ceremony'
import {accessError} from '@/src/server/access/errors'
import {findInviteLabel} from '@/src/server/access/repository'
import {assertSameOrigin} from '@/src/server/access/session'
import {hashToken} from '@/src/server/access/tokens'
import {makeRegistrationOptions} from '@/src/server/access/webauthn'
import {decodeBody, handleAccessRequest} from '@/src/server/http'
import {InviteOptionsRequest} from '@/src/services/access/domain'
import {Effect} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

/** Registration options for a passkey that takes over an invite's sections. */
export const POST = (request: NextRequest) =>
  handleAccessRequest(
    Effect.gen(function* (_) {
      yield* _(assertSameOrigin(request))
      const {inviteToken} = yield* _(decodeBody(request, InviteOptionsRequest))
      const inviteTokenHash = hashToken(inviteToken)
      const label = yield* _(
        findInviteLabel(inviteTokenHash),
        Effect.flatMap(
          Effect.orElseFail(() =>
            accessError(404, 'This invite was already used or has expired')
          )
        )
      )

      const options = yield* _(makeRegistrationOptions(label))
      return yield* _(
        respondWithChallenge(options, {kind: 'invite', inviteTokenHash})
      )
    })
  )
