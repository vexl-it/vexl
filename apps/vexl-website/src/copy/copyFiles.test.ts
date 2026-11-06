import {Array, Either, pipe, Record} from 'effect'
import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, it} from 'vitest'
import {parseInlineCopy} from './inlineCopy'

const COPY_DIR = path.join(__dirname, '../../content/copy')

const readCopy = (locale: string, file: string): Record<string, unknown> =>
  JSON.parse(fs.readFileSync(path.join(COPY_DIR, locale, file), 'utf8'))

const englishFiles = fs.readdirSync(path.join(COPY_DIR, 'en')).sort()

describe('content/copy', () => {
  it('has the same files in every locale, all loaded by the site', async () => {
    const {copyPages} = await import('./copyFiles')
    expect(fs.readdirSync(path.join(COPY_DIR, 'cs')).sort()).toEqual(
      englishFiles
    )
    expect(
      pipe(
        englishFiles,
        Array.map((file) => path.basename(file, '.json'))
      )
    ).toEqual(Record.keys(copyPages).sort())
  })

  it.each(englishFiles)('%s has the same keys in English and Czech', (file) => {
    expect(Object.keys(readCopy('cs', file))).toEqual(
      Object.keys(readCopy('en', file))
    )
  })

  it.each(englishFiles)('%s has only non-empty, valid values', (file) => {
    const invalid = pipe(
      ['en', 'cs'],
      Array.flatMap((locale) =>
        pipe(
          Record.toEntries(readCopy(locale, file)),
          Array.filter(
            ([, value]) =>
              typeof value !== 'string' || Either.isLeft(parseInlineCopy(value))
          ),
          Array.map(([key]) => `${locale}:${key}`)
        )
      )
    )
    expect(invalid).toEqual([])
  })
})
