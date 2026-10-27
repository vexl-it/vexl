import {jsonHeaders, requestJson} from '../adminFetch'
import {
  type AnalyticsFilters,
  type AnalyticsView,
  type AnalyticsViewData,
  type CountryOptionsResponse,
} from './domain'

export const getAnalyticsView = <V extends AnalyticsView>(
  adminToken: string,
  view: V,
  filters: AnalyticsFilters
): Promise<AnalyticsViewData[V]> =>
  requestJson(
    `/api/admin/analytics/${view}?${new URLSearchParams({...filters}).toString()}`,
    {method: 'GET', headers: jsonHeaders(adminToken)}
  )

export const getAnalyticsCountries = (
  adminToken: string
): Promise<CountryOptionsResponse> =>
  requestJson('/api/admin/analytics/countries', {
    method: 'GET',
    headers: jsonHeaders(adminToken),
  })
