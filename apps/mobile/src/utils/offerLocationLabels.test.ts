import {
  getLocationCompactDisplayLabel,
  getLocationCompactDisplayLabelForLocations,
  getLocationFullDisplayLabel,
} from './offerLocationLabels'

type LocationLabelInput = Parameters<typeof getLocationFullDisplayLabel>[0]

describe('offerLocationLabels', () => {
  it('uses the full address when the short address is only numeric', () => {
    const location: LocationLabelInput = {
      address: '110 00 Prague, Czech Republic',
      shortAddress: '110 00',
    }

    expect(getLocationCompactDisplayLabel(location)).toBe(
      '110 00 Prague, Czech Republic'
    )
  })

  it('falls back from separator-only full address to meaningful short address', () => {
    const location: LocationLabelInput = {
      address: ', ',
      shortAddress: 'Prague',
    }

    expect(getLocationFullDisplayLabel(location)).toBe('Prague')
  })

  it('treats non-Latin location labels as meaningful', () => {
    const location: LocationLabelInput = {
      address: '東京都, 日本',
      shortAddress: '東京都',
    }

    expect(getLocationCompactDisplayLabel(location)).toBe('東京都')
  })

  it('keeps compact extra-location suffixes', () => {
    const location: LocationLabelInput = {
      address: 'Prague, Czech Republic',
      shortAddress: 'Prague',
    }
    const extraLocation: LocationLabelInput = {
      address: 'Brno, Czech Republic',
      shortAddress: 'Brno',
    }

    expect(
      getLocationCompactDisplayLabelForLocations([location, extraLocation])
    ).toBe('Prague +1')
  })
})
