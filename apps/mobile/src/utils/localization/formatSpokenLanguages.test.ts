import formatSpokenLanguages from './formatSpokenLanguages'

describe('formatSpokenLanguages', () => {
  it('formats spoken languages as comma-separated short codes', () => {
    expect(
      formatSpokenLanguages([
        'ENG',
        'DEU',
        'CZE',
        'SVK',
        'PRT',
        'FRA',
        'ITA',
        'ESP',
        'BG',
        'FAS',
      ])
    ).toBe('en, de, cs, sk, pt, fr, it, es, bg, fa')
  })
})
