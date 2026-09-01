import {type LanguageCode} from '@vexl-next/domain/src/utility/LanguageCode.brand'
import {Array, pipe} from 'effect'

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !globalThis.Array.isArray(value)
  )
}

/**
 * Matches text-fields that render place names — `["get", "name_en"]`
 * expressions or `{name:latin}` style tokens — while leaving other labels
 * (road refs, house numbers) untouched.
 */
const PLACE_NAME_TEXT_FIELD_REGEX = /["{]name/

/**
 * Rewrites every place-name label layer of a MapLibre style to prefer the
 * given language, falling back to the latin transliteration and finally the
 * place's local name. This is the same
 * transform the official maplibre-gl-language plugin performs — the engine
 * itself has no label-language setting, it just evaluates `text-field`.
 *
 * Runs once per style load; label rendering stays fully native afterwards.
 *
 * @returns the localized style as a JSON string, or null when the input is
 * not a parseable style document.
 */
export function localizeMapStyleLabels(
  styleJson: string,
  language: LanguageCode
): string | null {
  let style: unknown
  try {
    style = JSON.parse(styleJson)
  } catch {
    return null
  }
  if (!isRecord(style) || !globalThis.Array.isArray(style.layers)) return null

  const localizedNameExpression = [
    'coalesce',
    ['get', `name:${language}`],
    ['get', 'name:latin'],
    ['get', 'name'],
  ]

  const layers = pipe(
    style.layers,
    Array.map((layer: unknown) => {
      if (!isRecord(layer) || !isRecord(layer.layout)) return layer
      const textField = layer.layout['text-field']
      if (
        textField === undefined ||
        !PLACE_NAME_TEXT_FIELD_REGEX.test(JSON.stringify(textField))
      )
        return layer

      return {
        ...layer,
        layout: {...layer.layout, 'text-field': localizedNameExpression},
      }
    })
  )

  return JSON.stringify({...style, layers})
}
