import {runDb} from '@/src/server/slideshows/db'
import {
  internalServerError,
  jsonOk,
  notFound,
} from '@/src/server/slideshows/http'
import {findEnabledSlideshowByPublicIdentifier} from '@/src/server/slideshows/repository'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{
    readonly publicToken: string
  }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const {publicToken} = await context.params
    const slideshow = await runDb(
      findEnabledSlideshowByPublicIdentifier(publicToken)
    )

    if (!slideshow) return notFound('Slideshow not found')

    return jsonOk({slideshow})
  } catch (error) {
    return internalServerError(error)
  }
}
