import {normalizeName} from '../../places/common'

describe('normalizeName', () => {
  it('strips combining diacritics', () => {
    expect(normalizeName('Vídeň')).toEqual('viden')
    expect(normalizeName('Đà Nẵng')).toEqual('da nang')
  })

  it('transliterates non-decomposable letters', () => {
    expect(normalizeName('Łódź')).toEqual('lodz')
    expect(normalizeName('Ørsted')).toEqual('orsted')
    expect(normalizeName('Nøstved gæst')).toEqual('nostved gaest')
    expect(normalizeName('Hauptstraße')).toEqual('hauptstrasse')
    expect(normalizeName('Þingvellir')).toEqual('thingvellir')
    expect(normalizeName('Diyarbakır')).toEqual('diyarbakir')
    expect(normalizeName('Mellieħa')).toEqual('mellieha')
    expect(normalizeName('Gəncə')).toEqual('gence')
    expect(normalizeName('Kárášjohka-Ávjovárgeaidnu ŧ ŋ')).toEqual(
      'karasjohka-avjovargeaidnu t n'
    )
  })

  it('folds modifier-letter apostrophes to the ascii apostrophe', () => {
    expect(normalizeName('Qoʻqon')).toEqual("qo'qon")
    expect(normalizeName('Hawaiʻi')).toEqual("hawai'i")
  })

  it('handles uppercase forms via lowercasing first', () => {
    expect(normalizeName('ŁÓDŹ')).toEqual('lodz')
    expect(normalizeName('İstanbul')).toEqual('istanbul')
    expect(normalizeName('Iğdır')).toEqual('igdir')
  })

  it('passes non-latin scripts through, minus combining marks', () => {
    // NFKD also decomposes й/ї, so their breve/diaeresis are stripped — this is
    // fine because ingest and query time normalize identically.
    expect(normalizeName('Київ')).toEqual('киів')
    expect(normalizeName('東京')).toEqual('東京')
  })
})
