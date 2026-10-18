import {
  BackupFileFromJson,
  type BackupFile,
} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Array, Effect, Option, Schema} from 'effect'
import {getDocumentAsync} from 'expo-document-picker'
import {File} from 'expo-file-system'

// Generous: legacy keys of a long-time user are a few hundred kB at most.
const MAX_BACKUP_FILE_SIZE_BYTES = 5 * 1024 * 1024

export class InvalidBackupFileError extends Schema.TaggedError<InvalidBackupFileError>(
  'InvalidBackupFileError'
)('InvalidBackupFileError', {
  reason: Schema.Literal('notABackup', 'unsupportedVersion'),
}) {}

export class ReadingBackupFileError extends Schema.TaggedError<ReadingBackupFileError>(
  'ReadingBackupFileError'
)('ReadingBackupFileError', {
  cause: Schema.Unknown,
}) {}

const BackupFileVersion = Schema.parseJson(
  Schema.Struct({version: Schema.Number})
)

export const decodeBackupFile = (
  content: string
): Effect.Effect<BackupFile, InvalidBackupFileError> =>
  Schema.decodeUnknown(BackupFileVersion)(content).pipe(
    Effect.mapError(() => new InvalidBackupFileError({reason: 'notABackup'})),
    Effect.filterOrFail(
      ({version}) => version === 1,
      () => new InvalidBackupFileError({reason: 'unsupportedVersion'})
    ),
    Effect.zipRight(
      Schema.decodeUnknown(BackupFileFromJson)(content).pipe(
        Effect.mapError(
          () => new InvalidBackupFileError({reason: 'notABackup'})
        )
      )
    )
  )

const readAndDeletePickedFile = (
  uri: string
): Effect.Effect<Option.Option<string>, ReadingBackupFileError> =>
  Effect.tryPromise({
    try: async () => {
      const file = new File(uri)
      try {
        if (file.size > MAX_BACKUP_FILE_SIZE_BYTES) return Option.none()
        return Option.some(await file.text())
      } finally {
        // The picker leaves a copy of the file in the cache directory.
        if (file.info().exists) file.delete()
      }
    },
    catch: (cause) => new ReadingBackupFileError({cause}),
  })

// None when the user closes the picker. Only picks - reading a large file
// takes seconds, so callers show progress before calling readBackupFile.
export const pickBackupFileUri = (): Effect.Effect<
  Option.Option<string>,
  ReadingBackupFileError
> =>
  Effect.tryPromise({
    try: async () =>
      await getDocumentAsync({
        // The custom extension has no registered MIME type, so the content
        // is validated instead.
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      }),
    catch: (cause) => new ReadingBackupFileError({cause}),
  }).pipe(
    Effect.map((pickerResult) =>
      pickerResult.canceled
        ? Option.none()
        : Option.map(Array.head(pickerResult.assets), (asset) => asset.uri)
    )
  )

export const readBackupFile = (
  uri: string
): Effect.Effect<BackupFile, InvalidBackupFileError | ReadingBackupFileError> =>
  readAndDeletePickedFile(uri).pipe(
    Effect.flatMap(
      Option.match({
        onNone: () => new InvalidBackupFileError({reason: 'notABackup'}),
        onSome: decodeBackupFile,
      })
    )
  )
