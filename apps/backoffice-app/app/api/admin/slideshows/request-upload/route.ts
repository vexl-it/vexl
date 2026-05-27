import {
  badRequest,
  decodeJsonBody,
  internalServerError,
  jsonOk,
  requireAdmin,
} from '@/src/server/slideshows/http'
import {createSlideshowUpload} from '@/src/server/slideshows/s3'
import {RequestUploadRequest} from '@/src/services/slideshows/domain'
import {Effect, Either} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const decoded = await decodeJsonBody(request, RequestUploadRequest)
    if (Either.isLeft(decoded)) return badRequest(decoded.left.message)

    const upload = await Effect.runPromise(createSlideshowUpload(decoded.right))

    return jsonOk(upload)
  } catch (error) {
    return internalServerError(error)
  }
}
