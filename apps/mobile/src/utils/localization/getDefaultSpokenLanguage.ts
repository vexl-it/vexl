import {type SpokenLanguage} from '@vexl-next/domain/src/general/offers'
import {type LanguageCode} from '@vexl-next/domain/src/utility/LanguageCode.brand'

function getDefaultSpokenLanguage(language: LanguageCode): SpokenLanguage[] {
  switch (language) {
    case 'pt':
      return ['PRT']
    case 'es':
      return ['ESP']
    case 'de':
      return ['DEU']
    case 'sk':
      return ['SVK']
    case 'cs':
      return ['CZE']
    case 'it':
      return ['ITA']
    case 'fr':
      return ['FRA']
    default:
      return ['ENG']
  }
}

export default getDefaultSpokenLanguage
