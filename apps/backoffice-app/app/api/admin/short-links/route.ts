import {runDb} from '@/src/server/db'
import {
  badRequest,
  decodeJsonBody,
  internalServerError,
  jsonOk,
  requireAdmin,
} from '@/src/server/http'
import {
  createShortLink,
  listShortLinks,
} from '@/src/server/shortLinks/repository'
import {CreateShortLinkRequest} from '@/src/services/shortLinks/domain'
import {Effect, Either} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const links = await runDb(listShortLinks)

    return jsonOk({links})
  } catch (error) {
    return internalServerError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const decoded = await decodeJsonBody(request, CreateShortLinkRequest)
    if (Either.isLeft(decoded)) return badRequest(decoded.left.message)

    const created = await runDb(
      createShortLink(decoded.right).pipe(
        Effect.map(Either.right),
        Effect.catchTag('ShortLinkSlugTakenError', (error) =>
          Effect.succeed(Either.left(error))
        )
      )
    )
    if (Either.isLeft(created)) {
      return badRequest(`Slug "${created.left.slug}" is already used`)
    }

    return jsonOk({link: created.right}, 201)
  } catch (error) {
    return internalServerError(error)
  }
}
