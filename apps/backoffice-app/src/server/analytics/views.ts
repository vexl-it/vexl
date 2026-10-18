import {
  type AnalyticsFilters,
  type AnalyticsView,
  type AnalyticsViewData,
} from '@/src/services/analytics/domain'
import {Effect} from 'effect'
import {loadActivity} from './activity'
import {loadChats} from './chats'
import {loadClubs} from './clubs'
import {largestCountries} from './countries'
import {loadFunnel} from './funnel'
import {loadLiquidity} from './liquidity'
import {loadNudges} from './nudges'
import {type QueryResult, type QueryScope} from './query'
import {loadRetention} from './retention'

const LOADERS: {
  readonly [V in AnalyticsView]: (
    scope: QueryScope
  ) => QueryResult<AnalyticsViewData[V]>
} = {
  funnel: loadFunnel,
  liquidity: loadLiquidity,
  activity: loadActivity,
  retention: loadRetention,
  clubs: loadClubs,
  nudges: loadNudges,
  chats: loadChats,
}

export const loadAnalyticsView = <V extends AnalyticsView>(
  view: V,
  filters: AnalyticsFilters
): QueryResult<AnalyticsViewData[V]> =>
  Effect.flatMap(largestCountries, (countries) =>
    LOADERS[view]({filters, largestCountries: countries})
  )
