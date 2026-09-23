import {runDb} from '@/src/server/db'
import {
  badRequest,
  decodeJsonBody,
  internalServerError,
  jsonOk,
  noContent,
  notFound,
  requireAdmin,
} from '@/src/server/http'
import {
  deleteShortLink,
  updateShortLinkTarget,
} from '@/src/server/shortLinks/repository'
import {
  ShortLinkSlug,
  UpdateShortLinkRequest,
} from '@/src/services/shortLinks/domain'
import {Either, Schema} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{
    readonly slug: string
  }>
}

const decodeSlug = Schema.decodeUnknownEither(ShortLinkSlug)

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const slug = decodeSlug((await context.params).slug)
    if (Either.isLeft(slug)) return badRequest(slug.left.message)

    const decoded = await decodeJsonBody(request, UpdateShortLinkRequest)
    if (Either.isLeft(decoded)) return badRequest(decoded.left.message)

    const link = await runDb(
      updateShortLinkTarget(slug.right, decoded.right.targetUrl)
    )
    if (!link) return notFound('Short link not found')

    return jsonOk({link})
  } catch (error) {
    return internalServerError(error)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const slug = decodeSlug((await context.params).slug)
    if (Either.isLeft(slug)) return badRequest(slug.left.message)

    const deleted = await runDb(deleteShortLink(slug.right))
    if (!deleted) return notFound('Short link not found')

    return noContent()
  } catch (error) {
    return internalServerError(error)
  }
}
