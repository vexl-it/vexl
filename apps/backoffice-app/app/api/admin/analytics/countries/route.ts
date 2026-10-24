import {
  countryOptions,
  largestCountries,
} from '@/src/server/analytics/countries'
import {runMetricsDb} from '@/src/server/db'
import {internalServerError, jsonOk, requireAdmin} from '@/src/server/http'
import {type CountryOptionsResponse} from '@/src/services/analytics/domain'
import {Effect} from 'effect'
import {type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    return jsonOk(
      await runMetricsDb(
        Effect.map(
          largestCountries,
          (largest): CountryOptionsResponse => ({
            countries: countryOptions(largest),
          })
        )
      )
    )
  } catch (error) {
    return internalServerError(error)
  }
}
