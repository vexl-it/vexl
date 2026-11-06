import {
  BACKUP_FILE_EXTENSION,
  encryptBackupFile,
  EncryptedBackupFileFromJson,
  type BackupPin,
} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Array, Effect, Option, Schema} from 'effect'
import {Directory, File} from 'expo-file-system'
import {shareAsync} from 'expo-sharing'
import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {Platform} from 'react-native'
import {apiAtom} from '../../api'
import {showErrorAlert} from '../../components/ErrorAlert'
import {withLoadingOverlayAtom} from '../../components/LoadingOverlayProvider'
import {toastNotificationAtom} from '../../components/ToastNotification/atom'
import {
  deleteIfExists,
  getAccountBackupDirectory,
} from '../../utils/fsDirectories'
import {translationAtom} from '../../utils/localization/I18nProvider'
import reportError from '../../utils/reportError'
import {
  isTransportRequestError,
  toCommonErrorMessage,
} from '../../utils/useCommonErrorMessages'
import messagingStateAtom from '../chat/atoms/messagingStateAtom'
import {clubsKeyHolderStorageAtom} from '../clubs/atom/clubsToKeyHolderV2Atom'
import {keyDerivationCountersAtom} from '../keyDerivation'
import {vexlNotificationTokenAtom} from '../notifications/vexlNotificationTokenAtom'
import {sessionAtom} from '../session'
import {notificationSecretForBackup} from './backupNotificationSecret'
import {userDataForBackup} from './backupUserData'
import {createBackupFile} from './createBackupFile'

class AccountBackupExportError extends Schema.TaggedError<AccountBackupExportError>(
  'AccountBackupExportError'
)('AccountBackupExportError', {
  cause: Schema.Unknown,
}) {}

export const backupFileName = (date: DateTime): string =>
  `${date.toFormat('yyyy-MM-dd')}.${BACKUP_FILE_EXTENSION}`

const shareBackupFile = (
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

const PickerCancelledError = Schema.Struct({
  code: Schema.Literal('ERR_PICKER_CANCELLED'),
})

// None when the user closes the folder picker.
const pickDirectory = (): Effect.Effect<
  Option.Option<Directory>,
  AccountBackupExportError
> =>
  Effect.tryPromise(async () => await Directory.pickDirectoryAsync()).pipe(
    Effect.map(Option.some),
    Effect.catchAll(({error}) =>
      Schema.is(PickerCancelledError)(error)
        ? Effect.succeedNone
        : new AccountBackupExportError({cause: error})
    )
  )

// False when the user closes the folder picker.
const saveBackupFileToPickedDirectory = (
  fileName: string,
  content: string
): Effect.Effect<boolean, AccountBackupExportError> =>
  pickDirectory().pipe(
    Effect.flatMap(
      Option.match({
        onNone: () => Effect.succeed(false),
        onSome: (directory) =>
          Effect.try({
            try: () => {
              // With a typed MIME the storage provider appends its own
              // extension (.json), the generic one keeps the file name as is.
              directory
                .createFile(fileName, 'application/octet-stream')
                .write(content, {encoding: 'utf8'})
              return true
            },
            catch: (cause) => new AccountBackupExportError({cause}),
          }),
      })
    )
  )

export type AccountBackupDestination = 'device' | 'share'

export const exportAccountBackupActionAtom = atom(
  null,
  (
    get,
    set,
    {pin, destination}: {pin: BackupPin; destination: AccountBackupDestination}
  ): Effect.Effect<boolean> => {
    const {t} = get(translationAtom)
    const session = get(sessionAtom)
    if (session.state !== 'loggedIn') return Effect.succeed(false)

    const {data: clubs, waitingForAdmission} = get(clubsKeyHolderStorageAtom)

    return Effect.all({
      publicKey: get(apiAtom).user.getBackupPublicKey(),
      backup: createBackupFile({
        session: session.session,
        counters: get(keyDerivationCountersAtom),
        inboxKeys: Array.map(
          get(messagingStateAtom),
          (one) => one.inbox.privateKey
        ),
        clubs,
        clubKeysWaitingForAdmission: waitingForAdmission,
        realUserData: userDataForBackup(session.session.realUserData),
        notificationSecret: notificationSecretForBackup(
          get(vexlNotificationTokenAtom)
        ),
      }),
    }).pipe(
      Effect.flatMap(({publicKey: {publicKey}, backup}) =>
        encryptBackupFile({backup, pin, publicKey})
      ),
      Effect.flatMap(Schema.encode(EncryptedBackupFileFromJson)),
      set(withLoadingOverlayAtom),
      Effect.flatMap((content) => {
        const fileName = backupFileName(DateTime.now())
        if (destination === 'share')
          return shareBackupFile(
            fileName,
            content,
            t('accountBackup.shareSheetTitle')
          ).pipe(Effect.as(true))

        return saveBackupFileToPickedDirectory(fileName, content).pipe(
          Effect.tap((saved) =>
            Effect.when(
              Effect.sync(() => {
                set(toastNotificationAtom, t('accountBackup.savedToDevice'))
              }),
              () => saved
            )
          )
        )
      }),
      Effect.catchAll((e) =>
        Effect.sync(() => {
          // Only the tag - the error could carry key material.
          if (!isTransportRequestError(e))
            reportError('error', new Error('Error exporting account backup'), {
              errorTag: e._tag,
            })
          showErrorAlert({
            title:
              toCommonErrorMessage(e, t, true) ??
              t('common.somethingWentWrong'),
          })
          return false
        })
      )
    )
  }
)
