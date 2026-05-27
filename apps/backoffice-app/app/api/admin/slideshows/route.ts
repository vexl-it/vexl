import {isDuplicatePublicSlugError, runDb} from '@/src/server/slideshows/db'
import {
  badRequest,
  decodeJsonBody,
  internalServerError,
  jsonOk,
  requireAdmin,
} from '@/src/server/slideshows/http'
import {
  createSlideshow,
  isPublicSlugAvailable,
  listSlideshows,
} from '@/src/server/slideshows/repository'
import {CreateSlideshowRequest} from '@/src/services/slideshows/domain'
import {Either} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const slideshows = await runDb(listSlideshows)

    return jsonOk({slideshows})
  } catch (error) {
    return internalServerError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const decoded = await decodeJsonBody(request, CreateSlideshowRequest)
    if (Either.isLeft(decoded)) return badRequest(decoded.left.message)

    if (decoded.right.publicSlug) {
      const publicSlugAvailable = await runDb(
        isPublicSlugAvailable(decoded.right.publicSlug, null)
      )
      if (!publicSlugAvailable) return badRequest('Public slug is already used')
    }

    try {
      const slideshow = await runDb(createSlideshow(decoded.right))
      return jsonOk({slideshow}, 201)
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
