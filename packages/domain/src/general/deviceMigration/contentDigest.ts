import {sha256} from '@noble/hashes/sha2.js'
import {Array, Order, pipe, Schema} from 'effect'
import {Base64} from 'js-base64'
import {ManifestDigest, SnapshotContentDigest} from './brands'
import {
  bytesToHex,
  compareBytes,
  concatBytes,
  hexToBytes,
  lengthPrefixed,
  u32be,
  u64be,
  utf8Encode,
} from './encoding'
import {type MmkvEntry, type MmkvNativeType} from './snapshotEntries'
import {type CanonicalManifestForDigest} from './snapshotManifest'
import {
  type MigrationProtocolVersion,
  type SnapshotStorageSchemaVersion,
} from './version'

/**
 * Snapshot content digest (spec section "Snapshot content digest").
 *
 * The digest provides an end-to-end commitment independent of transport and
 * staging encryption. For every record a SHA-256 leaf is computed over a
 * versioned, domain-separated, length-prefixed binary encoding. The root is
 * SHA-256 over the domain tag, the protocol/storage versions, the manifest
 * digest, and the ordered sequence of leaf kinds, lengths and digests.
 *
 * All length prefixes are 4-byte big-endian. All strings are encoded as
 * UTF-8 bytes. JSON property order, platform path syntax, destination
 * sandbox URIs, randomized encryption bytes, and filesystem enumeration
 * order never affect the result.
 *
 * The digest is sensitive migration metadata. It is never logged, reported,
 * placed in analytics, or sent to Vexl.
 */
export const SNAPSHOT_DIGEST_DOMAIN_TAG = 'vexl-device-migration-v1'

/** Domain-separation marker of the root preimage (leaves use 0x01–0x03). */
const ROOT_KIND = 0x00
export const LEAF_KIND_MMKV = 0x01
export const LEAF_KIND_SESSION = 0x02
export const LEAF_KIND_FILE = 0x03

const MMKV_NATIVE_TYPE_CODES: Record<MmkvNativeType, number> = {
  string: 0x01,
  boolean: 0x02,
  number: 0x03,
  buffer: 0x04,
}

const domainTagBytes = lengthPrefixed(utf8Encode(SNAPSHOT_DIGEST_DOMAIN_TAG))

/**
 * Canonical logical value bytes of one typed MMKV entry. Both devices must
 * derive the exact same bytes for the same logical value:
 * - string: UTF-8 bytes;
 * - boolean: one byte (0x01/0x00);
 * - number: 8 bytes, IEEE-754 float64, big-endian;
 * - buffer: the raw decoded bytes.
 */
export const mmkvEntryValueBytes = (entry: MmkvEntry): Uint8Array => {
  if (entry.type === 'string') return utf8Encode(entry.value)
  if (entry.type === 'boolean') return Uint8Array.of(entry.value ? 0x01 : 0x00)
  if (entry.type === 'number') {
    const result = new Uint8Array(8)
    new DataView(result.buffer).setFloat64(0, entry.value, false)
    return result
  }
  return Base64.toUint8Array(entry.value)
}

/**
 * Leaf encoding of one MMKV record:
 * domainTag || kind(0x01) || len(key) || key ||
 * nativeTypeCode || declaredByteLength || len(value) || value
 */
export const encodeMmkvLeaf = (args: {
  key: string
  nativeType: MmkvNativeType
  declaredByteLength: number
  valueBytes: Uint8Array
}): Uint8Array =>
  concatBytes(
    domainTagBytes,
    Uint8Array.of(LEAF_KIND_MMKV),
    lengthPrefixed(utf8Encode(args.key)),
    Uint8Array.of(MMKV_NATIVE_TYPE_CODES[args.nativeType]),
    u32be(args.declaredByteLength),
    lengthPrefixed(args.valueBytes)
  )

/**
 * Leaf encoding of the logical session record (fixed identifier 'session'):
 * domainTag || kind(0x02) || len('session') || 'session' ||
 * declaredByteLength || len(value) || value
 */
export const encodeSessionLeaf = (args: {
  declaredByteLength: number
  valueBytes: Uint8Array
}): Uint8Array =>
  concatBytes(
    domainTagBytes,
    Uint8Array.of(LEAF_KIND_SESSION),
    lengthPrefixed(utf8Encode('session')),
    u32be(args.declaredByteLength),
    lengthPrefixed(args.valueBytes)
  )

/**
 * Leaf encoding of one file record. Large file contents are digested by the
 * caller in a streaming fashion; the leaf hashes over the encoding together
 * with that precomputed content digest instead of the raw bytes:
 * domainTag || kind(0x03) || len(path) || path ||
 * declaredByteLength || len(contentSha256) || contentSha256
 */
export const encodeFileLeaf = (args: {
  path: string
  declaredByteLength: number
  fileContentSha256: Uint8Array
}): Uint8Array =>
  concatBytes(
    domainTagBytes,
    Uint8Array.of(LEAF_KIND_FILE),
    lengthPrefixed(utf8Encode(args.path)),
    u32be(args.declaredByteLength),
    lengthPrefixed(args.fileContentSha256)
  )

export const computeLeafDigest = (encodedLeaf: Uint8Array): Uint8Array =>
  sha256(encodedLeaf)

export interface SnapshotLeaf {
  readonly byteLength: number
  readonly digest: Uint8Array
}

export interface MmkvSnapshotLeaf extends SnapshotLeaf {
  readonly key: string
}

export interface FileSnapshotLeaf extends SnapshotLeaf {
  readonly path: string
}

const byUtf8BytesOf = <T>(get: (value: T) => string): Order.Order<T> =>
  Order.mapInput(Order.make(compareBytes), (value: T) => utf8Encode(get(value)))

/**
 * Computes the snapshot content root. MMKV leaves are ordered by the UTF-8
 * bytes of their keys, the session leaf has a fixed position after them, and
 * file leaves are ordered by the UTF-8 bytes of their normalized paths. The
 * caller-supplied array order never affects the result.
 */
export const computeSnapshotContentRoot = (args: {
  protocolVersion: MigrationProtocolVersion
  storageSchemaVersion: SnapshotStorageSchemaVersion
  manifestDigest: ManifestDigest
  mmkvLeaves: readonly MmkvSnapshotLeaf[]
  sessionLeaf: SnapshotLeaf
  fileLeaves: readonly FileSnapshotLeaf[]
}): SnapshotContentDigest => {
  const orderedMmkvLeaves = pipe(
    args.mmkvLeaves,
    Array.sort(byUtf8BytesOf((leaf: MmkvSnapshotLeaf) => leaf.key))
  )
  const orderedFileLeaves = pipe(
    args.fileLeaves,
    Array.sort(byUtf8BytesOf((leaf: FileSnapshotLeaf) => leaf.path))
  )

  const leafBytes = (kind: number, leaf: SnapshotLeaf): Uint8Array =>
    concatBytes(
      Uint8Array.of(kind),
      u32be(leaf.byteLength),
      lengthPrefixed(leaf.digest)
    )

  const preimage = concatBytes(
    domainTagBytes,
    Uint8Array.of(ROOT_KIND),
    u32be(args.protocolVersion),
    u32be(args.storageSchemaVersion),
    lengthPrefixed(hexToBytes(args.manifestDigest)),
    u32be(orderedMmkvLeaves.length + 1 + orderedFileLeaves.length),
    ...pipe(
      orderedMmkvLeaves,
      Array.map((leaf) => leafBytes(LEAF_KIND_MMKV, leaf))
    ),
    leafBytes(LEAF_KIND_SESSION, args.sessionLeaf),
    ...pipe(
      orderedFileLeaves,
      Array.map((leaf) => leafBytes(LEAF_KIND_FILE, leaf))
    )
  )

  return Schema.decodeSync(SnapshotContentDigest)(bytesToHex(sha256(preimage)))
}

/**
 * Computes the manifest digest over the canonical manifest projection (both
 * digest fields omitted) using an explicit, length-prefixed field encoding.
 * Entry and file descriptors are canonically ordered before hashing so the
 * transmitted array order never affects the result.
 */
export const computeManifestDigest = (
  canonical: CanonicalManifestForDigest
): ManifestDigest => {
  const orderedEntries = pipe(
    canonical.mmkvEntries,
    Array.sort(
      byUtf8BytesOf(
        (entry: (typeof canonical.mmkvEntries)[number]) => entry.key
      )
    )
  )
  const orderedFiles = pipe(
    canonical.files,
    Array.sort(
      byUtf8BytesOf((file: (typeof canonical.files)[number]) => file.path)
    )
  )

  const preimage = concatBytes(
    lengthPrefixed(utf8Encode(`${SNAPSHOT_DIGEST_DOMAIN_TAG}/manifest`)),
    u32be(canonical.snapshotSchemaVersion),
    lengthPrefixed(utf8Encode(canonical.appVersion)),
    u32be(canonical.storageSchemaVersion),
    u32be(canonical.protocolVersion),
    u64be(canonical.createdAt),
    u32be(orderedEntries.length),
    ...pipe(
      orderedEntries,
      Array.map((entry) =>
        concatBytes(
          lengthPrefixed(utf8Encode(entry.key)),
          Uint8Array.of(MMKV_NATIVE_TYPE_CODES[entry.type]),
          u32be(entry.byteLength),
          lengthPrefixed(hexToBytes(entry.sha256))
        )
      )
    ),
    u32be(canonical.session.byteLength),
    lengthPrefixed(hexToBytes(canonical.session.sha256)),
    u32be(orderedFiles.length),
    ...pipe(
      orderedFiles,
      Array.map((file) =>
        concatBytes(
          lengthPrefixed(utf8Encode(file.path)),
          u32be(file.byteLength),
          lengthPrefixed(hexToBytes(file.sha256))
        )
      )
    ),
    u32be(canonical.mmkvEntryCount),
    u32be(canonical.fileCount),
    u64be(canonical.totalByteLength)
  )

  return Schema.decodeSync(ManifestDigest)(bytesToHex(sha256(preimage)))
}
