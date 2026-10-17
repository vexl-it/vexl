import {requestJson} from '../adminFetch'
import {
  type AnalyticsFilters,
  type AnalyticsView,
  type AnalyticsViewData,
  type CountryOptionsResponse,
} from './domain'

export const getAnalyticsView = <V extends AnalyticsView>(
  view: V,
  filters: AnalyticsFilters
): Promise<AnalyticsViewData[V]> =>
  requestJson(
    `/api/admin/analytics/${view}?${new URLSearchParams({...filters}).toString()}`,
    {method: 'GET'}
  )

export const getAnalyticsCountries = (): Promise<CountryOptionsResponse> =>
  requestJson('/api/admin/analytics/countries', {method: 'GET'})
