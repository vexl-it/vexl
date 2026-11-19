import {currentSession} from '@/src/server/access/session'
import {handleAccessRequest, jsonOk} from '@/src/server/http'
import {Effect} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export const GET = (request: NextRequest) =>
  handleAccessRequest(Effect.map(currentSession(request), jsonOk))
