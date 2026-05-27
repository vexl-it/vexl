import {isDuplicatePublicSlugError, runDb} from '@/src/server/slideshows/db'
import {
  badRequest,
  decodeJsonBody,
  internalServerError,
  jsonOk,
  noContent,
  notFound,
  requireAdmin,
} from '@/src/server/slideshows/http'
import {
  deleteSlideshow,
  findSlideshowByUuid,
  isPublicSlugAvailable,
  updateSlideshow,
} from '@/src/server/slideshows/repository'
import {UpdateSlideshowRequest} from '@/src/services/slideshows/domain'
import {Either, Schema} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{
    readonly uuid: string
  }>
}

const decodeUuid = (uuid: string) =>
  Schema.decodeUnknownEither(Schema.UUID)(uuid)

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const {uuid} = await context.params
    const decodedUuid = decodeUuid(uuid)
    if (Either.isLeft(decodedUuid)) return badRequest(decodedUuid.left.message)

    const slideshow = await runDb(findSlideshowByUuid(decodedUuid.right))
    if (!slideshow) return notFound('Slideshow not found')

    return jsonOk({slideshow})
  } catch (error) {
    return internalServerError(error)
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const {uuid} = await context.params
    const decodedUuid = decodeUuid(uuid)
    if (Either.isLeft(decodedUuid)) return badRequest(decodedUuid.left.message)

    const decoded = await decodeJsonBody(request, UpdateSlideshowRequest)
    if (Either.isLeft(decoded)) return badRequest(decoded.left.message)

    if (decoded.right.publicSlug) {
      const publicSlugAvailable = await runDb(
        isPublicSlugAvailable(decoded.right.publicSlug, decodedUuid.right)
      )
      if (!publicSlugAvailable) return badRequest('Public slug is already used')
    }

    try {
      const slideshow = await runDb(
        updateSlideshow(decodedUuid.right, decoded.right)
      )
      if (!slideshow) return notFound('Slideshow not found')

      return jsonOk({slideshow})
    } catch (error) {
      if (isDuplicatePublicSlugError(error)) {
        return badRequest('Public slug is already used')
      }

      throw error
    }
  } catch (error) {
    return internalServerError(error)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const {uuid} = await context.params
    const decodedUuid = decodeUuid(uuid)
    if (Either.isLeft(decodedUuid)) return badRequest(decodedUuid.left.message)

    const deleted = await runDb(deleteSlideshow(decodedUuid.right))
    if (!deleted) return notFound('Slideshow not found')

    return noContent()
  } catch (error) {
    return internalServerError(error)
  }
}
