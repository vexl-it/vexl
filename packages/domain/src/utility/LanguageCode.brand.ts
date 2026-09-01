import {Schema, type Option} from 'effect'

export const LanguageCode = Schema.String.pipe(
  Schema.pattern(/^[a-z]{2,3}$/),
  Schema.brand('LanguageCode')
)
export type LanguageCode = Schema.Schema.Type<typeof LanguageCode>

export const englishLanguageCode = Schema.decodeSync(LanguageCode)('en')

export function localeToLanguageCode(
  locale: string
): Option.Option<LanguageCode> {
  const primaryLanguageSubtag = locale
    .trim()
    .replace(/_/g, '-')
    .toLowerCase()
    .split('-')
    .at(0)

  return Schema.decodeUnknownOption(LanguageCode)(primaryLanguageSubtag)
}
