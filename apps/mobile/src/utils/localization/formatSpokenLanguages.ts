import {type SpokenLanguage} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'

const spokenLanguageToShortCode: Record<SpokenLanguage, string> = {
  ENG: 'en',
  DEU: 'de',
  CZE: 'cs',
  SVK: 'sk',
  PRT: 'pt',
  FRA: 'fr',
  ITA: 'it',
  ESP: 'es',
  BG: 'bg',
  FAS: 'fa',
}

export default function formatSpokenLanguages(
  languages: readonly SpokenLanguage[]
): string {
  return pipe(
    languages,
    Array.map((language) => spokenLanguageToShortCode[language]),
    Array.join(', ')
  )
}
