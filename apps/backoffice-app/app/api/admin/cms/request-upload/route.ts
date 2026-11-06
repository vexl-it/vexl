import {createCmsImageUpload} from '@/src/server/cms/s3'
import {
  badRequest,
  decodeJsonBody,
  internalServerError,
  jsonOk,
  requireCmsEditor,
} from '@/src/server/http'
import {RequestCmsImageUploadRequest} from '@/src/services/cms/domain'
import {Effect, Either} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const authError = await requireCmsEditor(request)
    if (authError) return authError

    const decoded = await decodeJsonBody(request, RequestCmsImageUploadRequest)
    if (Either.isLeft(decoded)) return badRequest(decoded.left.message)

    return jsonOk(await Effect.runPromise(createCmsImageUpload(decoded.right)))
  } catch (error) {
    return internalServerError(error)
  }
}
