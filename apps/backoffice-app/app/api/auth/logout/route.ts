import {deleteSession} from '@/src/server/access/repository'
import {
  assertSameOrigin,
  clearCookie,
  SESSION_COOKIE,
} from '@/src/server/access/session'
import {handleAccessRequest, noContent} from '@/src/server/http'
import {Effect} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export const POST = (request: NextRequest) =>
  handleAccessRequest(
    Effect.gen(function* (_) {
      yield* _(assertSameOrigin(request))
      const token = request.cookies.get(SESSION_COOKIE)?.value
      if (token) yield* _(deleteSession(token))
      return yield* _(clearCookie(noContent(), SESSION_COOKIE))
    })
  )
