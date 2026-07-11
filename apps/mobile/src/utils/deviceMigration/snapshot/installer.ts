import {constantTimeEqualStrings} from '@vexl-next/cryptography/src/operations/deviceMigration/constantTimeEqual'
import {sha256Bytes} from '@vexl-next/cryptography/src/operations/deviceMigration/sha256'
import {
  computeLeafDigest,
  computeManifestDigest,
  computeSnapshotContentRoot,
  encodeFileLeaf,
  encodeMmkvLeaf,
  encodeSessionLeaf,
  mmkvEntryValueBytes,
  type FileSnapshotLeaf,
  type MmkvSnapshotLeaf,
  type SnapshotLeaf,
} from '@vexl-next/domain/src/general/deviceMigration/contentDigest'
import {
  bytesToHex,
  utf8Encode,
} from '@vexl-next/domain/src/general/deviceMigration/encoding'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {
  toCanonicalManifestForDigest,
  type SnapshotManifest,
} from '@vexl-next/domain/src/general/deviceMigration/snapshotManifest'
import {Array, Effect, Either, pipe, Schema} from 'effect'
import {Paths} from 'expo-file-system'
import {Base64} from 'js-base64'
import {
  isSessionV2,
  sanityCheckSessionV2,
  Session,
} from '../../../brands/Session.brand'
import {installMigratedSessionToStorage} from '../../../state/session/utils/installMigratedSession'
import {readSessionFromStorage} from '../../../state/session/utils/readSessionFromStorage'
import {V2_SECRET_WAS_WRITTEN_STORAGE_KEY} from '../../../state/session/utils/v2SecretStorageFlag'
import {
  CLEAR_STORAGE_KEY,
  invalidateScheduledMmkvWrites,
} from '../../atomUtils/atomWithParsedMmkvStorage'
import {freezeMmkvPersistence} from '../../atomUtils/mmkvMigrationRegistry'
import {storage} from '../../mmkv/effectMmkv'
import {
  readMigrationControlRecord,
  transitionMigrationControl,
} from '../controlStore'
import {readExportedMmkvEntry} from './exporter'
import {
  documentDirectory,
  ensureParentDirectories,
  openVerifiedFileWriter,
  streamFileSha256,
} from './snapshotFileSystem'
import {openStagedSnapshot} from './stagingStore'
import {
  denormalizeUrisToDestination,
  normalizePersistedValueUris,
} from './uriNormalization'

/**
 * Idempotent snapshot installer — spec section "Installation order", steps
 * 1–9 (activation, completion and `reloadAppAsync` are wired by the
 * activation flow):
 *
 *  2. invalidate deferred MMKV writes and freeze persistence;
 *  3. create approved live file directories and install verified files;
 *  4. replace the default MMKV contents with typed writes;
 *  5. apply lifecycle markers for the exact storage schema;
 *  6. construct and validate the new destination session;
 *  7. write the destination SecureStore secret (FIRST);
 *  8. write the AsyncStorage session LAST (commit marker);
 *  9. re-read the installed logical state through the canonical migration
 *     projections, recompute the snapshot content digest, and verify exact
 *     (constant-time) equality with the staged digest before entering
 *     activation-only mode.
 *
 * Runs only in `destinationSourceEraseConfirmed` or `destinationInstalling`
 * (crash resume). Every step is idempotent, so a crash at any point resumes
 * from the journal (the control record) without the source. On any failure
 * the control record REMAINS `destinationInstalling` and staging stays
 * intact — partially installed state never activates.
 *
 * PRIVACY: everything handled here is sensitive account/migration data.
 * Every failure surfaces as `DeviceMigrationError` with an enumerated code
 * only.
 */

/**
 * Keys the installer itself writes on top of the snapshot content. The
 * post-install re-read verification allows exactly the manifest keys plus
 * these.
 */
export const INSTALLER_WRITTEN_MMKV_KEYS: readonly string[] = [
  // Lifecycle marker: records that the installed snapshot already matches
  // the current storage schema, so old version migrations never run against
  // migrated data.
  'migration',
  // MMKV data-loss detector sentinel — clearAll deleted it; restamping keeps
  // the detector (and its Sentry report) quiet on the next boot.
  '__mmkv_data_exists',
  // Written by installMigratedSessionToStorage (markV2SecretAsWritten).
  V2_SECRET_WAS_WRITTEN_STORAGE_KEY,
]

const err = (code: DeviceMigrationError['code']): DeviceMigrationError =>
  new DeviceMigrationError({code})

const VersionMigrationsRecord = Schema.Struct({
  contactsMigrated: Schema.Boolean,
})
const encodeVersionMigrationsRecord = Schema.encodeSync(
  Schema.parseJson(VersionMigrationsRecord)
)

const decodeSession = Schema.decodeUnknownEither(Schema.parseJson(Session))
const encodeSession = Schema.encodeEither(Schema.parseJson(Session))

function controlTransition(
  run: () => void
): Effect.Effect<void, DeviceMigrationError> {
  return Effect.try({
    try: run,
    catch: (error) =>
      error instanceof DeviceMigrationError ? error : err('stateInvalid'),
  })
}

/**
 * Installs the durably staged snapshot. See the module documentation for
 * the exact step order and idempotency guarantees.
 */
export function installStagedSnapshot(): Effect.Effect<
  void,
  DeviceMigrationError
> {
  return Effect.gen(function* (_) {
    // -- Step 1 (journal): enter destinationInstalling ----------------------
    const initialControlRecord = readMigrationControlRecord()
    if (
      initialControlRecord.mode !== 'destinationSourceEraseConfirmed' &&
      initialControlRecord.mode !== 'destinationInstalling'
    )
      return yield* _(Effect.fail(err('stateInvalid')))

    if (initialControlRecord.mode === 'destinationSourceEraseConfirmed') {
      yield* _(
        controlTransition(() => {
          transitionMigrationControl(['destinationSourceEraseConfirmed'], {
            ...initialControlRecord,
            mode: 'destinationInstalling',
          })
        })
      )
    }
    const expectedSnapshotContentDigest =
      initialControlRecord.snapshotContentDigest

    // -- Step 2: no deferred/default-MMKV write may overwrite imported values
    yield* _(
      Effect.sync(() => {
        invalidateScheduledMmkvWrites()
        freezeMmkvPersistence()
      })
    )

    const reader = yield* _(openStagedSnapshot())
    const manifest = reader.manifest

    // The staged package must be the exact one the source-erased receipt
    // (and therefore the control record) commits to.
    if (
      !constantTimeEqualStrings(
        manifest.snapshotContentDigest,
        expectedSnapshotContentDigest
      )
    )
      return yield* _(Effect.fail(err('digestMismatch')))

    const documents = yield* _(documentDirectory())

    // -- Step 3: install verified files (files first) -----------------------
    for (const descriptor of manifest.files) {
      yield* _(
        ensureParentDirectories({
          rootDirectoryUri: documents.uri,
          relativePath: descriptor.path,
        })
      )
      const writer = yield* _(
        openVerifiedFileWriter({
          fileUri: Paths.join(documents.uri, descriptor.path),
          expectedByteLength: descriptor.byteLength,
          expectedSha256: descriptor.sha256,
        })
      )
      yield* _(
        reader
          .readFileChunks(descriptor.path, (bytes) => {
            writer.writeSync(bytes)
          })
          .pipe(
            Effect.tapError(() =>
              Effect.sync(() => {
                writer.abort()
              })
            )
          )
      )
      yield* _(writer.finish())
    }

    // -- Step 4: replace the default MMKV contents --------------------------
    yield* _(
      Effect.try({
        try: () => {
          storage._storage.clearAll()
        },
        catch: () => err('stateInvalid'),
      })
    )

    for (const descriptor of manifest.mmkvEntries) {
      const entry = yield* _(reader.readMmkvEntry(descriptor.key))
      if (entry.type !== descriptor.type)
        return yield* _(Effect.fail(err('schemaInvalid')))
      const valueBytes = mmkvEntryValueBytes(entry)
      if (
        valueBytes.length !== descriptor.byteLength ||
        !constantTimeEqualStrings(
          bytesToHex(sha256Bytes(valueBytes)),
          descriptor.sha256
        )
      )
        return yield* _(Effect.fail(err('digestMismatch')))

      if (entry.type === 'string') {
        const denormalized = denormalizeUrisToDestination(
          entry.value,
          documents.uri
        )
        if (Either.isLeft(denormalized))
          return yield* _(Effect.fail(denormalized.left))
        yield* _(
          Effect.try({
            try: () => {
              storage._storage.set(entry.key, denormalized.right)
            },
            catch: () => err('stateInvalid'),
          })
        )
        continue
      }

      yield* _(
        Effect.try({
          try: () => {
            if (entry.type === 'boolean' || entry.type === 'number') {
              storage._storage.set(entry.key, entry.value)
              return
            }
            // Buffer entry — restore the exact raw bytes.
            const bytes = Base64.toUint8Array(entry.value)
            const arrayBuffer = new ArrayBuffer(bytes.length)
            new Uint8Array(arrayBuffer).set(bytes)
            storage._storage.set(entry.key, arrayBuffer)
          },
          catch: () => err('stateInvalid'),
        })
      )
    }

    // -- Step 5: lifecycle markers for the exact storage schema -------------
    yield* _(
      Effect.try({
        try: () => {
          // The canonical snapshot already matches the current storage
          // schema; recording contactsMigrated prevents the old contacts
          // version-migration from re-running against installed data.
          storage._storage.set(
            'migration',
            encodeVersionMigrationsRecord({contactsMigrated: true})
          )
          storage._storage.set('__mmkv_data_exists', Date.now().toString())
        },
        catch: () => err('stateInvalid'),
      })
    )

    // -- Steps 6–8: construct, validate and transactionally install session -
    const stagedSessionJson = yield* _(reader.readSessionJson())
    const stagedSessionBytes = utf8Encode(stagedSessionJson)
    if (
      stagedSessionBytes.length !== manifest.session.byteLength ||
      !constantTimeEqualStrings(
        bytesToHex(sha256Bytes(stagedSessionBytes)),
        manifest.session.sha256
      )
    )
      return yield* _(Effect.fail(err('digestMismatch')))

    const denormalizedSessionJson = yield* _(
      denormalizeUrisToDestination(stagedSessionJson, documents.uri)
    )
    const session = decodeSession(denormalizedSessionJson)
    if (
      Either.isLeft(session) ||
      !isSessionV2(session.right) ||
      !sanityCheckSessionV2(session.right)
    )
      return yield* _(Effect.fail(err('sessionInvalid')))

    yield* _(
      installMigratedSessionToStorage({sessionJson: denormalizedSessionJson})
    )

    // -- Step 9: re-read everything through the canonical projections -------
    yield* _(
      verifyInstalledStateMatchesSnapshot(reader.manifest, documents.uri)
    )

    // Installation verified — enter activation-only mode. The Vexl gate
    // stays closed until the activation flow opens its narrow allowlist.
    yield* _(
      controlTransition(() => {
        const currentControlRecord = readMigrationControlRecord()
        if (currentControlRecord.mode !== 'destinationInstalling')
          throw err('stateInvalid')
        transitionMigrationControl(['destinationInstalling'], {
          ...currentControlRecord,
          mode: 'destinationActivating',
        })
      })
    )
  })
}

function verifyInstalledStateMatchesSnapshot(
  manifest: SnapshotManifest,
  documentDirectoryUri: string
): Effect.Effect<void, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    // MMKV: exactly the manifest keys plus the installer-written markers may
    // exist.
    const allKeys = yield* _(
      Effect.try({
        try: () => storage._storage.getAllKeys(),
        catch: () => err('stateInvalid'),
      })
    )
    const allowedKeys = new Set<string>([
      ...pipe(
        manifest.mmkvEntries,
        Array.map((descriptor) => descriptor.key)
      ),
      ...INSTALLER_WRITTEN_MMKV_KEYS,
      // Written by clearMmkvStorageAndEmptyAtoms on some paths; harmless but
      // possible to observe after an earlier logout on the same install.
      CLEAR_STORAGE_KEY,
    ])
    for (const key of allKeys) {
      if (!allowedKeys.has(key))
        return yield* _(Effect.fail(err('stateInvalid')))
    }

    const knownRootUris = [documentDirectoryUri]

    // Installed MMKV values, projected back to their canonical snapshot
    // representation (URI re-normalization; the per-key export transforms
    // are idempotent, so the same projection is reused).
    const mmkvLeaves: MmkvSnapshotLeaf[] = []
    for (const descriptor of manifest.mmkvEntries) {
      const projected = readExportedMmkvEntry({
        key: descriptor.key,
        nativeType: descriptor.type,
        knownRootUris,
      })
      if (Either.isLeft(projected)) return yield* _(Effect.fail(projected.left))
      const valueBytes = mmkvEntryValueBytes(projected.right)
      if (
        valueBytes.length !== descriptor.byteLength ||
        !constantTimeEqualStrings(
          bytesToHex(sha256Bytes(valueBytes)),
          descriptor.sha256
        )
      )
        return yield* _(Effect.fail(err('digestMismatch')))
      mmkvLeaves.push({
        key: descriptor.key,
        byteLength: descriptor.byteLength,
        digest: computeLeafDigest(
          encodeMmkvLeaf({
            key: descriptor.key,
            nativeType: descriptor.type,
            declaredByteLength: descriptor.byteLength,
            valueBytes,
          })
        ),
      })
    }

    // Session sanity re-read: decrypt through the ordinary reader, then
    // project back to the canonical (URI-normalized) encoding.
    const installedSession = yield* _(
      readSessionFromStorage().pipe(
        Effect.mapError(() => err('sessionInvalid'))
      )
    )
    if (
      !isSessionV2(installedSession) ||
      !sanityCheckSessionV2(installedSession)
    )
      return yield* _(Effect.fail(err('sessionInvalid')))
    const reEncodedSession = encodeSession(installedSession)
    if (Either.isLeft(reEncodedSession))
      return yield* _(Effect.fail(err('sessionInvalid')))
    const normalizedSession = yield* _(
      normalizePersistedValueUris(reEncodedSession.right, knownRootUris)
    )
    const sessionBytes = utf8Encode(normalizedSession)
    if (
      sessionBytes.length !== manifest.session.byteLength ||
      !constantTimeEqualStrings(
        bytesToHex(sha256Bytes(sessionBytes)),
        manifest.session.sha256
      )
    )
      return yield* _(Effect.fail(err('digestMismatch')))
    const sessionLeaf: SnapshotLeaf = {
      byteLength: manifest.session.byteLength,
      digest: computeLeafDigest(
        encodeSessionLeaf({
          declaredByteLength: manifest.session.byteLength,
          valueBytes: sessionBytes,
        })
      ),
    }

    // Installed files.
    const fileLeaves: FileSnapshotLeaf[] = []
    for (const descriptor of manifest.files) {
      const streamed = yield* _(
        streamFileSha256(Paths.join(documentDirectoryUri, descriptor.path))
      )
      if (
        streamed.byteLength !== descriptor.byteLength ||
        !constantTimeEqualStrings(streamed.sha256, descriptor.sha256)
      )
        return yield* _(Effect.fail(err('digestMismatch')))
      fileLeaves.push({
        path: descriptor.path,
        byteLength: descriptor.byteLength,
        digest: computeLeafDigest(
          encodeFileLeaf({
            path: descriptor.path,
            declaredByteLength: descriptor.byteLength,
            fileContentSha256: streamed.digestBytes,
          })
        ),
      })
    }

    // Final root recompute over the re-read state.
    const recomputedManifestDigest = yield* _(
      Effect.try({
        try: () =>
          computeManifestDigest(toCanonicalManifestForDigest(manifest)),
        catch: () => err('schemaInvalid'),
      })
    )
    if (
      !constantTimeEqualStrings(
        recomputedManifestDigest,
        manifest.manifestDigest
      )
    )
      return yield* _(Effect.fail(err('digestMismatch')))

    const recomputedContentDigest = yield* _(
      Effect.try({
        try: () =>
          computeSnapshotContentRoot({
            protocolVersion: manifest.protocolVersion,
            storageSchemaVersion: manifest.storageSchemaVersion,
            manifestDigest: manifest.manifestDigest,
            mmkvLeaves,
            sessionLeaf,
            fileLeaves,
          }),
        catch: () => err('schemaInvalid'),
      })
    )
    if (
      !constantTimeEqualStrings(
        recomputedContentDigest,
        manifest.snapshotContentDigest
      )
    )
      return yield* _(Effect.fail(err('digestMismatch')))
  })
}
