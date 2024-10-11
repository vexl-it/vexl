import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {reportMetricForked} from '@vexl-next/server-utils/src/metrics/reportMetricForked'
import {type Effect} from 'effect'

const OFFER_PUBLIC_PART_DELETED = 'OFFER_PUBLIC_PART_DELETED' as const
const OFFER_MODIFIED = 'OFFER_MODIFIED' as const
const OFFER_CREATED = 'OFFER_CREATED' as const
const OFFER_REPORTED = 'OFFER_REPORTED' as const

export const reportOfferPublicPartDeleted = (): Effect.Effect<
  void,
  never,
  MetricsClientService
> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: OFFER_PUBLIC_PART_DELETED,
    })
  )

export const reportOfferModified = (): Effect.Effect<
  void,
  never,
  MetricsClientService
> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: OFFER_MODIFIED,
    })
  )

export const reportOfferCreated = (
  countryPrefix: CountryPrefix
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: OFFER_CREATED,
      attributes: {countryPrefix},
    })
  )

export const reportOfferReported = (
  offerId: OfferId
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: OFFER_REPORTED,
      attributes: {offerId},
    })
  )
