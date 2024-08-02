import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {Metric} from 'effect'

export const offerPublicPartDeletedCounter = Metric.counter(
  'analytics.offers.deletion.public_part',
  {
    description: 'How many offers was deleted (public parts - for each owner)',
  }
)

export const offerModifiedCounter = Metric.counter('analytics.offers.update', {
  description: 'How many offers was modified.',
})

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
