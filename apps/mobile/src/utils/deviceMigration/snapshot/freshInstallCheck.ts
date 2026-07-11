import AsyncStorage from '@react-native-async-storage/async-storage'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Effect} from 'effect'
import {Directory, File, Paths} from 'expo-file-system'
import * as SecretStore from 'expo-secure-store'
import {
  SECRET_TOKEN_KEY,
  SECRET_TOKEN_KEY_V2,
  SESSION_KEY,
} from '../../../state/session/utils/writeSessionToStorage'
import {readMigrationControlRecord} from '../controlStore'
import {STAGING_DIRECTORY_NAME} from './constants'
import {
  APPROVED_MIGRATION_FILE_ROOTS,
  documentDirectory,
} from './snapshotFileSystem'
import {LEGACY_ROOT_PROFILE_PICTURE_REGEX} from './uriNormalization'

/**
 * Fresh-install precondition (spec section "Fresh-install precondition").
 * Before the destination may pair, it verifies locally — without contacting
 * Vexl — that no account exists on this installation:
 *
 * - no encrypted session in AsyncStorage;
 * - no session secret in SecureStore (current or legacy slot);
 * - the approved account file roots are absent/empty, including legacy
 *   Documents-root `profilePicture*` files;
 * - no unresolved migration control record and no leftover staging
 *   directory.
 *
 * Device-local, ephemeral, preference and lifecycle MMKV values may exist —
 * the installer explicitly overwrites them: it clears the whole default MMKV
 * instance before installing the snapshot and rewrites the lifecycle
 * markers, so nothing of the pre-migration installation state survives.
 *
 * Fails with `DeviceMigrationError('freshInstallRequired')`. Failures to
 * READ any store also fail — a fresh install cannot be proven.
 */

const freshInstallRequired = (): DeviceMigrationError =>
  new DeviceMigrationError({code: 'freshInstallRequired'})

function checkSessionAbsent(): Effect.Effect<void, DeviceMigrationError> {
  return Effect.tryPromise({
    try: async () => {
      if ((await AsyncStorage.getItem(SESSION_KEY)) !== null)
        throw new Error('session present')
      if ((await SecretStore.getItemAsync(SECRET_TOKEN_KEY_V2)) !== null)
        throw new Error('v2 secret present')
      if ((await SecretStore.getItemAsync(SECRET_TOKEN_KEY)) !== null)
        throw new Error('legacy secret present')
    },
    catch: freshInstallRequired,
  })
}

function checkAccountFileRootsAbsent(): Effect.Effect<
  void,
  DeviceMigrationError
> {
  return documentDirectory().pipe(
    Effect.mapError(freshInstallRequired),
    Effect.flatMap((documents) =>
      Effect.try({
        try: () => {
          for (const root of APPROVED_MIGRATION_FILE_ROOTS) {
            const directory = new Directory(Paths.join(documents.uri, root))
            if (!directory.exists) continue
            if (directory.list().length > 0)
              throw new Error('account files present')
          }
          for (const entry of documents.list()) {
            if (
              entry instanceof File &&
              LEGACY_ROOT_PROFILE_PICTURE_REGEX.test(entry.name)
            )
              throw new Error('legacy profile picture present')
          }
        },
        catch: freshInstallRequired,
      })
    )
  )
}

function checkNoUnresolvedMigrationState(): Effect.Effect<
  void,
  DeviceMigrationError
> {
  return documentDirectory().pipe(
    Effect.mapError(freshInstallRequired),
    Effect.flatMap((documents) =>
      Effect.try({
        try: () => {
          if (readMigrationControlRecord().mode !== 'normal')
            throw new Error('unresolved migration control record')
          // A leftover staging directory without a control record means an
          // earlier migration's cleanup never completed.
          if (
            new Directory(Paths.join(documents.uri, STAGING_DIRECTORY_NAME))
              .exists
          )
            throw new Error('leftover staging directory')
        },
        catch: freshInstallRequired,
      })
    )
  )
}

/**
 * Verifies every fresh-install precondition. This check never contacts
 * Vexl.
 */
export function verifyFreshInstallForMigration(): Effect.Effect<
  void,
  DeviceMigrationError
> {
  return Effect.gen(function* (_) {
    yield* _(checkNoUnresolvedMigrationState())
    yield* _(checkSessionAbsent())
    yield* _(checkAccountFileRootsAbsent())
  })
}
