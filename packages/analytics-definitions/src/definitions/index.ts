import {type Schema} from 'effect'
import {type AggregationDefinition, type JourneyDefinition} from '../core'
import {activityDailyAggregation} from './activityDaily'
import {activityMonthlyAggregation} from './activityMonthly'
import {activityWeeklyAggregation} from './activityWeekly'
import {notificationOpenJourney} from './notificationOpen'
import {offerJourney} from './offer'
import {onboardingJourney} from './onboarding'
import {promptJourney} from './prompt'
import {reactivationJourney} from './reactivation'
import {requestJourney} from './request'

type WithContextFreePayload<D> = Omit<D, 'payloadSchema'> & {
  readonly payloadSchema: Schema.Schema.AnyNoContext
}

export type RegisteredAnalyticsDefinition =
  | WithContextFreePayload<JourneyDefinition<string, Schema.Struct.Fields>>
  | WithContextFreePayload<AggregationDefinition<string, Schema.Struct.Fields>>

export const analyticsDefinitions: Record<
  string,
  RegisteredAnalyticsDefinition
> = {
  onboarding: onboardingJourney,
  offer: offerJourney,
  request: requestJourney,
  reactivation: reactivationJourney,
  notificationOpen: notificationOpenJourney,
  prompt: promptJourney,
  activityDaily: activityDailyAggregation,
  activityWeekly: activityWeeklyAggregation,
  activityMonthly: activityMonthlyAggregation,
}
