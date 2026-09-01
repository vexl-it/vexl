import {LanguageCode} from '@vexl-next/domain/src/utility/LanguageCode.brand'
import {Schema} from 'effect'
import getDefaultSpokenLanguage from './getDefaultSpokenLanguage'

describe('getDefaultSpokenLanguage', () => {
  it.each([
    ['pt', 'PRT'],
    ['es', 'ESP'],
    ['de', 'DEU'],
    ['sk', 'SVK'],
    ['cs', 'CZE'],
    ['it', 'ITA'],
    ['fr', 'FRA'],
  ])('maps %s to %s', (language, spokenLanguage) => {
    expect(
      getDefaultSpokenLanguage(Schema.decodeSync(LanguageCode)(language))
    ).toEqual([spokenLanguage])
  })

  it('defaults to English for an unmapped language', () => {
    expect(
      getDefaultSpokenLanguage(Schema.decodeSync(LanguageCode)('ja'))
    ).toEqual(['ENG'])
  })
})
