import fs from 'node:fs'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'

import {checkTranslations} from '../scripts/checkTranslations.mjs'
import {APP_LOCALES} from '../scripts/generateTranslations.mjs'
import {cleanupLocaleTrees, makeLocaleTree} from './helpers.mjs'

afterEach(cleanupLocaleTrees)

const appLocales = new Set(APP_LOCALES.map(([locale]) => locale))

// The default shipped set is all APP_LOCALES; fixture trees only carry a few
// locales, so restrict the shipped set to those present in the fixture.
function fixtureShippedLocales(spec) {
  return Object.keys(spec).filter(
    (locale) => locale !== 'en' && appLocales.has(locale)
  )
}

function run(spec, options = {}) {
  return checkTranslations({
    localesRoot: makeLocaleTree(spec),
    skipCodegenCheck: true,
    shippedLocales: fixtureShippedLocales(spec),
    ...options,
  })
}

function errorsOfType(report, type) {
  return report.errors.filter((error) => error.type === type)
}

describe('checkTranslations', () => {
  it('passes on a complete tree', () => {
    const report = run({
      en: {common: {'greeting.hello': 'Hello {{name}}'}},
      cs: {common: {'greeting.hello': 'Ahoj {{name}}'}},
    })
    expect(report.ok).toBe(true)
    expect(report.errors).toEqual([])
  })

  it('fails on a missing key in a shipped locale', () => {
    const report = run({
      en: {common: {'greeting.hello': 'Hello', 'greeting.bye': 'Bye'}},
      cs: {common: {'greeting.hello': 'Ahoj'}},
    })
    expect(report.ok).toBe(false)
    expect(errorsOfType(report, 'missingKey')).toEqual([
      expect.objectContaining({
        locale: 'cs',
        file: 'common.json',
        key: 'greeting.bye',
      }),
    ])
  })

  it('fails per key when a whole shipped locale file is missing', () => {
    const report = run({
      en: {common: {'greeting.hello': 'Hello', 'greeting.bye': 'Bye'}},
      cs: {},
    })
    expect(
      errorsOfType(report, 'missingKey')
        .map((error) => error.key)
        .sort()
    ).toEqual(['greeting.bye', 'greeting.hello'])
  })

  it('ignores missing keys in unshipped locales', () => {
    const report = run({
      en: {common: {'greeting.hello': 'Hello', 'greeting.bye': 'Bye'}},
      cs: {common: {'greeting.hello': 'Ahoj', 'greeting.bye': 'Čau'}},
      uk: {common: {'greeting.hello': 'Привіт'}},
    })
    expect(report.ok).toBe(true)
  })

  it('fails on placeholder mismatch in a non-plural key', () => {
    const report = run({
      en: {common: {'user.greeting': 'Hello {{name}}'}},
      cs: {common: {'user.greeting': 'Ahoj {{jmeno}}'}},
    })
    expect(errorsOfType(report, 'placeholderMismatch')).toEqual([
      expect.objectContaining({
        locale: 'cs',
        file: 'common.json',
        key: 'user.greeting',
      }),
    ])
  })

  it('extracts placeholder names from {{var, format}}', () => {
    const okReport = run({
      en: {common: {'items.count': 'You have {{count, number}} items'}},
      cs: {common: {'items.count': 'Máte {{count}} položek'}},
    })
    expect(okReport.ok).toBe(true)

    const failingReport = run({
      en: {common: {'items.count': 'You have {{count, number}} items'}},
      cs: {common: {'items.count': 'Máte {{pocet, number}} položek'}},
    })
    expect(errorsOfType(failingReport, 'placeholderMismatch')).toHaveLength(1)
  })

  it('requires all CLDR plural categories per locale', () => {
    const enFiles = {
      common: {
        'offers.count_one': '{{count}} offer',
        'offers.count_other': '{{count}} offers',
      },
    }

    const csReport = run({
      en: enFiles,
      cs: {
        common: {
          'offers.count_one': '{{count}} nabídka',
          'offers.count_other': '{{count}} nabídek',
        },
      },
    })
    expect(
      errorsOfType(csReport, 'missingPluralForm').map((error) => error.key)
    ).toEqual(['offers.count_few', 'offers.count_many'])

    const zhJaReport = run({
      en: enFiles,
      zh: {common: {'offers.count_other': '{{count}} 个报价'}},
      ja: {common: {'offers.count_other': '{{count}} 件のオファー'}},
    })
    expect(zhJaReport.ok).toBe(true)
  })

  it('allows plural forms to omit placeholders but not invent them', () => {
    const enFiles = {
      common: {
        'offers.count_one': 'one offer',
        'offers.count_other': '{{count}} offers',
      },
    }

    const omitReport = run({
      en: enFiles,
      cs: {
        common: {
          'offers.count_one': 'jedna nabídka',
          'offers.count_few': '{{count}} nabídky',
          'offers.count_many': '{{count}} nabídky',
          'offers.count_other': '{{count}} nabídek',
        },
      },
    })
    expect(omitReport.ok).toBe(true)

    const inventReport = run({
      en: enFiles,
      cs: {
        common: {
          'offers.count_one': 'jedna nabídka',
          'offers.count_few': '{{count}} nabídky pro {{extra}}',
          'offers.count_many': '{{count}} nabídky',
          'offers.count_other': '{{count}} nabídek',
        },
      },
    })
    expect(errorsOfType(inventReport, 'placeholderMismatch')).toEqual([
      expect.objectContaining({key: 'offers.count_few'}),
    ])
  })

  it('fails on orphan keys in any locale, unshipped included', () => {
    const report = run({
      en: {common: {'greeting.hello': 'Hello'}},
      cs: {common: {'greeting.hello': 'Ahoj', 'stale.key': 'Starý'}},
      uk: {common: {'greeting.hello': 'Привіт', 'stale.key': 'Старий'}},
    })
    expect(
      errorsOfType(report, 'orphanKey').map((error) => error.locale)
    ).toEqual(['cs', 'uk'])
  })

  it('fails when the en counterpart of a locale file is missing', () => {
    const report = run({
      en: {common: {'greeting.hello': 'Hello'}},
      cs: {
        common: {'greeting.hello': 'Ahoj'},
        obsolete: {'some.key': 'Hodnota'},
      },
    })
    expect(errorsOfType(report, 'missingEnFile')).toEqual([
      expect.objectContaining({locale: 'cs', file: 'obsolete.json'}),
    ])
  })

  it('fails on invalid JSON and non-string values', () => {
    const report = run({
      en: {common: {'greeting.hello': 'Hello'}},
      cs: {common: 'not json {'},
      de: {common: {'greeting.hello': 42}},
    })
    expect(errorsOfType(report, 'invalidJson')).toEqual([
      expect.objectContaining({locale: 'cs', file: 'common.json'}),
    ])
    expect(errorsOfType(report, 'nonStringValue')).toEqual([
      expect.objectContaining({
        locale: 'de',
        file: 'common.json',
        key: 'greeting.hello',
      }),
    ])
  })

  it('checks infoPlist like any other group file', () => {
    const report = run({
      en: {infoPlist: {ios: {NSCameraUsageDescription: 'Camera access'}}},
      cs: {infoPlist: {ios: {}}},
    })
    expect(errorsOfType(report, 'missingKey')).toEqual([
      expect.objectContaining({
        locale: 'cs',
        file: 'infoPlist.json',
        key: 'ios.NSCameraUsageDescription',
      }),
    ])
  })

  it('reports legal docs as info instead of hard errors', () => {
    const report = run({
      en: {
        common: {'greeting.hello': 'Hello'},
        privacyPolicy: {privacyPolicyText: 'Long text'},
        termsOfUse: {termsOfUseText: 'Terms'},
      },
      cs: {
        common: {'greeting.hello': 'Ahoj'},
        termsOfUse: {},
      },
    })
    expect(report.ok).toBe(true)
    expect(report.legalDocs).toEqual(
      expect.arrayContaining([
        {locale: 'cs', file: 'privacyPolicy.json', status: 'missingFile'},
        {locale: 'cs', file: 'termsOfUse.json', status: 'missingKeys'},
      ])
    )
  })

  it('marks complete legal docs as ok', () => {
    const report = run({
      en: {
        common: {'greeting.hello': 'Hello'},
        privacyPolicy: {privacyPolicyText: 'Long text'},
      },
      cs: {
        common: {'greeting.hello': 'Ahoj'},
        privacyPolicy: {privacyPolicyText: 'Dlouhý text'},
      },
    })
    expect(report.legalDocs).toEqual([
      {locale: 'cs', file: 'privacyPolicy.json', status: 'ok'},
    ])
  })

  it('produces the stable report shape', () => {
    const report = run({
      en: {common: {'greeting.hello': 'Hello', 'greeting.empty': ''}},
      cs: {common: {}},
    })
    expect(Object.keys(report).sort()).toEqual([
      'errors',
      'legalDocs',
      'ok',
      'stats',
      'warnings',
    ])
    expect(report.stats).toEqual({
      enKeyCount: 2,
      checkedLocales: ['en', 'cs'],
    })
    for (const error of report.errors) {
      expect(Object.keys(error).sort()).toEqual([
        'file',
        'key',
        'locale',
        'message',
        'type',
      ])
    }
    expect(report.warnings).toEqual([
      expect.objectContaining({
        type: 'emptyValue',
        locale: 'en',
        key: 'greeting.empty',
      }),
    ])
  })

  describe('--fix-stale', () => {
    it('removes orphan keys and files without an en counterpart', () => {
      const localesRoot = makeLocaleTree({
        en: {common: {'greeting.hello': 'Hello'}},
        cs: {
          common: {
            'greeting.hello': 'Ahoj',
            'stale.key': 'Starý',
          },
          obsolete: {'some.key': 'Hodnota'},
        },
      })

      const report = checkTranslations({
        localesRoot,
        skipCodegenCheck: true,
        fixStale: true,
        shippedLocales: ['cs'],
      })

      expect(report.fixes).toEqual({
        removedFiles: [{locale: 'cs', file: 'obsolete.json'}],
        removedKeys: [{locale: 'cs', file: 'common.json', key: 'stale.key'}],
      })
      expect(report.ok).toBe(true)
      expect(fs.existsSync(path.join(localesRoot, 'cs', 'obsolete.json'))).toBe(
        false
      )
      expect(
        fs.readFileSync(path.join(localesRoot, 'cs', 'common.json'), 'utf8')
      ).toBe('{\n  "greeting.hello": "Ahoj"\n}\n')
    })

    it('removes nested orphan keys and preserves key order', () => {
      const localesRoot = makeLocaleTree({
        en: {infoPlist: {ios: {A: 'a', C: 'c'}}},
        cs: {infoPlist: {ios: {A: 'a-cs', B: 'orphan', C: 'c-cs'}}},
      })

      const report = checkTranslations({
        localesRoot,
        skipCodegenCheck: true,
        fixStale: true,
        shippedLocales: ['cs'],
      })

      expect(report.fixes.removedKeys).toEqual([
        {locale: 'cs', file: 'infoPlist.json', key: 'ios.B'},
      ])
      expect(
        fs.readFileSync(path.join(localesRoot, 'cs', 'infoPlist.json'), 'utf8')
      ).toBe('{\n  "ios": {\n    "A": "a-cs",\n    "C": "c-cs"\n  }\n}\n')
    })
  })
})
