import {Array, Either, pipe, Schema} from 'effect'
import {
  MAX_FILE_BYTES,
  MAX_FILE_COUNT,
  MAX_MMKV_ENTRY_COUNT,
  MAX_MMKV_VALUE_BYTES,
  MAX_TOTAL_SNAPSHOT_BYTES,
} from './limits'
import {
  FileDescriptor,
  MmkvEntryDescriptor,
  SnapshotManifest,
  toCanonicalManifestForDigest,
} from './snapshotManifest'
import {hex64, makeTestManifest, makeTestManifestInput} from './testFixtures'

const decodeManifest = Schema.decodeUnknownEither(SnapshotManifest)
const decodeEntryDescriptor = Schema.decodeUnknownEither(MmkvEntryDescriptor)
const decodeFileDescriptor = Schema.decodeUnknownEither(FileDescriptor)

const makeEntries = (
  count: number
): ReadonlyArray<{
  key: string
  type: string
  byteLength: number
  sha256: string
}> =>
  pipe(
    Array.range(1, count),
    Array.map((i) => ({
      key: `key-${i}`,
      type: 'string',
      byteLength: 1,
      sha256: hex64('a'),
    }))
  )

const makeFiles = (
  count: number,
  byteLength: number = 1
): ReadonlyArray<{path: string; byteLength: number; sha256: string}> =>
  pipe(
    Array.range(1, count),
    Array.map((i) => ({
      path: `chat-images/dir/${i}.jpg`,
      byteLength,
      sha256: hex64('b'),
    }))
  )

const manifestInputWith = (overrides: Record<string, unknown>): unknown => {
  const base = makeTestManifestInput()
  return typeof base === 'object' && base !== null
    ? {...base, ...overrides}
    : base
}

describe('SnapshotManifest', () => {
  it('decodes a consistent manifest', () => {
    expect(Either.isRight(decodeManifest(makeTestManifestInput()))).toBe(true)
  })

  it('rejects record counts that do not match the arrays', () => {
    expect(
      Either.isLeft(decodeManifest(manifestInputWith({mmkvEntryCount: 3})))
    ).toBe(true)
    expect(
      Either.isLeft(decodeManifest(manifestInputWith({fileCount: 2})))
    ).toBe(true)
  })

  it('rejects a total length that does not match the descriptors', () => {
    expect(
      Either.isLeft(decodeManifest(manifestInputWith({totalByteLength: 1})))
    ).toBe(true)
  })

  it('rejects duplicate MMKV keys', () => {
    const entry = {
      key: 'dup',
      type: 'string',
      byteLength: 1,
      sha256: hex64('a'),
    }
    expect(
      Either.isLeft(
        decodeManifest(
          manifestInputWith({
            mmkvEntries: [entry, entry],
            mmkvEntryCount: 2,
            totalByteLength: 2 + 50 + 100,
          })
        )
      )
    ).toBe(true)
  })

  it('rejects duplicate and case-folding-colliding file paths', () => {
    const makeFile = (path: string): Record<string, unknown> => ({
      path,
      byteLength: 1,
      sha256: hex64('b'),
    })
    const withFiles = (paths: readonly string[]): unknown =>
      manifestInputWith({
        files: pipe(paths, Array.map(makeFile)),
        fileCount: paths.length,
        totalByteLength: 10 + 1 + 50 + paths.length,
      })
    expect(
      Either.isLeft(
        decodeManifest(
          withFiles(['chat-images/a/b.jpg', 'chat-images/a/b.jpg'])
        )
      )
    ).toBe(true)
    expect(
      Either.isLeft(
        decodeManifest(
          withFiles(['chat-images/a/b.jpg', 'chat-images/A/B.JPG'])
        )
      )
    ).toBe(true)
    expect(
      Either.isRight(
        decodeManifest(
          withFiles(['chat-images/a/b.jpg', 'chat-images/a/c.jpg'])
        )
      )
    ).toBe(true)
  })

  it('enforces the MMKV entry count limit at the boundary', () => {
    const withEntryCount = (count: number): unknown =>
      manifestInputWith({
        mmkvEntries: makeEntries(count),
        mmkvEntryCount: count,
        totalByteLength: count + 50 + 100,
      })
    expect(
      Either.isRight(decodeManifest(withEntryCount(MAX_MMKV_ENTRY_COUNT - 1)))
    ).toBe(true)
    expect(
      Either.isRight(decodeManifest(withEntryCount(MAX_MMKV_ENTRY_COUNT)))
    ).toBe(true)
    expect(
      Either.isLeft(decodeManifest(withEntryCount(MAX_MMKV_ENTRY_COUNT + 1)))
    ).toBe(true)
  })

  it('enforces the file count limit at the boundary', () => {
    const withFileCount = (count: number): unknown =>
      manifestInputWith({
        files: makeFiles(count),
        fileCount: count,
        totalByteLength: 10 + 1 + 50 + count,
      })
    expect(
      Either.isRight(decodeManifest(withFileCount(MAX_FILE_COUNT - 1)))
    ).toBe(true)
    expect(Either.isRight(decodeManifest(withFileCount(MAX_FILE_COUNT)))).toBe(
      true
    )
    expect(
      Either.isLeft(decodeManifest(withFileCount(MAX_FILE_COUNT + 1)))
    ).toBe(true)
  })

  it('enforces the total snapshot size limit at the boundary', () => {
    // 40 files of exactly MAX_FILE_BYTES plus a session that tops the total
    // up to exactly MAX_TOTAL_SNAPSHOT_BYTES
    const fileCount = 40
    const sessionByteLength =
      MAX_TOTAL_SNAPSHOT_BYTES - fileCount * MAX_FILE_BYTES - 10 - 1
    expect(sessionByteLength).toBeGreaterThan(0)
    expect(sessionByteLength).toBeLessThanOrEqual(MAX_MMKV_VALUE_BYTES)

    const atLimit = manifestInputWith({
      files: makeFiles(fileCount, MAX_FILE_BYTES),
      fileCount,
      session: {byteLength: sessionByteLength, sha256: hex64('d')},
      totalByteLength: MAX_TOTAL_SNAPSHOT_BYTES,
    })
    expect(Either.isRight(decodeManifest(atLimit))).toBe(true)

    const overLimit = manifestInputWith({
      files: makeFiles(fileCount, MAX_FILE_BYTES),
      fileCount,
      session: {byteLength: sessionByteLength + 1, sha256: hex64('d')},
      totalByteLength: MAX_TOTAL_SNAPSHOT_BYTES + 1,
    })
    expect(Either.isLeft(decodeManifest(overLimit))).toBe(true)
  })

  it('rejects unknown native types and invalid digests in descriptors', () => {
    expect(
      Either.isLeft(
        decodeEntryDescriptor({
          key: 'a',
          type: 'json',
          byteLength: 1,
          sha256: hex64('a'),
        })
      )
    ).toBe(true)
    expect(
      Either.isLeft(
        decodeEntryDescriptor({
          key: 'a',
          type: 'string',
          byteLength: 1,
          sha256: 'not-a-digest',
        })
      )
    ).toBe(true)
  })

  it('enforces per-record byte length limits at the boundary', () => {
    const entryOf = (byteLength: number): Record<string, unknown> => ({
      key: 'a',
      type: 'buffer',
      byteLength,
      sha256: hex64('a'),
    })
    expect(
      Either.isRight(decodeEntryDescriptor(entryOf(MAX_MMKV_VALUE_BYTES - 1)))
    ).toBe(true)
    expect(
      Either.isRight(decodeEntryDescriptor(entryOf(MAX_MMKV_VALUE_BYTES)))
    ).toBe(true)
    expect(
      Either.isLeft(decodeEntryDescriptor(entryOf(MAX_MMKV_VALUE_BYTES + 1)))
    ).toBe(true)

    const fileOf = (byteLength: number): Record<string, unknown> => ({
      path: 'chat-images/a/b.jpg',
      byteLength,
      sha256: hex64('b'),
    })
    expect(
      Either.isRight(decodeFileDescriptor(fileOf(MAX_FILE_BYTES - 1)))
    ).toBe(true)
    expect(Either.isRight(decodeFileDescriptor(fileOf(MAX_FILE_BYTES)))).toBe(
      true
    )
    expect(
      Either.isLeft(decodeFileDescriptor(fileOf(MAX_FILE_BYTES + 1)))
    ).toBe(true)
  })

  it('rejects garbage input', () => {
    expect(Either.isLeft(decodeManifest(null))).toBe(true)
    expect(Either.isLeft(decodeManifest('manifest'))).toBe(true)
    expect(Either.isLeft(decodeManifest({}))).toBe(true)
  })
})

describe('toCanonicalManifestForDigest', () => {
  it('drops both digest fields and keeps everything else', () => {
    const manifest = makeTestManifest()
    const canonical = toCanonicalManifestForDigest(manifest)
    expect(canonical).not.toHaveProperty('manifestDigest')
    expect(canonical).not.toHaveProperty('snapshotContentDigest')
    expect(canonical.mmkvEntries).toEqual(manifest.mmkvEntries)
    expect(canonical.files).toEqual(manifest.files)
    expect(canonical.session).toEqual(manifest.session)
    expect(canonical.totalByteLength).toBe(manifest.totalByteLength)
  })
})
