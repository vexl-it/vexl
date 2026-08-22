import {Option} from 'effect'
import {
  BoundaryCandidate,
  resolveBoundaryCandidates,
} from '../GeocodingDbService/resolveBoundaryCandidates'
import {
  boundaryPlaceType,
  boundaryRole,
  CITY_TYPES,
  MUNICIPALITY_TYPE,
  SETTLEMENT_TYPE_WEIGHTS,
  SUB_CITY_TYPES,
} from '../common'

const administrative = (
  countryCode: string | null,
  adminLevel: number,
  placeTag: string | null = null
): Parameters<typeof boundaryRole>[0] => ({
  countryCode,
  boundaryType: 'administrative',
  adminLevel,
  placeTag,
})

describe('settlement type vocabulary', () => {
  it('splits every settlement type into exactly one label role', () => {
    expect(
      [...CITY_TYPES, MUNICIPALITY_TYPE, ...SUB_CITY_TYPES].sort()
    ).toEqual(Object.keys(SETTLEMENT_TYPE_WEIGHTS).sort())
  })
})

describe('boundaryRole', () => {
  it('maps municipalities to city and their parts to sub-city by default', () => {
    expect(boundaryRole(administrative('cz', 8))).toEqual('city')
    expect(boundaryRole(administrative('de', 9))).toEqual('subCity')
    expect(boundaryRole(administrative('fr', 10))).toEqual('subCity')
    expect(boundaryRole(administrative('xx', 11))).toEqual('subCity')
    expect(boundaryRole(administrative(null, 8))).toEqual('city')
  })

  it('ignores county and national levels by default', () => {
    expect(boundaryRole(administrative('cz', 6))).toEqual('ignore')
    expect(boundaryRole(administrative('cz', 7))).toEqual('ignore')
    expect(boundaryRole(administrative('cz', 4))).toEqual('ignore')
    expect(boundaryRole(administrative('cz', 12))).toEqual('ignore')
  })

  it('applies per-country level overrides without a re-ingest', () => {
    // Nordic kommuner sit at level 7
    expect(boundaryRole(administrative('no', 7))).toEqual('city')
    expect(boundaryRole(administrative('se', 7))).toEqual('city')
    expect(boundaryRole(administrative('dk', 7))).toEqual('city')
    // Austrian Katastralgemeinden at 10 are noise next to the Bezirke at 9
    expect(boundaryRole(administrative('at', 10))).toEqual('ignore')
    expect(boundaryRole(administrative('at', 9))).toEqual('subCity')
    // Portuguese concelho / freguesia
    expect(boundaryRole(administrative('pt', 7))).toEqual('city')
    expect(boundaryRole(administrative('pt', 8))).toEqual('subCity')
    // Levels not listed in the override keep the default
    expect(boundaryRole(administrative('pt', 9))).toEqual('subCity')
  })

  it('lets a place tag on the boundary win over the admin level', () => {
    expect(boundaryRole(administrative('de', 6, 'city'))).toEqual('city')
    expect(boundaryRole(administrative('de', 4, 'city'))).toEqual('city')
    expect(boundaryRole(administrative('cz', 8, 'village'))).toEqual('subCity')
    expect(boundaryRole(administrative('cz', 8, 'town'))).toEqual('city')
    // An unknown place tag falls through to the level
    expect(boundaryRole(administrative('cz', 8, 'county'))).toEqual('city')
  })

  it('maps place polygons by their settlement type', () => {
    const place = (placeTag: string): Parameters<typeof boundaryRole>[0] => ({
      countryCode: 'us',
      boundaryType: 'place',
      adminLevel: null,
      placeTag,
    })
    expect(boundaryRole(place('city'))).toEqual('city')
    expect(boundaryRole(place('municipality'))).toEqual('city')
    expect(boundaryRole(place('suburb'))).toEqual('subCity')
    expect(boundaryRole(place('neighbourhood'))).toEqual('subCity')
    expect(boundaryRole(place('hamlet'))).toEqual('subCity')
    expect(boundaryRole(place('locality'))).toEqual('ignore')
  })

  it('keeps cadastral areas as a Czech sub-city extra', () => {
    const cadastral = (
      countryCode: string | null
    ): Parameters<typeof boundaryRole>[0] => ({
      countryCode,
      boundaryType: 'cadastral',
      adminLevel: null,
      placeTag: null,
    })
    expect(boundaryRole(cadastral('cz'))).toEqual('subCity')
    expect(boundaryRole(cadastral('at'))).toEqual('ignore')
    expect(boundaryRole(cadastral(null))).toEqual('ignore')
  })
})

describe('boundaryPlaceType', () => {
  it('reports the place tag when present, otherwise a generic type per role', () => {
    expect(boundaryPlaceType('city', 'town')).toEqual('town')
    expect(boundaryPlaceType('subCity', 'neighbourhood')).toEqual(
      'neighbourhood'
    )
    expect(boundaryPlaceType('city', null)).toEqual('municipality')
    expect(boundaryPlaceType('subCity', null)).toEqual('suburb')
  })
})

describe('resolveBoundaryCandidates', () => {
  const candidate = (
    id: number,
    overrides: Partial<BoundaryCandidate>
  ): BoundaryCandidate =>
    new BoundaryCandidate({
      id: BoundaryCandidate.fields.id.make(BigInt(id)),
      name: `Boundary ${id}`,
      names: {},
      countryCode: 'cz',
      boundaryType: 'administrative',
      adminLevel: 8,
      placeTag: null,
      areaMeters: 1000,
      distanceDeg: 0,
      ...overrides,
    })

  it('picks the smallest covering sub-city and city boundary', () => {
    const resolved = resolveBoundaryCandidates([
      candidate(1, {adminLevel: 8, areaMeters: 500_000}),
      candidate(2, {adminLevel: 9, areaMeters: 50_000}),
      candidate(3, {
        boundaryType: 'cadastral',
        adminLevel: null,
        areaMeters: 5_000,
      }),
      candidate(4, {adminLevel: 6, areaMeters: 5_000_000}),
    ])
    expect(Option.getOrThrow(resolved.subCity).id).toEqual(3n)
    expect(Option.getOrThrow(resolved.city).id).toEqual(1n)
  })

  it('prefers a covering boundary over a nearer-by-area sliver neighbour', () => {
    const resolved = resolveBoundaryCandidates([
      candidate(1, {adminLevel: 10, areaMeters: 100, distanceDeg: 0.00005}),
      candidate(2, {adminLevel: 10, areaMeters: 10_000, distanceDeg: 0}),
    ])
    expect(Option.getOrThrow(resolved.subCity).id).toEqual(2n)
    expect(Option.isNone(resolved.city)).toBe(true)
  })

  it('uses the nearest boundary when the pin sits in a sliver between two', () => {
    const resolved = resolveBoundaryCandidates([
      candidate(1, {adminLevel: 10, areaMeters: 100, distanceDeg: 0.00015}),
      candidate(2, {adminLevel: 10, areaMeters: 10_000, distanceDeg: 0.00005}),
    ])
    expect(Option.getOrThrow(resolved.subCity).id).toEqual(2n)
  })

  it('takes the country from the largest covering boundary', () => {
    const resolved = resolveBoundaryCandidates([
      candidate(1, {adminLevel: 10, areaMeters: 100, countryCode: 'pl'}),
      candidate(2, {adminLevel: 8, areaMeters: 10_000, countryCode: 'cz'}),
      candidate(3, {adminLevel: 6, areaMeters: 1_000_000, countryCode: null}),
      candidate(4, {
        adminLevel: 8,
        areaMeters: 99_000_000,
        countryCode: 'de',
        distanceDeg: 0.0001,
      }),
    ])
    expect(Option.getOrThrow(resolved.countryCode)).toEqual('cz')
    expect(Option.isNone(resolveBoundaryCandidates([]).countryCode)).toBe(true)
  })

  it('leaves ignored roles out entirely', () => {
    const resolved = resolveBoundaryCandidates([
      candidate(1, {adminLevel: 6}),
      candidate(2, {
        countryCode: 'at',
        boundaryType: 'cadastral',
        adminLevel: null,
      }),
    ])
    expect(Option.isNone(resolved.subCity)).toBe(true)
    expect(Option.isNone(resolved.city)).toBe(true)
  })
})
