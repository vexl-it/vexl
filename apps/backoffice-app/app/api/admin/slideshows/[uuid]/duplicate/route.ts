import {runDb} from '@/src/server/slideshows/db'
import {
  badRequest,
  internalServerError,
  jsonOk,
  notFound,
  requireAdmin,
} from '@/src/server/slideshows/http'
import {duplicateSlideshow} from '@/src/server/slideshows/repository'
import {Either, Schema} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{
    readonly uuid: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const {uuid} = await context.params
    const decodedUuid = Schema.decodeUnknownEither(Schema.UUID)(uuid)
    if (Either.isLeft(decodedUuid)) return badRequest(decodedUuid.left.message)

    const slideshow = await runDb(duplicateSlideshow(decodedUuid.right))
    if (!slideshow) return notFound('Slideshow not found')

    return jsonOk({slideshow}, 201)
  } catch (error) {
    return internalServerError(error)
  }
}
