import {Array, Either, pipe, Record} from 'effect'
import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, it} from 'vitest'
import {parseInlineCopy} from './inlineCopy'

const COPY_DIR = path.join(__dirname, '../../content/copy')

const readCopy = (file: string): Record<string, unknown> =>
  JSON.parse(fs.readFileSync(path.join(COPY_DIR, file), 'utf8'))

const copyFileNames = fs.readdirSync(COPY_DIR).sort()

describe('content/copy', () => {
  it('loads every copy file in content/copy', async () => {
    const {copyPages} = await import('./copyFiles')
    expect(
      pipe(
        copyFileNames,
        Array.map((file) => path.basename(file, '.json'))
      )
    ).toEqual(Record.keys(copyPages).sort())
  })

  it.each(copyFileNames)('%s has only non-empty, valid values', (file) => {
    const invalid = pipe(
      Record.toEntries(readCopy(file)),
      Array.filter(
        ([, value]) =>
          typeof value !== 'string' || Either.isLeft(parseInlineCopy(value))
      ),
      Array.map(([key]) => key)
    )
    expect(invalid).toEqual([])
  })
})
