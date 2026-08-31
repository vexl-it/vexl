import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'

import {diffEnDirs} from '../scripts/diffEnKeys.mjs'
import {cleanupLocaleTrees, makeLocaleTree} from './helpers.mjs'

afterEach(cleanupLocaleTrees)

function makeEnDir(files) {
  return path.join(makeLocaleTree({en: files}), 'en')
}

describe('diffEnDirs', () => {
  it('detects added, changed, and removed keys', () => {
    const baseDir = makeEnDir({
      common: {
        'greeting.hello': 'Hello',
        'greeting.bye': 'Bye',
        'stays.same': 'Same',
      },
    })
    const headDir = makeEnDir({
      common: {
        'greeting.hello': 'Hello there',
        'stays.same': 'Same',
        'brand.new': 'New string',
      },
    })

    expect(diffEnDirs(baseDir, headDir)).toEqual({
      added: [{file: 'common.json', key: 'brand.new', value: 'New string'}],
      changed: [
        {
          file: 'common.json',
          key: 'greeting.hello',
          before: 'Hello',
          after: 'Hello there',
        },
      ],
      removed: [{file: 'common.json', key: 'greeting.bye'}],
    })
  })

  it('handles whole files appearing and disappearing', () => {
    const baseDir = makeEnDir({old: {'some.key': 'Old'}})
    const headDir = makeEnDir({fresh: {'other.key': 'Fresh'}})

    expect(diffEnDirs(baseDir, headDir)).toEqual({
      added: [{file: 'fresh.json', key: 'other.key', value: 'Fresh'}],
      changed: [],
      removed: [{file: 'old.json', key: 'some.key'}],
    })
  })

  it('flattens nested files like infoPlist', () => {
    const baseDir = makeEnDir({infoPlist: {ios: {A: 'a'}}})
    const headDir = makeEnDir({infoPlist: {ios: {A: 'a', B: 'b'}}})

    expect(diffEnDirs(baseDir, headDir)).toEqual({
      added: [{file: 'infoPlist.json', key: 'ios.B', value: 'b'}],
      changed: [],
      removed: [],
    })
  })

  it('returns an empty diff for identical trees', () => {
    const files = {common: {'greeting.hello': 'Hello'}}
    expect(diffEnDirs(makeEnDir(files), makeEnDir(files))).toEqual({
      added: [],
      changed: [],
      removed: [],
    })
  })
})
