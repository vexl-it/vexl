import {runDb} from '@/src/server/slideshows/db'
import {
  badRequest,
  internalServerError,
  jsonOk,
  notFound,
  requireAdmin,
} from '@/src/server/slideshows/http'
import {regenerateSlideshowToken} from '@/src/server/slideshows/repository'
import {Result, Schema} from 'effect'
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
    const decodedUuid = Schema.decodeUnknownResult(
      Schema.String.check(Schema.isUUID())
    )(uuid)
    if (Result.isFailure(decodedUuid))
      return badRequest(decodedUuid.failure.message)

    const slideshow = await runDb(regenerateSlideshowToken(decodedUuid.success))
    if (!slideshow) return notFound('Slideshow not found')

    return jsonOk({slideshow})
  } catch (error) {
    return internalServerError(error)
  }
}
