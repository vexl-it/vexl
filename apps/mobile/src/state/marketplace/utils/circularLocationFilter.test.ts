import {
  LocationPlaceId,
  type OfferLocation,
} from '@vexl-next/domain/src/general/offers'
import {
  Latitude,
  Longitude,
  Radius,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Array, pipe, Schema} from 'effect'
import {
  filterLocationsByCircularLocationFilter,
  isLocationInsideCircularLocationFilter,
} from './circularLocationFilter'

function makeLocation({
  id,
  latitude,
  longitude,
  radius,
}: {
  id: string
  latitude: number
  longitude: number
  radius: number
}): OfferLocation {
  return {
    placeId: Schema.decodeSync(LocationPlaceId)(id),
    latitude: Schema.decodeSync(Latitude)(latitude),
    longitude: Schema.decodeSync(Longitude)(longitude),
    radius: Schema.decodeSync(Radius)(radius),
    address: id,
    shortAddress: id,
  }
}

describe('circularLocationFilter', () => {
  const filterLocation = makeLocation({
    id: 'filter',
    latitude: 0,
    longitude: 0,
    radius: 1,
  })

  test('matches a pin inside the selected circle', () => {
    const offerLocation = makeLocation({
      id: 'inside',
      latitude: 0,
      longitude: 0.5,
      radius: 0.00001,
    })

    expect(
      isLocationInsideCircularLocationFilter({
        location: offerLocation,
        locationFilter: [filterLocation],
      })
    ).toBe(true)
  })

  test('does not match a pin in the old square corner outside the circle', () => {
    const offerLocation = makeLocation({
      id: 'corner',
      latitude: 0.9,
      longitude: 0.9,
      radius: 0.00001,
    })

    expect(
      isLocationInsideCircularLocationFilter({
        location: offerLocation,
        locationFilter: [filterLocation],
      })
    ).toBe(false)
  })

  test('matches two location circles that overlap', () => {
    const offerLocation = makeLocation({
      id: 'overlapping',
      latitude: 0,
      longitude: 1.5,
      radius: 0.7,
    })

    expect(
      isLocationInsideCircularLocationFilter({
        location: offerLocation,
        locationFilter: [filterLocation],
      })
    ).toBe(true)
  })

  test('matches when any selected filter location overlaps', () => {
    const farFilterLocation = makeLocation({
      id: 'far-filter',
      latitude: 40,
      longitude: 40,
      radius: 0.1,
    })
    const offerLocation = makeLocation({
      id: 'inside',
      latitude: 0,
      longitude: 0.5,
      radius: 0.00001,
    })

    expect(
      isLocationInsideCircularLocationFilter({
        location: offerLocation,
        locationFilter: [farFilterLocation, filterLocation],
      })
    ).toBe(true)
  })

  test('returns only matching locations for map pins', () => {
    const matchingLocation = makeLocation({
      id: 'matching',
      latitude: 0,
      longitude: 0.5,
      radius: 0.00001,
    })
    const nonMatchingLocation = makeLocation({
      id: 'outside',
      latitude: 3,
      longitude: 3,
      radius: 0.00001,
    })

    expect(
      pipe(
        filterLocationsByCircularLocationFilter({
          locations: [matchingLocation, nonMatchingLocation],
          locationFilter: [filterLocation],
        }),
        Array.map((location) => location.placeId)
      )
    ).toEqual([matchingLocation.placeId])
  })
})
