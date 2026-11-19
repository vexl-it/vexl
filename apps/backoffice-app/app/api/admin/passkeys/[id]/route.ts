import {accessError} from '@/src/server/access/errors'
import {
  deletePasskey,
  updatePasskeySections,
} from '@/src/server/access/repository'
import {requireSessionSection} from '@/src/server/access/session'
import {
  decodeBody,
  handleAccessRequest,
  jsonOk,
  noContent,
} from '@/src/server/http'
import {UpdatePasskeyRequest} from '@/src/services/access/domain'
import {Effect, Schema} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{
    readonly id: string
  }>
}

const passkeyId = (context: RouteContext) =>
  Effect.promise(() => context.params).pipe(
    Effect.flatMap(({id}) => Schema.decodeUnknown(Schema.UUID)(id)),
    Effect.mapError(() => accessError(404, 'Passkey not found'))
  )

export const PATCH = (request: NextRequest, context: RouteContext) =>
  handleAccessRequest(
    Effect.gen(function* (_) {
      yield* _(requireSessionSection(request, 'admins'))
      const id = yield* _(passkeyId(context))
      const {sections} = yield* _(decodeBody(request, UpdatePasskeyRequest))
      const passkey = yield* _(updatePasskeySections(id, sections))
      return jsonOk({passkey})
    })
  )

export const DELETE = (request: NextRequest, context: RouteContext) =>
  handleAccessRequest(
    Effect.gen(function* (_) {
      yield* _(requireSessionSection(request, 'admins'))
      yield* _(deletePasskey(yield* _(passkeyId(context))))
      return noContent()
    })
  )
