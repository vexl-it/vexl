import {Array, pipe, Record} from 'effect'

export interface VexlFontFace {
  /** Per-weight font name registered on native, matching the Tamagui `face` config. */
  readonly name: string
  /** Font family the Tamagui config renders with on web. */
  readonly family: string
  readonly weight: number
  readonly source: number
}

export const vexlFontFaces: readonly VexlFontFace[] = [
  {
    name: 'TTSatoshi400',
    family: 'TTSatoshi',
    weight: 400,
    source: require('./tt_satoshi_400.otf'),
  },
  {
    name: 'TTSatoshi500',
    family: 'TTSatoshi',
    weight: 500,
    source: require('./tt_satoshi_500.otf'),
  },
  {
    name: 'TTSatoshi600',
    family: 'TTSatoshi',
    weight: 600,
    source: require('./tt_satoshi_600.otf'),
  },
  {
    name: 'TTSatoshi700',
    family: 'TTSatoshi',
    weight: 700,
    source: require('./tt_satoshi_700.otf'),
  },
  {
    name: 'PPMonument400',
    family: 'MonumentExtended',
    weight: 400,
    source: require('./pp_monument_400.ttf'),
  },
  {
    name: 'PPMonument700',
    family: 'MonumentExtended',
    weight: 700,
    source: require('./pp_monument_700.ttf'),
  },
]

/**
 * Font map for use with expo-font's `useFonts` hook on native.
 * Keys match the face names declared in the Tamagui font config.
 */
export const vexlFonts = Record.fromIterableWith(
  vexlFontFaces,
  ({name, source}) => [name, source]
)

/**
 * `@font-face` rules for web. Tamagui ignores `face` on web and renders with
 * the family name plus `font-weight`, so each file is registered under its
 * family with a weight descriptor.
 */
export function getVexlFontFaceCss(
  resolveUrl: (face: VexlFontFace) => string
): string {
  return pipe(
    vexlFontFaces,
    Array.map(
      (face) =>
        `@font-face{font-family:${JSON.stringify(face.family)};font-weight:${face.weight};font-display:swap;src:url(${JSON.stringify(resolveUrl(face))})}`
    ),
    Array.join('\n')
  )
}
