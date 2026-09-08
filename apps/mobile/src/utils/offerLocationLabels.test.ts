import {LocalizedAddresses} from '@vexl-next/domain/src/general/offers'
import {
  englishLanguageCode,
  LanguageCode,
} from '@vexl-next/domain/src/utility/LanguageCode.brand'
import {Schema} from 'effect'
import {
  getLocationCompactDisplayLabel,
  getLocationCompactDisplayLabelForLocations,
  getLocationFullDisplayLabel,
} from './offerLocationLabels'

type LocationLabelInput = Parameters<typeof getLocationFullDisplayLabel>[0]
const decodeLocalizedAddresses = Schema.decodeSync(LocalizedAddresses)

describe('offerLocationLabels', () => {
  const appLanguage = englishLanguageCode

  it('uses the full address when the short address is only numeric', () => {
    const location: LocationLabelInput = {
      address: '110 00 Prague, Czech Republic',
      shortAddress: '110 00',
    }

    expect(getLocationCompactDisplayLabel(location, appLanguage)).toBe(
      '110 00 Prague, Czech Republic'
    )
  })

  it('falls back from separator-only full address to meaningful short address', () => {
    const location: LocationLabelInput = {
      address: ', ',
      shortAddress: 'Prague',
    }

    expect(getLocationFullDisplayLabel(location, appLanguage)).toBe('Prague')
  })

  it('treats non-Latin location labels as meaningful', () => {
    const location: LocationLabelInput = {
      address: '東京都, 日本',
      shortAddress: '東京都',
    }

    expect(getLocationCompactDisplayLabel(location, appLanguage)).toBe('東京都')
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
      getLocationCompactDisplayLabelForLocations(
        [location, extraLocation],
        appLanguage
      )
    ).toBe('Prague +1')
  })

  it('prefers a meaningful address in the viewer language', () => {
    const location: LocationLabelInput = {
      address: 'Praha, Česko',
      shortAddress: 'Praha',
      localizedAddresses: decodeLocalizedAddresses({
        en: 'Prague, Czechia',
      }),
    }

    expect(getLocationFullDisplayLabel(location, appLanguage)).toBe(
      'Prague, Czechia'
    )
    expect(getLocationCompactDisplayLabel(location, appLanguage)).toBe(
      'Prague, Czechia'
    )
  })

  it('ignores a non-meaningful localized address', () => {
    const location: LocationLabelInput = {
      address: 'Praha, Česko',
      shortAddress: 'Praha',
      localizedAddresses: decodeLocalizedAddresses({en: ', '}),
    }

    expect(getLocationFullDisplayLabel(location, appLanguage)).toBe(
      'Praha, Česko'
    )
  })

  it.each(['', '   ', ', ', '110 00'])(
    'falls back to English for an unusable viewer-language label %j',
    (viewerLabel) => {
      const location: LocationLabelInput = {
        address: 'Praha, Česko',
        shortAddress: 'Praha',
        localizedAddresses: decodeLocalizedAddresses({
          de: viewerLabel,
          en: 'Prague, Czechia',
        }),
      }
      const viewerLanguage = Schema.decodeSync(LanguageCode)('de')

      expect(getLocationFullDisplayLabel(location, viewerLanguage)).toBe(
        'Prague, Czechia'
      )
      expect(getLocationCompactDisplayLabel(location, viewerLanguage)).toBe(
        'Prague, Czechia'
      )
    }
  )

  it('falls back to English for a language the map does not cover', () => {
    const location: LocationLabelInput = {
      address: 'Praha, Česko',
      shortAddress: 'Praha',
      localizedAddresses: decodeLocalizedAddresses({en: 'Prague, Czechia'}),
    }
    const unshippedLanguage = Schema.decodeSync(LanguageCode)('ru')

    expect(getLocationFullDisplayLabel(location, unshippedLanguage)).toBe(
      'Prague, Czechia'
    )
    expect(getLocationCompactDisplayLabel(location, unshippedLanguage)).toBe(
      'Prague, Czechia'
    )
  })
})
