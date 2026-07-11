import {Array, pipe, Schema} from 'effect'
import {SemverString} from '../../utility/SmeverString.brand'
import {UnixMilliseconds} from '../../utility/UnixMilliseconds.brand'
import {ManifestDigest, Sha256Hex, SnapshotContentDigest} from './brands'
import {
  MAX_FILE_BYTES,
  MAX_FILE_COUNT,
  MAX_MMKV_ENTRY_COUNT,
  MAX_MMKV_VALUE_BYTES,
  MAX_TOTAL_SNAPSHOT_BYTES,
} from './limits'
import {
  MmkvEntryKey,
  MmkvNativeType,
  NormalizedRelativeFilePath,
} from './snapshotEntries'
import {MigrationProtocolVersion, SnapshotStorageSchemaVersion} from './version'

const NonNegativeInt = Schema.Number.pipe(Schema.int(), Schema.nonNegative())

/** Descriptor of one migrated file inside the snapshot manifest. */
export const FileDescriptor = Schema.Struct({
  path: NormalizedRelativeFilePath,
  byteLength: NonNegativeInt.pipe(Schema.lessThanOrEqualTo(MAX_FILE_BYTES)),
  sha256: Sha256Hex,
})
export type FileDescriptor = typeof FileDescriptor.Type

/** Descriptor of one typed MMKV entry inside the snapshot manifest. */
export const MmkvEntryDescriptor = Schema.Struct({
  key: MmkvEntryKey,
  type: MmkvNativeType,
  /** Declared byte length of the canonical logical value bytes. */
  byteLength: NonNegativeInt.pipe(
    Schema.lessThanOrEqualTo(MAX_MMKV_VALUE_BYTES)
  ),
  sha256: Sha256Hex,
})
export type MmkvEntryDescriptor = typeof MmkvEntryDescriptor.Type

/**
 * Opaque descriptor of the logical session record. The domain package
 * deliberately does not depend on the mobile Session schema — only the
 * declared canonical byte length and digest are committed to here.
 */
export const SnapshotSessionDescriptor = Schema.Struct({
  byteLength: NonNegativeInt.pipe(
    Schema.lessThanOrEqualTo(MAX_MMKV_VALUE_BYTES)
  ),
  sha256: Sha256Hex,
})
export type SnapshotSessionDescriptor = typeof SnapshotSessionDescriptor.Type

const snapshotManifestBaseFields = {
  /** Version of this manifest/snapshot container format itself. */
  snapshotSchemaVersion: Schema.Literal(1),
  appVersion: SemverString,
  storageSchemaVersion: SnapshotStorageSchemaVersion,
  protocolVersion: MigrationProtocolVersion,
  createdAt: UnixMilliseconds,
  mmkvEntries: Schema.Array(MmkvEntryDescriptor),
  session: SnapshotSessionDescriptor,
  files: Schema.Array(FileDescriptor),
  /** Record counts and total length for local validation. */
  mmkvEntryCount: NonNegativeInt,
  fileCount: NonNegativeInt,
  totalByteLength: NonNegativeInt,
}

const hasDuplicates = (values: readonly string[]): boolean =>
  new Set(values).size !== values.length

interface ManifestConsistencyInput {
  readonly mmkvEntries: readonly MmkvEntryDescriptor[]
  readonly session: SnapshotSessionDescriptor
  readonly files: readonly FileDescriptor[]
  readonly mmkvEntryCount: number
  readonly fileCount: number
  readonly totalByteLength: number
}

const validateManifestConsistency = (
  manifest: ManifestConsistencyInput
): boolean => {
  if (manifest.mmkvEntryCount !== manifest.mmkvEntries.length) return false
  if (manifest.fileCount !== manifest.files.length) return false
  if (manifest.mmkvEntries.length > MAX_MMKV_ENTRY_COUNT) return false
  if (manifest.files.length > MAX_FILE_COUNT) return false
  if (manifest.totalByteLength > MAX_TOTAL_SNAPSHOT_BYTES) return false

  const keys = pipe(
    manifest.mmkvEntries,
    Array.map((entry) => entry.key)
  )
  if (hasDuplicates(keys)) return false

  const paths = pipe(
    manifest.files,
    Array.map((file) => file.path)
  )
  if (hasDuplicates(paths)) return false
  // Case-folding collisions would silently merge files on
  // case-insensitive filesystems (APFS).
  if (
    hasDuplicates(
      pipe(
        paths,
        Array.map((path) => path.toLowerCase())
      )
    )
  )
    return false

  const declaredTotal =
    pipe(
      manifest.mmkvEntries,
      Array.reduce(0, (sum, entry) => sum + entry.byteLength)
    ) +
    manifest.session.byteLength +
    pipe(
      manifest.files,
      Array.reduce(0, (sum, file) => sum + file.byteLength)
    )
  return manifest.totalByteLength === declaredTotal
}

/**
 * Projection of the snapshot manifest with both digest fields omitted. The
 * manifest digest is computed over this canonical form to avoid circular
 * hashing (spec section "Snapshot content digest").
 */
export const CanonicalManifestForDigest = Schema.Struct(
  snapshotManifestBaseFields
).pipe(
  Schema.filter(validateManifestConsistency, {
    message: () => 'Snapshot manifest counts/limits/uniqueness check failed',
  })
)
export type CanonicalManifestForDigest = typeof CanonicalManifestForDigest.Type

/**
 * The top-level snapshot manifest (spec section "Snapshot format"). The
 * manifest and every following byte travel inside the authenticated stream.
 * Counts and sizes are never sent to telemetry.
 */
export const SnapshotManifest = Schema.Struct({
  ...snapshotManifestBaseFields,
  manifestDigest: ManifestDigest,
  snapshotContentDigest: SnapshotContentDigest,
}).pipe(
  Schema.filter(validateManifestConsistency, {
    message: () => 'Snapshot manifest counts/limits/uniqueness check failed',
  })
)
export type SnapshotManifest = typeof SnapshotManifest.Type

/** Drops both digest fields, producing the canonical manifest projection. */
export const toCanonicalManifestForDigest = (
  manifest: SnapshotManifest
): CanonicalManifestForDigest => ({
  snapshotSchemaVersion: manifest.snapshotSchemaVersion,
  appVersion: manifest.appVersion,
  storageSchemaVersion: manifest.storageSchemaVersion,
  protocolVersion: manifest.protocolVersion,
  createdAt: manifest.createdAt,
  mmkvEntries: manifest.mmkvEntries,
  session: manifest.session,
  files: manifest.files,
  mmkvEntryCount: manifest.mmkvEntryCount,
  fileCount: manifest.fileCount,
  totalByteLength: manifest.totalByteLength,
})
