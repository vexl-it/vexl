import {LanguageCode} from '@vexl-next/domain/src/utility/LanguageCode.brand'
import {Schema} from 'effect'
import {localizeMapStyleLabels} from './localizeMapStyleLabels'

const languageCode = Schema.decodeSync(LanguageCode)

// Mirrors the label expressions OpenFreeMap's positron/dark styles use.
const style = {
  version: 8,
  sources: {openmaptiles: {type: 'vector', url: 'https://example.com/planet'}},
  layers: [
    {
      id: 'place_city',
      type: 'symbol',
      layout: {
        'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
      },
    },
    {
      id: 'road_ref',
      type: 'symbol',
      layout: {'text-field': ['to-string', ['get', 'ref']]},
    },
    {
      id: 'water',
      type: 'fill',
      paint: {'fill-color': '#aad'},
    },
  ],
}

describe('localizeMapStyleLabels', () => {
  it('rewrites place-name labels to prefer the app language', () => {
    const result = localizeMapStyleLabels(
      JSON.stringify(style),
      languageCode('cs')
    )
    expect(result).not.toBeNull()
    const parsed = JSON.parse(result ?? '')

    expect(parsed.layers[0].layout['text-field']).toEqual([
      'coalesce',
      ['get', 'name:cs'],
      ['get', 'name:latin'],
      ['get', 'name'],
    ])
  })

  it('falls back to name:latin before the raw local name', () => {
    const result = localizeMapStyleLabels(
      JSON.stringify(style),
      languageCode('cs')
    )
    const parsed = JSON.parse(result ?? '')

    const textField = parsed.layers[0].layout['text-field']
    expect(textField[2]).toEqual(['get', 'name:latin'])
    expect(textField[3]).toEqual(['get', 'name'])
  })

  it('preserves three-letter language codes', () => {
    const result = localizeMapStyleLabels(
      JSON.stringify(style),
      languageCode('pcm')
    )
    const parsed = JSON.parse(result ?? '')

    expect(parsed.layers[0].layout['text-field'][1]).toEqual([
      'get',
      'name:pcm',
    ])
  })

  it('leaves non-name labels and non-symbol layers untouched', () => {
    const result = localizeMapStyleLabels(
      JSON.stringify(style),
      languageCode('cs')
    )
    const parsed = JSON.parse(result ?? '')

    expect(parsed.layers[1]).toEqual(style.layers[1])
    expect(parsed.layers[2]).toEqual(style.layers[2])
  })

  it('preserves all other style document fields', () => {
    const result = localizeMapStyleLabels(
      JSON.stringify(style),
      languageCode('cs')
    )
    const parsed = JSON.parse(result ?? '')

    expect(parsed.version).toEqual(8)
    expect(parsed.sources).toEqual(style.sources)
  })

  it('returns null for documents that are not a style', () => {
    expect(localizeMapStyleLabels('not json', languageCode('cs'))).toBeNull()
    expect(localizeMapStyleLabels('{"foo": 1}', languageCode('cs'))).toBeNull()
  })
})
