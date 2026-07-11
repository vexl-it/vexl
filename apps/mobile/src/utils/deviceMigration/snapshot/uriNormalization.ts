import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {NormalizedRelativeFilePath} from '@vexl-next/domain/src/general/deviceMigration/snapshotEntries'
import {Array, Either, pipe, Schema} from 'effect'

/**
 * Bidirectional mapping between absolute device `file://` URIs found in
 * persisted values and canonical migration file references (spec section
 * "Files and URI normalization").
 *
 * Absolute source sandbox URIs cannot be installed on another device. During
 * export every recognized absolute document-root URI is replaced by a
 * canonical `vexl-migration-file://<normalized-relative-path>` reference.
 * During installation those references are resolved to the destination
 * document directory. Any unresolved `file://` URI in an account/session
 * value fails validation instead of producing a broken message image.
 *
 * Both directions operate on decoded JSON (parse → walk every string value →
 * re-serialize) instead of raw-regex string surgery, so replacements can
 * never corrupt structure and only whole string values that ARE URIs are
 * touched. `JSON.parse`/`JSON.stringify` round-trips are stable, so
 * `normalize(denormalize(normalized)) === normalized` — which the installer
 * relies on when it re-reads installed state and recomputes the snapshot
 * content digest.
 *
 * PRIVACY: URIs, paths and values handled here are sensitive migration data.
 * Failures carry a `DeviceMigrationError` with an enumerated code only.
 */

export const MIGRATION_FILE_REFERENCE_SCHEME = 'vexl-migration-file://'

/**
 * Any iOS application-container Documents root, current or stale. iOS
 * rotates the container UUID across app updates, so persisted URIs routinely
 * point at containers that no longer exist — the relative path below
 * `Documents/` stays valid. Deliberately a superset of the regex in
 * `utils/resolveLocalUri.ts` (tolerates lowercase hex in the UUID).
 */
const IOS_DOCUMENTS_ROOT_REGEX =
  /^file:\/\/\/.*?\/Containers\/Data\/Application\/[0-9A-Za-z-]+\/Documents\//

/** Android internal files roots: /data/user/<n>/<pkg>/files and the /data/data alias. */
const ANDROID_FILES_ROOT_REGEX =
  /^file:\/\/\/data\/(?:user\/\d+|data)\/[^/]+\/files\//

/**
 * Legacy root-level profile pictures. A path-join bug (see
 * `utils/imagePickers.ts`) used to store profile pictures directly in the
 * Documents root as `profilePicture<uuid>.<ext>`. They are mapped into the
 * canonical `profilePicture/<basename>` root during migration.
 */
export const LEGACY_ROOT_PROFILE_PICTURE_REGEX =
  /^profilePicture[^/]+\.(?:jpg|jpeg|png|gif|webp|heic)$/i

const decodeNormalizedRelativeFilePath = Schema.decodeUnknownEither(
  NormalizedRelativeFilePath
)

const pathInvalid = (): DeviceMigrationError =>
  new DeviceMigrationError({code: 'pathInvalid'})

const ensureTrailingSlash = (uri: string): string =>
  uri.endsWith('/') ? uri : `${uri}/`

/**
 * Percent-decodes every path segment. Expo/iOS URIs are percent-encoded
 * while the app's own string-concatenated URIs carry raw segments — after
 * decoding both forms yield the same canonical raw relative path.
 */
const decodePathSegments = (
  relativePath: string
): Either.Either<string, DeviceMigrationError> =>
  Either.try({
    try: () =>
      pipe(
        relativePath.split('/'),
        Array.map((segment) => decodeURIComponent(segment))
      ).join('/'),
    catch: pathInvalid,
  })

const mapLegacyRootProfilePicture = (relativePath: string): string =>
  !relativePath.includes('/') &&
  LEGACY_ROOT_PROFILE_PICTURE_REGEX.test(relativePath)
    ? `profilePicture/${relativePath}`
    : relativePath

const stripKnownRoot = (
  uri: string,
  knownRootUris: readonly string[]
): string | undefined => {
  for (const root of knownRootUris) {
    const rootWithSlash = ensureTrailingSlash(root)
    if (uri.startsWith(rootWithSlash) && uri.length > rootWithSlash.length)
      return uri.slice(rootWithSlash.length)
  }

  const iosMatch = IOS_DOCUMENTS_ROOT_REGEX.exec(uri)
  if (iosMatch !== null && uri.length > iosMatch[0].length)
    return uri.slice(iosMatch[0].length)

  const androidMatch = ANDROID_FILES_ROOT_REGEX.exec(uri)
  if (androidMatch !== null && uri.length > androidMatch[0].length)
    return uri.slice(androidMatch[0].length)

  return undefined
}

/**
 * Maps one absolute device `file://` URI to its canonical migration file
 * reference. Fails with `DeviceMigrationError('pathInvalid')` when the URI
 * points outside every known document root or its relative path does not
 * validate against the approved migration roots.
 */
export function normalizeFileUriToMigrationReference(
  uri: string,
  knownRootUris: readonly string[]
): Either.Either<string, DeviceMigrationError> {
  const strippedPath = stripKnownRoot(uri, knownRootUris)
  if (strippedPath === undefined) return Either.left(pathInvalid())

  return pipe(
    decodePathSegments(strippedPath),
    Either.map(mapLegacyRootProfilePicture),
    Either.flatMap((relativePath) =>
      pipe(
        decodeNormalizedRelativeFilePath(relativePath),
        Either.mapLeft(pathInvalid)
      )
    ),
    Either.map(
      (relativePath) => `${MIGRATION_FILE_REFERENCE_SCHEME}${relativePath}`
    )
  )
}

type JsonStringMapper = (
  value: string
) => Either.Either<string, DeviceMigrationError>

function mapJsonStringValuesDeep(
  value: unknown,
  mapString: JsonStringMapper
): Either.Either<unknown, DeviceMigrationError> {
  if (typeof value === 'string') return mapString(value)

  if (globalThis.Array.isArray(value)) {
    const result: unknown[] = []
    for (const item of value) {
      const mapped = mapJsonStringValuesDeep(item, mapString)
      if (Either.isLeft(mapped)) return mapped
      result.push(mapped.right)
    }
    return Either.right(result)
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {}
    // Object keys are never rewritten — persisted maps are keyed by ids and
    // public keys, never by file URIs. Insertion order is preserved so the
    // re-serialized JSON stays deterministic.
    for (const [key, item] of Object.entries(value)) {
      const mapped = mapJsonStringValuesDeep(item, mapString)
      if (Either.isLeft(mapped)) return mapped
      result[key] = mapped.right
    }
    return Either.right(result)
  }

  return Either.right(value)
}

function mapJsonStringValues(
  jsonString: string,
  mapString: JsonStringMapper
): Either.Either<string, DeviceMigrationError> {
  return pipe(
    Either.try({
      try: (): unknown => JSON.parse(jsonString),
      catch: () => new DeviceMigrationError({code: 'schemaInvalid'}),
    }),
    Either.flatMap((parsed) => mapJsonStringValuesDeep(parsed, mapString)),
    Either.flatMap((mapped) =>
      Either.try({
        try: () => JSON.stringify(mapped),
        catch: () => new DeviceMigrationError({code: 'schemaInvalid'}),
      })
    )
  )
}

/**
 * Replaces every recognized absolute device `file://` URI inside the JSON
 * string values of one persisted value with its canonical migration file
 * reference (export direction).
 *
 * - String values not starting with `file://` are left untouched.
 * - `file://` values under a known root (explicit `knownRootUris`, any iOS
 *   application-container `Documents/` root, Android
 *   `/data/user/<n>/<pkg>/files` and `/data/data/<pkg>/files`) become
 *   `vexl-migration-file://<normalized-relative-path>`.
 * - Legacy Documents-root `profilePicture<uuid>.<ext>` files map to
 *   `profilePicture/<basename>`.
 * - Already-canonical `vexl-migration-file://` values are validated and kept
 *   (the operation is idempotent).
 * - Any other `file://` URI fails with `DeviceMigrationError('pathInvalid')`.
 * - Invalid JSON fails with `DeviceMigrationError('schemaInvalid')`.
 */
export function normalizePersistedValueUris(
  jsonString: string,
  knownRootUris: readonly string[]
): Either.Either<string, DeviceMigrationError> {
  return mapJsonStringValues(jsonString, (value) => {
    if (value.startsWith(MIGRATION_FILE_REFERENCE_SCHEME)) {
      return pipe(
        decodeNormalizedRelativeFilePath(
          value.slice(MIGRATION_FILE_REFERENCE_SCHEME.length)
        ),
        Either.mapLeft(pathInvalid),
        Either.map(() => value)
      )
    }
    if (!value.startsWith('file://')) return Either.right(value)
    return normalizeFileUriToMigrationReference(value, knownRootUris)
  })
}

/**
 * Replaces every canonical `vexl-migration-file://` reference inside the
 * JSON string values of one staged value with an absolute URI under the
 * destination document directory (install direction).
 *
 * Any remaining absolute `file://` URI fails with
 * `DeviceMigrationError('pathInvalid')` — staged values must contain only
 * canonical references, so an absolute URI means the source failed to
 * normalize (or a hostile source injected one) and must never be installed.
 */
export function denormalizeUrisToDestination(
  jsonString: string,
  documentDirectoryUri: string
): Either.Either<string, DeviceMigrationError> {
  const rootWithSlash = ensureTrailingSlash(documentDirectoryUri)

  return mapJsonStringValues(jsonString, (value) => {
    if (value.startsWith(MIGRATION_FILE_REFERENCE_SCHEME)) {
      const relativePath = value.slice(MIGRATION_FILE_REFERENCE_SCHEME.length)
      return pipe(
        decodeNormalizedRelativeFilePath(relativePath),
        Either.mapLeft(pathInvalid),
        Either.map(
          (validatedPath) =>
            `${rootWithSlash}${pipe(
              validatedPath.split('/'),
              Array.map(encodeURIComponent)
            ).join('/')}`
        )
      )
    }
    if (value.startsWith('file://')) return Either.left(pathInvalid())
    return Either.right(value)
  })
}
