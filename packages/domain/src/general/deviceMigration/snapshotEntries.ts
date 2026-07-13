import {Array, pipe, Schema} from 'effect'
import {Base64} from 'js-base64'
import {utf8ByteLength} from './encoding'
import {
  MAX_FILE_RELATIVE_PATH_UTF8_BYTES,
  MAX_MMKV_KEY_UTF8_BYTES,
  MAX_MMKV_VALUE_BYTES,
} from './limits'

/**
 * Migration policy of one persisted key (spec section "Migration policy
 * registry"). Every persisted atom/key must declare exactly one policy;
 * there is no permissive default.
 */
export const MigrationKeyPolicy = Schema.Literal(
  'account',
  'preference',
  'rebuild',
  'deviceLocal',
  'ephemeral',
  'lifecycle'
)
export type MigrationKeyPolicy = typeof MigrationKeyPolicy.Type

/** Native value types supported by MMKV. Import must preserve the type. */
export const MmkvNativeType = Schema.Literal(
  'string',
  'boolean',
  'number',
  'buffer'
)
export type MmkvNativeType = typeof MmkvNativeType.Type

export const MmkvEntryKey = Schema.String.pipe(
  Schema.filter(
    (key) => key.length > 0 && utf8ByteLength(key) <= MAX_MMKV_KEY_UTF8_BYTES
  ),
  Schema.brand('MmkvEntryKey')
)
export type MmkvEntryKey = typeof MmkvEntryKey.Type

export const StringMmkvEntry = Schema.Struct({
  type: Schema.Literal('string'),
  key: MmkvEntryKey,
  value: Schema.String,
})
export type StringMmkvEntry = typeof StringMmkvEntry.Type

export const BooleanMmkvEntry = Schema.Struct({
  type: Schema.Literal('boolean'),
  key: MmkvEntryKey,
  value: Schema.Boolean,
})
export type BooleanMmkvEntry = typeof BooleanMmkvEntry.Type

export const NumberMmkvEntry = Schema.Struct({
  type: Schema.Literal('number'),
  key: MmkvEntryKey,
  value: Schema.Number,
})
export type NumberMmkvEntry = typeof NumberMmkvEntry.Type

export const BufferMmkvEntry = Schema.Struct({
  type: Schema.Literal('buffer'),
  key: MmkvEntryKey,
  /** Raw buffer contents encoded as base64. */
  value: Schema.String.pipe(Schema.filter(Base64.isValid)),
  /** Declared decoded byte length of the buffer. */
  byteLength: Schema.Number.pipe(
    Schema.int(),
    Schema.nonNegative(),
    Schema.lessThanOrEqualTo(MAX_MMKV_VALUE_BYTES)
  ),
}).pipe(
  Schema.filter(
    (entry) => Base64.toUint8Array(entry.value).length === entry.byteLength,
    {
      message: () =>
        'Declared byteLength does not match the decoded buffer length',
    }
  )
)
export type BufferMmkvEntry = typeof BufferMmkvEntry.Type

/**
 * One exported MMKV entry as a schema-validated tagged union carrying its
 * key, native type and value (spec section "Typed MMKV entries").
 */
export const MmkvEntry = Schema.Union(
  StringMmkvEntry,
  BooleanMmkvEntry,
  NumberMmkvEntry,
  BufferMmkvEntry
)
export type MmkvEntry = typeof MmkvEntry.Type

/** Approved migration file roots (spec section "Files and URI normalization"). */
export const CHAT_IMAGES_FILE_ROOT = 'chat-images'
export const PROFILE_PICTURE_FILE_ROOT = 'profilePicture'

const containsControlCharacters = (value: string): boolean => {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

/**
 * Validates one normalized POSIX relative file path per spec section "Files
 * and URI normalization". Rejects absolute paths, `..` segments, empty and
 * dot-only segments, backslash separators, NUL/control characters, roots
 * outside the allowlist, and oversize paths.
 *
 * Chat image subdirectory names are raw-base64 MD5 values which may contain
 * '+', '=' and '/'. A '/' inside such a name simply creates one more path
 * segment, so any nesting depth under `chat-images/` is allowed.
 * `profilePicture/<basename>` is exactly one level deep (including
 * legacy-mapped root-level profile picture files).
 */
export const isValidNormalizedRelativeFilePath = (path: string): boolean => {
  if (path.length === 0) return false
  if (utf8ByteLength(path) > MAX_FILE_RELATIVE_PATH_UTF8_BYTES) return false
  if (path.includes('\\')) return false
  if (containsControlCharacters(path)) return false
  if (path.startsWith('/')) return false

  const segments = path.split('/')
  const hasInvalidSegment = pipe(
    segments,
    Array.some(
      (segment) => segment === '' || segment === '.' || segment === '..'
    )
  )
  if (hasInvalidSegment) return false

  const root = segments[0]
  if (root === CHAT_IMAGES_FILE_ROOT) return segments.length >= 2
  if (root === PROFILE_PICTURE_FILE_ROOT) return segments.length === 2
  return false
}

export const NormalizedRelativeFilePath = Schema.String.pipe(
  Schema.filter(isValidNormalizedRelativeFilePath, {
    message: () => 'Not a valid normalized relative migration file path',
  }),
  Schema.brand('NormalizedRelativeFilePath')
)
export type NormalizedRelativeFilePath = typeof NormalizedRelativeFilePath.Type
