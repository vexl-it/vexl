import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {Metric} from 'effect'

export const makeOfferCreatedCounter = (
  countryPrefix: CountryPrefix
): Metric.Metric.Counter<number> =>
  Metric.counter('analytics.offers.created', {
    description: 'How many offers were created',
  }).pipe(Metric.tagged('countryPrefix', String(countryPrefix)))

export const makeOfferReportedCounter = (
  offerId: OfferId
): Metric.Metric.Counter<number> =>
  Metric.counter('analytics.offers.reported', {
    description: 'How many times was offer reported',
  }).pipe(Metric.tagged('offerId', String(offerId)))

export const countactsCountUniqueUsersGauge = Metric.gauge(
  'analytics.contacts.count_unique_users',
  {
    description: 'Number of unique users',
  }
)

export const uniqueContactsGauge = Metric.gauge(
  'analytics.contacts.count_unique_contacts_2',
  {
    description: 'Number of unique contacts',
  }
)

export const countOfConnectionsGauge = Metric.gauge(
  'analytics.contacts.count_of_connections',
  {
    description: 'Total number of connections',
  }
)

export const userRefreshGauge = Metric.counter(
  'analytics.contacts.user_refresh',
  {
    description: 'Increments when user calls /refresh endpoint',
  }
)
