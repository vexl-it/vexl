import {Schema} from 'effect'
import {SemverString} from '../../utility/SmeverString.brand'

/**
 * Version of the local device migration protocol (pairing, stream framing,
 * control messages, authenticated QR records). Migration requires exact
 * equality on both devices — there is no cross-version negotiation.
 */
export const MigrationProtocolVersion = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand('MigrationProtocolVersion')
)
export type MigrationProtocolVersion = typeof MigrationProtocolVersion.Type

/**
 * Version of the snapshot/storage schema (the shape of exported MMKV
 * entries, logical session and file records). Migration requires exact
 * equality on both devices.
 */
export const SnapshotStorageSchemaVersion = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand('SnapshotStorageSchemaVersion')
)
export type SnapshotStorageSchemaVersion =
  typeof SnapshotStorageSchemaVersion.Type

export const CURRENT_MIGRATION_PROTOCOL_VERSION = Schema.decodeSync(
  MigrationProtocolVersion
)(1)

export const CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION = Schema.decodeSync(
  SnapshotStorageSchemaVersion
)(1)

/**
 * The exact version identity of one device. Migration is allowed only when
 * both devices report an exactly equal triple (see spec section "Version
 * compatibility"). Platform build numbers deliberately do not participate.
 */
export const VersionTriple = Schema.Struct({
  appVersion: SemverString,
  migrationProtocolVersion: MigrationProtocolVersion,
  snapshotStorageSchemaVersion: SnapshotStorageSchemaVersion,
})
export type VersionTriple = typeof VersionTriple.Type

export const exactVersionMatch = (
  a: VersionTriple,
  b: VersionTriple
): boolean =>
  a.appVersion === b.appVersion &&
  a.migrationProtocolVersion === b.migrationProtocolVersion &&
  a.snapshotStorageSchemaVersion === b.snapshotStorageSchemaVersion
