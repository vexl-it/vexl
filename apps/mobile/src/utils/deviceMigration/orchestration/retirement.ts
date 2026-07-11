import {sha256Bytes} from '@vexl-next/cryptography/src/operations/deviceMigration/sha256'
import {CleanupResultDigest} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {
  bytesToHex,
  utf8Encode,
} from '@vexl-next/domain/src/general/deviceMigration/encoding'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Effect, Option, Schema} from 'effect'
import * as Notifications from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {Base64} from 'js-base64'
import {getActiveVexlRequestCount} from '../../../api/vexlHttpClientLayer'
import {sessionHolderAtom} from '../../../state/session'
import {deleteSessionFromStorageVerified} from '../../../state/session/utils/deleteSessionFromStorageVerified'
import {invalidateScheduledMmkvWrites} from '../../atomUtils/atomWithParsedMmkvStorage'
import {getManagedTaskFiberCount} from '../../inAppLoadingTasks/managedTaskFibers'
import {storage} from '../../mmkv/effectMmkv'
import {
  clearMigrationControlRecord,
  readMigrationControlRecord,
  transitionMigrationControl,
} from '../controlStore'
import {
  emptySourceCleanupProgress,
  isSourceCleanupComplete,
  type SourceCleanupProgress,
  type SourceErasedAwaitingDestinationAckControlRecord,
  type SourceErasingControlRecord,
} from '../controlStore/domain'
import {
  deleteMigrationSecretsVerified,
  loadMigrationSecret,
} from '../controlStore/secrets'
import {
  createSourceErasedReceiptQr,
  currentMigrationVersion,
} from '../protocol/qrGlue'
import {deleteApprovedMigrationFilesVerified} from '../snapshot/snapshotFileSystem'

const error = (code: DeviceMigrationError['code']): DeviceMigrationError =>
  new DeviceMigrationError({code})

function persistProgress(
  record: SourceErasingControlRecord,
  progress: SourceCleanupProgress
): Effect.Effect<SourceErasingControlRecord, DeviceMigrationError> {
  const next: SourceErasingControlRecord = {
    ...record,
    cleanupProgress: progress,
  }
  return Effect.try({
    try: () => {
      transitionMigrationControl(['sourceErasing'], next)
      return next
    },
    catch: () => error('stateInvalid'),
  })
}

function clearDefaultMmkvVerified(): Effect.Effect<void, DeviceMigrationError> {
  return Effect.try({
    try: () => {
      storage._storage.clearAll()
      if (storage._storage.getAllKeys().length !== 0)
        throw new Error('MMKV is not empty')
    },
    catch: () => error('cleanupIncomplete'),
  })
}

function cleanupResultDigest(): CleanupResultDigest {
  return Schema.decodeSync(CleanupResultDigest)(
    bytesToHex(
      sha256Bytes(
        utf8Encode(
          [
            'gatesClosed=ok',
            'sessionDeleted=ok',
            'mmkvWritesInvalidated=ok',
            'mmkvCleared=ok',
            'filesDeleted=ok',
            'scheduledNotificationsCancelled=ok',
            'notificationStateCleared=ok',
            'memoryLoggedOut=ok',
          ].join('\n')
        )
      )
    )
  )
}

/** Idempotent, journaled local-only retirement. Never imports or calls logout. */
export function runSourceRetirement(): Effect.Effect<
  SourceErasedAwaitingDestinationAckControlRecord,
  DeviceMigrationError
> {
  return Effect.gen(function* (_) {
    const initial = readMigrationControlRecord()
    if (initial.mode === 'sourceErasedAwaitingDestinationAck') return initial
    if (
      initial.mode !== 'sourceRetirementCommitted' &&
      initial.mode !== 'sourceErasing'
    )
      return yield* _(Effect.fail(error('stateInvalid')))

    if (getActiveVexlRequestCount() !== 0 || getManagedTaskFiberCount() !== 0)
      return yield* _(Effect.fail(error('cleanupIncomplete')))

    let record: SourceErasingControlRecord
    if (initial.mode === 'sourceRetirementCommitted') {
      record = {
        ...initial,
        mode: 'sourceErasing',
        cleanupProgress: emptySourceCleanupProgress,
      }
      yield* _(
        Effect.try({
          try: () => {
            transitionMigrationControl(['sourceRetirementCommitted'], record)
          },
          catch: () => error('stateInvalid'),
        })
      )
    } else record = initial

    if (
      !record.cleanupProgress.asyncStorageSessionDeleted ||
      !record.cleanupProgress.secureStoreSessionSecretsDeleted
    ) {
      yield* _(deleteSessionFromStorageVerified())
      // Effect.gen is sequential; no concurrent writer observes this local.
      // eslint-disable-next-line require-atomic-updates
      record = yield* _(
        persistProgress(record, {
          ...record.cleanupProgress,
          asyncStorageSessionDeleted: true,
          secureStoreSessionSecretsDeleted: true,
        })
      )
    }
    if (!record.cleanupProgress.pendingMmkvWritesInvalidated) {
      yield* _(Effect.sync(invalidateScheduledMmkvWrites))
      // eslint-disable-next-line require-atomic-updates
      record = yield* _(
        persistProgress(record, {
          ...record.cleanupProgress,
          pendingMmkvWritesInvalidated: true,
        })
      )
    }
    if (!record.cleanupProgress.mmkvAccountStateCleared) {
      yield* _(clearDefaultMmkvVerified())
      // eslint-disable-next-line require-atomic-updates
      record = yield* _(
        persistProgress(record, {
          ...record.cleanupProgress,
          mmkvAccountStateCleared: true,
        })
      )
    }
    if (!record.cleanupProgress.accountFileRootsDeleted) {
      yield* _(deleteApprovedMigrationFilesVerified())
      // eslint-disable-next-line require-atomic-updates
      record = yield* _(
        persistProgress(record, {
          ...record.cleanupProgress,
          accountFileRootsDeleted: true,
        })
      )
    }
    if (!record.cleanupProgress.scheduledNotificationsCancelled) {
      yield* _(
        Effect.tryPromise({
          try: async () => {
            await Notifications.cancelAllScheduledNotificationsAsync()
          },
          catch: () => error('cleanupIncomplete'),
        })
      )
      // eslint-disable-next-line require-atomic-updates
      record = yield* _(
        persistProgress(record, {
          ...record.cleanupProgress,
          scheduledNotificationsCancelled: true,
        })
      )
    }
    if (!record.cleanupProgress.notificationStateCleared) {
      yield* _(
        Effect.tryPromise({
          try: async () => {
            await Notifications.setBadgeCountAsync(0)
            await Notifications.dismissAllNotificationsAsync()
          },
          catch: () => error('cleanupIncomplete'),
        })
      )
      // eslint-disable-next-line require-atomic-updates
      record = yield* _(
        persistProgress(record, {
          ...record.cleanupProgress,
          notificationStateCleared: true,
        })
      )
    }
    if (!isSourceCleanupComplete(record.cleanupProgress))
      return yield* _(Effect.fail(error('cleanupIncomplete')))

    // Direct holder update is intentional. sessionAtom(None) performs
    // fire-and-forget deletes and ordinary logout performs remote deletion.
    yield* _(
      Effect.sync(() => {
        getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})
      })
    )
    const txKey = yield* _(loadMigrationSecret('qrAuthTxKey'))
    if (Option.isNone(txKey))
      return yield* _(Effect.fail(error('cleanupIncomplete')))
    const receipt = yield* _(
      createSourceErasedReceiptQr({
        version: currentMigrationVersion,
        transferId: record.transferId,
        manifestDigest: record.manifestDigest,
        snapshotContentDigest: record.snapshotContentDigest,
        acceptedEraseCommandDigest: record.acceptedEraseCommandDigest,
        acceptedEraseCommandNonce: record.acceptedEraseCommandNonce,
        cleanupResultDigest: cleanupResultDigest(),
        qrMacTxKey: Base64.toUint8Array(txKey.value),
      })
    )
    const completed: SourceErasedAwaitingDestinationAckControlRecord = {
      ...record,
      mode: 'sourceErasedAwaitingDestinationAck',
      sourceErasedReceipt: receipt,
    }
    yield* _(
      Effect.try({
        try: () => {
          transitionMigrationControl(['sourceErasing'], completed)
        },
        catch: () => error('stateInvalid'),
      })
    )
    return completed
  })
}

export function continueSourceRecovery(): Effect.Effect<
  SourceErasedAwaitingDestinationAckControlRecord | undefined,
  DeviceMigrationError
> {
  const record = readMigrationControlRecord()
  if (
    record.mode === 'sourceRetirementCommitted' ||
    record.mode === 'sourceErasing'
  )
    return runSourceRetirement()
  if (record.mode === 'sourceErasedAwaitingDestinationAck')
    return Effect.succeed(record)
  if (record.mode === 'sourceComplete')
    return deleteMigrationSecretsVerified().pipe(
      Effect.flatMap(() =>
        Effect.try({
          try: clearMigrationControlRecord,
          catch: () => error('stateInvalid'),
        })
      ),
      Effect.as(undefined)
    )
  return Effect.fail(error('stateInvalid'))
}
