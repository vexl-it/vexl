import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {reportLocationServiceError} from '../../../utils/reportLocationServiceError'
import {transientRequestRetryPolicy} from '../../../utils/transientRequestRetryPolicy'
import {needsLocalizedAddressesRefresh} from './needsLocalizedAddressesRefresh'

/**
 * Refreshes `localizedAddresses` of every location missing a shipped app
 * language. Locations whose id the location service does not know (legacy
 * Google place ids) are kept as they are.
 */
export const refreshLocalizedAddressesForLocationsActionAtom = atom(
  null,
  (
    get,
    set,
    locations: readonly OfferLocation[]
  ): Effect.Effect<readonly OfferLocation[]> =>
    Effect.forEach(
      locations,
      (location) =>
        needsLocalizedAddressesRefresh(location)
          ? get(apiAtom)
              .location.getLocalizedAddresses({placeId: location.placeId})
              .pipe(
                Effect.map(
                  ({localizedAddresses}): OfferLocation => ({
                    ...location,
                    localizedAddresses,
                  })
                ),
                Effect.catchTag('LocationNotFoundError', () =>
                  Effect.succeed(location)
                ),
                Effect.retry(transientRequestRetryPolicy),
                Effect.catchAll((error) =>
                  Effect.sync(() => {
                    reportLocationServiceError(
                      'Refreshing localized addresses failed',
                      error
                    )
                    return location
                  })
                )
              )
          : Effect.succeed(location),
      {concurrency: 3}
    )
)
