import {listPasskeys} from '@/src/server/access/repository'
import {requireSessionSection} from '@/src/server/access/session'
import {handleAccessRequest, jsonOk} from '@/src/server/http'
import {Effect} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export const GET = (request: NextRequest) =>
  handleAccessRequest(
    requireSessionSection(request, 'admins').pipe(
      Effect.zipRight(listPasskeys),
      Effect.map((passkeys) => jsonOk({passkeys}))
    )
  )
