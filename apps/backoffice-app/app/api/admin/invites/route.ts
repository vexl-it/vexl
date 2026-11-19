import {createInvite} from '@/src/server/access/repository'
import {requireSessionSection} from '@/src/server/access/session'
import {backofficeOriginConfig} from '@/src/server/config'
import {decodeBody, handleAccessRequest, jsonOk} from '@/src/server/http'
import {
  CreateInviteRequest,
  type CreateInviteResponse,
} from '@/src/services/access/domain'
import {Effect} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export const POST = (request: NextRequest) =>
  handleAccessRequest(
    Effect.gen(function* (_) {
      yield* _(requireSessionSection(request, 'admins'))
      const {label, sections} = yield* _(
        decodeBody(request, CreateInviteRequest)
      )
      const origin = yield* _(backofficeOriginConfig)
      const invite = yield* _(createInvite(label, sections))
      // The token is in the fragment so it never reaches server or proxy logs.
      const inviteUrl = new URL(`/invite#${invite.token}`, origin)
      return jsonOk(
        {
          inviteUrl: inviteUrl.toString(),
          expiresAt: invite.expiresAt.toISOString(),
        } satisfies CreateInviteResponse,
        201
      )
    })
  )
