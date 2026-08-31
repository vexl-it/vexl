import {afterEach, describe, expect, it} from 'vitest'

import {COMMENT_MARKER, renderPrComment} from '../scripts/renderPrComment.mjs'
import {cleanupLocaleTrees, makeLocaleTree} from './helpers.mjs'

afterEach(cleanupLocaleTrees)

const okReport = {ok: true, errors: [], warnings: [], legalDocs: [], stats: {}}
const emptyDiff = {added: [], changed: [], removed: []}

function failingReport(errors) {
  return {...okReport, ok: false, errors}
}

describe('renderPrComment', () => {
  it('prints nothing when the report is ok and no en keys changed', () => {
    const markdown = renderPrComment({
      report: okReport,
      diff: {...emptyDiff, removed: [{file: 'common.json', key: 'gone.key'}]},
      localesRoot: makeLocaleTree({}),
    })
    expect(markdown).toBe('')
  })

  it('renders the failure section with the fix hint', () => {
    const markdown = renderPrComment({
      report: failingReport([
        {
          type: 'missingKey',
          locale: 'cs',
          file: 'common.json',
          key: 'greeting.bye',
          message: 'cs/common.json:greeting.bye: missing translation key',
        },
      ]),
      diff: emptyDiff,
      localesRoot: makeLocaleTree({}),
    })

    expect(markdown.startsWith(`${COMMENT_MARKER}\n`)).toBe(true)
    expect(markdown).toContain('### ❌ Translation check failed')
    expect(markdown).toContain('missingKey · cs')
    expect(markdown).toContain(
      'cs/common.json:greeting.bye: missing translation key'
    )
    expect(markdown).toContain('adding-translation-key')
    expect(markdown).toContain('.agents/skills/adding-translation-key')
    expect(markdown).toContain('translation-audit')
  })

  it('collapses long error groups into details blocks', () => {
    const errors = Array.from({length: 12}, (unused, index) => ({
      type: 'missingKey',
      locale: 'cs',
      file: 'common.json',
      key: `key.${index}`,
      message: `cs/common.json:key.${index}: missing translation key`,
    }))
    const markdown = renderPrComment({
      report: failingReport(errors),
      diff: emptyDiff,
      localesRoot: makeLocaleTree({}),
    })
    expect(markdown).toContain('<details>')
    expect(markdown).toContain(
      '<summary><strong>missingKey · cs</strong> (12)</summary>'
    )
  })

  it('renders new strings with locale values in review order', () => {
    const localesRoot = makeLocaleTree({
      en: {common: {'brand.new': 'New {{name}}'}},
      cs: {common: {'brand.new': 'Nový {{name}}'}},
      sk: {common: {'brand.new': 'Nový {{name}} (sk)'}},
      de: {common: {'brand.new': 'Neu {{name}}'}},
    })

    const markdown = renderPrComment({
      report: okReport,
      diff: {
        ...emptyDiff,
        added: [{file: 'common.json', key: 'brand.new', value: 'New {{name}}'}],
      },
      localesRoot,
    })

    expect(markdown.startsWith(`${COMMENT_MARKER}\n`)).toBe(true)
    expect(markdown).toContain('### 🌍 New & changed strings')
    expect(markdown).toContain('<code>brand.new</code>')
    expect(markdown).toContain('| en | New {{name}} |')
    expect(markdown).toContain('| cs | Nový {{name}} |')

    const rowOrder = ['| en |', '| cs |', '| sk |', '| de |', '| bg |'].map(
      (row) => markdown.indexOf(row)
    )
    expect(rowOrder.every((index) => index !== -1)).toBe(true)
    expect([...rowOrder].sort((left, right) => left - right)).toEqual(rowOrder)

    // Locale without a value for the key shows as missing.
    expect(markdown).toContain('| bg | *missing* |')
  })

  it('flags changed keys as potentially stale and lists removed keys', () => {
    const localesRoot = makeLocaleTree({
      en: {common: {'greeting.hello': 'Hello there'}},
      cs: {common: {'greeting.hello': 'Ahoj'}},
    })

    const markdown = renderPrComment({
      report: okReport,
      diff: {
        added: [],
        changed: [
          {
            file: 'common.json',
            key: 'greeting.hello',
            before: 'Hello',
            after: 'Hello there',
          },
        ],
        removed: [{file: 'common.json', key: 'gone.key'}],
      },
      localesRoot,
    })

    expect(markdown).toContain(
      '⚠️ en changed — existing translations may be stale'
    )
    expect(markdown).toContain('| en (before) | Hello |')
    expect(markdown).toContain('| en | Hello there |')
    expect(markdown).toContain('| cs | Ahoj |')
    expect(markdown).toContain('**Removed keys:** `common.json` · `gone.key`')
  })

  it('caps output below the GitHub comment limit for huge diffs', () => {
    const added = Array.from({length: 400}, (unused, index) => ({
      file: 'common.json',
      key: `bulk.key${index}`,
      value: `Value ${index} `.repeat(30),
    }))
    const markdown = renderPrComment({
      report: okReport,
      diff: {added, changed: [], removed: []},
      localesRoot: makeLocaleTree({}),
    })
    expect(markdown.length).toBeLessThanOrEqual(60000)
    expect(markdown.length).toBeLessThan(65536)
    expect(markdown).toContain(
      'more keys not shown — see the en diff in this PR.'
    )
    // The budget still fits a useful number of review tables.
    expect(markdown).toContain('<code>bulk.key0</code>')
  })

  it('caps output when the error list alone exceeds the budget', () => {
    const errors = Array.from({length: 3000}, (unused, index) => ({
      type: 'missingKey',
      locale: 'cs',
      file: 'common.json',
      key: `some.key${index}`,
      message: `cs/common.json:some.key${index}: missing translation key ${'x'.repeat(40)}`,
    }))
    const markdown = renderPrComment({
      report: failingReport(errors),
      diff: emptyDiff,
      localesRoot: makeLocaleTree({}),
    })
    expect(markdown.length).toBeLessThanOrEqual(60000)
    expect(markdown).toContain('(3000 errors)')
    expect(markdown).toContain(
      'run `pnpm check:translations` locally for the full list.'
    )
    expect(markdown).toContain('**How to fix:**')
  })

  it('escapes pipes and newlines in table cells', () => {
    const localesRoot = makeLocaleTree({
      en: {common: {'tricky.key': 'a | b\nc'}},
    })
    const markdown = renderPrComment({
      report: okReport,
      diff: {
        ...emptyDiff,
        added: [{file: 'common.json', key: 'tricky.key', value: 'a | b\nc'}],
      },
      localesRoot,
    })
    expect(markdown).toContain('| en | a \\| b<br>c |')
  })
})
