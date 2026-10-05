import {loadAnalyticsDashboard} from '@/src/server/analytics/dashboard'
import {runMetricsDb} from '@/src/server/db'
import {internalServerError, jsonOk, requireAdmin} from '@/src/server/http'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    return jsonOk(await runMetricsDb(loadAnalyticsDashboard))
  } catch (error) {
    return internalServerError(error)
  }
}
