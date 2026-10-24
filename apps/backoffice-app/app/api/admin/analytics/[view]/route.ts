import {loadAnalyticsView} from '@/src/server/analytics/views'
import {runMetricsDb} from '@/src/server/db'
import {
  badRequest,
  internalServerError,
  jsonOk,
  requireAdmin,
} from '@/src/server/http'
import {AnalyticsFilters, AnalyticsView} from '@/src/services/analytics/domain'
import {Either, Schema} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{
    readonly view: string
  }>
}

const decodeRequest = Schema.decodeUnknownEither(
  Schema.Struct({view: AnalyticsView, filters: AnalyticsFilters})
)

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const decoded = decodeRequest({
      view: (await context.params).view,
      filters: Object.fromEntries(request.nextUrl.searchParams),
    })
    if (Either.isLeft(decoded)) return badRequest(decoded.left.message)

    return jsonOk(
      await runMetricsDb(
        loadAnalyticsView(decoded.right.view, decoded.right.filters)
      )
    )
  } catch (error) {
    return internalServerError(error)
  }
}
