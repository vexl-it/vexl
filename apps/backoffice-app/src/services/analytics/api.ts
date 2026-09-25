import {jsonHeaders, requestJson} from '../adminFetch'
import {type AnalyticsDashboard} from './domain'

export const getAnalyticsDashboard = (
  adminToken: string
): Promise<AnalyticsDashboard> =>
  requestJson('/api/admin/analytics', {
    method: 'GET',
    headers: jsonHeaders(adminToken),
  })
