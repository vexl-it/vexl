import {
  BACKUP_FILE_EXTENSION,
  BackupFileFromJson,
} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Array, Effect, Schema} from 'effect'
import {File} from 'expo-file-system'
import {shareAsync} from 'expo-sharing'
import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {Platform} from 'react-native'
import {showErrorAlert} from '../../components/ErrorAlert'
import {
  deleteIfExists,
  getAccountBackupDirectory,
} from '../../utils/fsDirectories'
import {translationAtom} from '../../utils/localization/I18nProvider'
import reportError from '../../utils/reportError'
import messagingStateAtom from '../chat/atoms/messagingStateAtom'
import {clubsKeyHolderStorageAtom} from '../clubs/atom/clubsToKeyHolderV2Atom'
import {keyDerivationCountersAtom} from '../keyDerivation'
import {sessionAtom} from '../session'
import {createBackupFile} from './createBackupFile'

class AccountBackupExportError extends Schema.TaggedError<AccountBackupExportError>(
  'AccountBackupExportError'
)('AccountBackupExportError', {
  cause: Schema.Unknown,
}) {}

export const backupFileName = (date: DateTime): string =>
  `${date.toFormat('yyyy-MM-dd')}.${BACKUP_FILE_EXTENSION}`

const writeAndShareBackupFile = (
  fileName: string,
  content: string,
  dialogTitle: string
): Effect.Effect<void, AccountBackupExportError> =>
  Effect.tryPromise({
    try: async () => {
      const directory = getAccountBackupDirectory()
      deleteIfExists(directory)
      directory.create({intermediates: true})

      const file = new File(directory, fileName)
      file.write(content, {encoding: 'utf8'})
      await shareAsync(file.uri, {
        mimeType: 'application/json',
        UTI: 'public.json',
        dialogTitle,
      })

      // Android share targets (Gmail, Drive) may read the content:// URI in
      // the background after the share sheet closes. There the file stays
      // until the next export or logout (deleteAllFiles).
      if (Platform.OS === 'ios') deleteIfExists(directory)
    },
    catch: (cause) => new AccountBackupExportError({cause}),
  })

export const exportAccountBackupActionAtom = atom(
  null,
  (get): Effect.Effect<boolean> => {
    const {t} = get(translationAtom)
    const session = get(sessionAtom)
    if (session.state !== 'loggedIn') return Effect.succeed(false)

    const {data: clubs, waitingForAdmission} = get(clubsKeyHolderStorageAtom)

    return createBackupFile({
      session: session.session,
      counters: get(keyDerivationCountersAtom),
      inboxKeys: Array.map(
        get(messagingStateAtom),
        (one) => one.inbox.privateKey
      ),
      clubs,
      clubKeysWaitingForAdmission: waitingForAdmission,
    }).pipe(
      Effect.flatMap(Schema.encode(BackupFileFromJson)),
      Effect.flatMap((content) =>
        writeAndShareBackupFile(
          backupFileName(DateTime.now()),
          content,
          t('accountBackup.shareSheetTitle')
        )
      ),
      Effect.as(true),
      Effect.catchAll((e) =>
        Effect.sync(() => {
          // Only the tag - the error could carry key material.
          reportError('error', new Error('Error exporting account backup'), {
            errorTag: e._tag,
          })
          showErrorAlert({title: t('common.somethingWentWrong')})
          return false
        })
      )
    )
  }
)
