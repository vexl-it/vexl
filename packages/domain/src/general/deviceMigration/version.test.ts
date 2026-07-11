import {Either, Schema} from 'effect'
import {testVersionTriple} from './testFixtures'
import {
  CURRENT_MIGRATION_PROTOCOL_VERSION,
  CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION,
  exactVersionMatch,
  MigrationProtocolVersion,
  SnapshotStorageSchemaVersion,
  VersionTriple,
} from './version'

describe('version brands', () => {
  it('current versions are 1', () => {
    expect(CURRENT_MIGRATION_PROTOCOL_VERSION).toBe(1)
    expect(CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION).toBe(1)
  })

  it('rejects non-positive and non-integer versions', () => {
    const decodeProtocol = Schema.decodeUnknownEither(MigrationProtocolVersion)
    const decodeStorage = Schema.decodeUnknownEither(
      SnapshotStorageSchemaVersion
    )
    expect(Either.isLeft(decodeProtocol(0))).toBe(true)
    expect(Either.isLeft(decodeProtocol(-1))).toBe(true)
    expect(Either.isLeft(decodeProtocol(1.5))).toBe(true)
    expect(Either.isLeft(decodeProtocol('1'))).toBe(true)
    expect(Either.isRight(decodeProtocol(2))).toBe(true)
    expect(Either.isLeft(decodeStorage(0))).toBe(true)
    expect(Either.isRight(decodeStorage(1))).toBe(true)
  })

  it('rejects invalid semver app versions in the triple', () => {
    const decodeTriple = Schema.decodeUnknownEither(VersionTriple)
    expect(
      Either.isLeft(
        decodeTriple({
          appVersion: 'not-a-version',
          migrationProtocolVersion: 1,
          snapshotStorageSchemaVersion: 1,
        })
      )
    ).toBe(true)
  })
})

describe('exactVersionMatch', () => {
  it('matches only exactly equal triples', () => {
    expect(exactVersionMatch(testVersionTriple, testVersionTriple)).toBe(true)
    expect(
      exactVersionMatch(
        testVersionTriple,
        Schema.decodeSync(VersionTriple)({
          appVersion: '1.44.3',
          migrationProtocolVersion: 1,
          snapshotStorageSchemaVersion: 1,
        })
      )
    ).toBe(false)
    expect(
      exactVersionMatch(
        testVersionTriple,
        Schema.decodeSync(VersionTriple)({
          appVersion: '1.44.2',
          migrationProtocolVersion: 2,
          snapshotStorageSchemaVersion: 1,
        })
      )
    ).toBe(false)
    expect(
      exactVersionMatch(
        testVersionTriple,
        Schema.decodeSync(VersionTriple)({
          appVersion: '1.44.2',
          migrationProtocolVersion: 1,
          snapshotStorageSchemaVersion: 2,
        })
      )
    ).toBe(false)
  })
})
