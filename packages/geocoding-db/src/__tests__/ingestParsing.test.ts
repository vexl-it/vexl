import {
  CountryIndex,
  encodeOsmId,
  geometryCenter,
  parseFeature,
} from '../../scripts/ingestParsing'
import {computeImportance} from '../common'

const RS = '\u001e'

const square = (
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number
): Array<[number, number]> => [
  [minLon, minLat],
  [maxLon, minLat],
  [maxLon, maxLat],
  [minLon, maxLat],
  [minLon, minLat],
]

const countryFeature = (
  properties: Record<string, unknown>,
  geometry: {type: string; coordinates: unknown}
): {
  properties: Record<string, unknown>
  geometry: {type: string; coordinates: unknown}
} => ({properties, geometry})

/**
 * Country "AA": 2°×2° square with a hole, country "BB": a triangular enclave
 * inside that hole (think Lesotho), country "CC": a MultiPolygon of two
 * separate squares far away.
 */
const testIndex = new CountryIndex({
  features: [
    countryFeature(
      {ISO_A2_EH: 'AA'},
      {
        type: 'Polygon',
        coordinates: [square(0, 0, 2, 2), square(0.8, 0.8, 1.4, 1.4)],
      }
    ),
    countryFeature(
      {ISO_A2_EH: 'BB'},
      {
        type: 'Polygon',
        coordinates: [
          [
            [0.9, 0.9],
            [1.3, 0.9],
            [1.3, 1.3],
            [0.9, 0.9],
          ],
        ],
      }
    ),
    countryFeature(
      {ISO_A2_EH: 'CC'},
      {
        type: 'MultiPolygon',
        coordinates: [[square(10, 10, 11, 11)], [square(14, 10, 15, 11)]],
      }
    ),
    // Natural Earth uses -99 as "no code" — must fall back to ISO_A2 / WB_A2
    countryFeature(
      {ISO_A2_EH: -99, ISO_A2: '-99', WB_A2: 'DD'},
      {type: 'Polygon', coordinates: [square(20, 20, 21, 21)]}
    ),
    // No usable code at all — the feature must be ignored entirely
    countryFeature(
      {ISO_A2_EH: -99, ISO_A2: '-99', WB_A2: '-99'},
      {type: 'Polygon', coordinates: [square(30, 30, 31, 31)]}
    ),
  ],
})

describe('encodeOsmId', () => {
  it('interleaves node/way/relation id spaces without collisions', () => {
    expect(encodeOsmId('n5')).toEqual(20)
    expect(encodeOsmId('w5')).toEqual(21)
    // Osmium areas: closed way 5 → areaId 10 (even), relation 5 → areaId 11
    expect(encodeOsmId('a10')).toEqual(21) // collapses with its w5 twin
    expect(encodeOsmId('a11')).toEqual(22) // relation 5 → 5*4+2
  })

  it('maps every area id back to its source object encoding', () => {
    for (let id = 1; id <= 50; id++) {
      expect(encodeOsmId(`a${id * 2}`)).toEqual(encodeOsmId(`w${id}`))
      expect(encodeOsmId(`a${id * 2 + 1}`)).toEqual(id * 4 + 2)
    }
  })

  it('rejects malformed ids', () => {
    expect(encodeOsmId('n0')).toBeNull()
    expect(encodeOsmId('w-3')).toBeNull()
    expect(encodeOsmId('nabc')).toBeNull()
    expect(encodeOsmId('x5')).toBeNull()
    expect(encodeOsmId('')).toBeNull()
  })
})

describe('CountryIndex', () => {
  it('resolves a point with a single candidate country without ray casting', () => {
    expect(testIndex.lookup(0.2, 0.2)).toEqual('aa')
  })

  it('resolves an enclave country inside another country hole', () => {
    // (1.0, 1.0) is inside AA's hole and inside the BB triangle
    expect(testIndex.lookup(1.0, 1.0)).toEqual('bb')
  })

  it('excludes points inside a polygon hole from the outer country', () => {
    // (0.95, 1.25) is inside AA's hole, inside BB's bbox, but above BB's
    // hypotenuse — no exact match, so the first bbox candidate wins
    expect(testIndex.lookup(0.95, 1.25)).toEqual('aa')
  })

  it('handles MultiPolygon countries in all their parts', () => {
    expect(testIndex.lookup(10.5, 10.5)).toEqual('cc')
    expect(testIndex.lookup(14.5, 10.5)).toEqual('cc')
    expect(testIndex.lookup(12.5, 10.5)).toBeNull() // gap between the parts
  })

  it('falls back through ISO_A2_EH → ISO_A2 → WB_A2 for the country code', () => {
    expect(testIndex.lookup(20.5, 20.5)).toEqual('dd')
  })

  it('ignores features without any usable ISO code', () => {
    expect(testIndex.lookup(30.5, 30.5)).toBeNull()
  })

  it('returns null in the open ocean', () => {
    expect(testIndex.lookup(-50, -50)).toBeNull()
  })
})

describe('geometryCenter', () => {
  it('returns point coordinates directly', () => {
    expect(geometryCenter({type: 'Point', coordinates: [1, 2]})).toEqual([1, 2])
  })

  it('returns the middle vertex of a LineString', () => {
    expect(
      geometryCenter({
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
          [2, 2],
          [9, 9],
        ],
      })
    ).toEqual([2, 2])
  })

  it('returns the middle vertex of the first line of a MultiLineString', () => {
    expect(
      geometryCenter({
        type: 'MultiLineString',
        coordinates: [
          [
            [0, 0],
            [2, 2],
            [4, 4],
          ],
          [[9, 9]],
        ],
      })
    ).toEqual([2, 2])
  })

  it('returns the outer ring bbox center of a Polygon', () => {
    expect(
      geometryCenter({type: 'Polygon', coordinates: [square(0, 0, 4, 2)]})
    ).toEqual([2, 1])
  })

  it('returns the first polygon bbox center of a MultiPolygon', () => {
    expect(
      geometryCenter({
        type: 'MultiPolygon',
        coordinates: [[square(0, 0, 4, 2)], [square(10, 10, 20, 20)]],
      })
    ).toEqual([2, 1])
  })

  it('rejects malformed coordinates', () => {
    expect(geometryCenter({type: 'Point', coordinates: 'oops'})).toBeNull()
    expect(
      geometryCenter({type: 'Polygon', coordinates: [[['a', 'b']]]})
    ).toBeNull()
    expect(geometryCenter({type: 'Unknown', coordinates: []})).toBeNull()
  })
})

describe('parseFeature', () => {
  const featureLine = (feature: object): string => RS + JSON.stringify(feature)

  const node = (
    id: string,
    lon: number,
    lat: number,
    properties: Record<string, string>
  ): string =>
    featureLine({
      id,
      geometry: {type: 'Point', coordinates: [lon, lat]},
      properties,
    })

  it('parses a settlement node with translations, population and country', () => {
    const parsed = parseFeature(
      node('n7', 0.5, 0.5, {
        place: 'city',
        name: 'Vysoké Mýto',
        'name:de': 'Hohenmauth',
        'name:xx': 'Unsupported',
        'name:cs': '   ',
        population: '12345',
      }),
      testIndex
    )

    if (parsed?.kind !== 'place') throw new Error('Expected a place')
    expect(parsed.place).toEqual({
      id: String(7 * 4),
      place_type: 'city',
      name: 'Vysoké Mýto',
      names: {de: 'Hohenmauth'},
      country_code: 'aa',
      population: '12345',
      importance: computeImportance('city', 12345),
      latitude: 0.5,
      longitude: 0.5,
      geom_rank: 0,
    })
    expect(parsed.names).toEqual([
      {
        place_id: String(7 * 4),
        norm_name: 'vysoke myto',
        importance: computeImportance('city', 12345),
      },
      {
        place_id: String(7 * 4),
        norm_name: 'hohenmauth',
        importance: computeImportance('city', 12345),
      },
    ])
  })

  it.each([['abc'], ['-5'], ['250000000'], ['0']])(
    'discards implausible population %s',
    (population) => {
      const parsed = parseFeature(
        node('n1', 0.5, 0.5, {place: 'town', name: 'Town', population}),
        testIndex
      )
      if (parsed?.kind !== 'place') throw new Error('Expected a place')
      expect(parsed.place.population).toBeNull()
      expect(parsed.place.importance).toEqual(
        computeImportance('town', undefined)
      )
    }
  )

  it('deduplicates name rows that normalize identically', () => {
    const parsed = parseFeature(
      node('n2', 0.5, 0.5, {
        place: 'city',
        name: 'Łódź',
        'name:en': 'Lodz',
        'name:de': 'Lodz',
      }),
      testIndex
    )
    if (parsed?.kind !== 'place') throw new Error('Expected a place')
    expect(parsed.names.map((one) => one.norm_name)).toEqual(['lodz'])
  })

  it('rejects unsupported settlement types and non-node settlements', () => {
    expect(
      parseFeature(
        node('n3', 0.5, 0.5, {place: 'locality', name: 'Somewhere'}),
        testIndex
      )
    ).toBeNull()
    expect(
      parseFeature(
        featureLine({
          id: 'w3',
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          properties: {place: 'city', name: 'Way City'},
        }),
        testIndex
      )
    ).toBeNull()
  })

  it('parses a street way with normalized name and ~10 km grid cell', () => {
    const parsed = parseFeature(
      featureLine({
        id: 'w9',
        geometry: {
          type: 'LineString',
          coordinates: [
            [0.5, 0.5],
            [0.512, 0.531],
            [0.52, 0.55],
          ],
        },
        properties: {highway: 'residential', name: 'Łódźka'},
      }),
      testIndex
    )

    if (parsed?.kind !== 'street') throw new Error('Expected a street')
    expect(parsed.segment).toEqual({
      seg_id: String(9 * 4 + 1),
      norm_name: 'lodzka',
      name: 'Łódźka',
      country_code: 'aa',
      latitude: 0.531,
      longitude: 0.512,
      grid_lat: Math.round(0.531 * 10),
      grid_lon: Math.round(0.512 * 10),
    })
  })

  it('rejects non-street highways, highway nodes and unnormalizable names', () => {
    expect(
      parseFeature(
        featureLine({
          id: 'w10',
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          properties: {highway: 'service', name: 'Back Alley'},
        }),
        testIndex
      )
    ).toBeNull()
    expect(
      parseFeature(
        node('n10', 0.5, 0.5, {highway: 'residential', name: 'Node Street'}),
        testIndex
      )
    ).toBeNull()
    expect(
      parseFeature(
        featureLine({
          id: 'w11',
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          // A lone combining acute accent normalizes to an empty string
          properties: {highway: 'residential', name: '́'},
        }),
        testIndex
      )
    ).toBeNull()
  })

  it.each([
    ['amenity', 'cafe', 'cafe'],
    ['amenity', 'fast_food', 'fast_food'],
    ['leisure', 'garden', 'garden'],
    ['tourism', 'attraction', 'attraction'],
  ])('classifies %s=%s as a %s POI', (tag, value, expectedType) => {
    const parsed = parseFeature(
      node('n20', 0.5, 0.5, {[tag]: value, name: 'Spot'}),
      testIndex
    )
    if (parsed?.kind !== 'place') throw new Error('Expected a place')
    expect(parsed.place.place_type).toEqual(expectedType)
    expect(parsed.place.population).toBeNull()
    expect(parsed.place.importance).toEqual(
      computeImportance(expectedType, undefined)
    )
  })

  it('ignores POI tags with unindexed values', () => {
    expect(
      parseFeature(
        node('n21', 0.5, 0.5, {amenity: 'school', name: 'School'}),
        testIndex
      )
    ).toBeNull()
  })

  it('ranks polygon POIs above point/linestring twins and centers them', () => {
    const parsed = parseFeature(
      featureLine({
        id: 'a18', // area from closed way 9 → same id as w9
        geometry: {type: 'Polygon', coordinates: [square(0.4, 0.4, 0.6, 0.8)]},
        properties: {leisure: 'park', name: 'City Park'},
      }),
      testIndex
    )
    if (parsed?.kind !== 'place') throw new Error('Expected a place')
    expect(parsed.place.id).toEqual(String(9 * 4 + 1))
    expect(parsed.place.geom_rank).toEqual(1)
    expect(parsed.place.longitude).toBeCloseTo(0.5)
    expect(parsed.place.latitude).toBeCloseTo(0.6)
  })

  it('accepts lines with and without the RS prefix', () => {
    const raw = JSON.stringify({
      id: 'n30',
      geometry: {type: 'Point', coordinates: [0.5, 0.5]},
      properties: {place: 'village', name: 'Plainville'},
    })
    expect(parseFeature(raw, testIndex)?.kind).toEqual('place')
    expect(parseFeature(RS + raw, testIndex)?.kind).toEqual('place')
  })

  it('skips blank, malformed and incomplete lines', () => {
    expect(parseFeature('', testIndex)).toBeNull()
    expect(parseFeature(RS, testIndex)).toBeNull()
    expect(parseFeature('not json', testIndex)).toBeNull()
    expect(parseFeature(featureLine({id: 'n1'}), testIndex)).toBeNull()
    expect(
      parseFeature(
        featureLine({
          geometry: {type: 'Point', coordinates: [0, 0]},
          properties: {place: 'city', name: 'No Id'},
        }),
        testIndex
      )
    ).toBeNull()
    expect(
      parseFeature(
        node('n31', 0.5, 0.5, {place: 'city', name: '   '}),
        testIndex
      )
    ).toBeNull()
  })
})
