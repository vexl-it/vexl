import {type EncryptedBackupFile} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Effect, Option} from 'effect'
import {useSetAtom} from 'jotai'
import {useRef, useState} from 'react'
import {backupFileToRestoreAtom} from '../../../state/backup/backupToRestore'
import {
  pickBackupFileUri,
  readBackupFile,
} from '../../../state/backup/readBackupFile'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import {withLoadingOverlayAtom} from '../../LoadingOverlayProvider'

export function usePickBackupFile(
  onPicked: (file: EncryptedBackupFile) => void
): {
  readonly pick: () => void
  readonly errorMessage: string | undefined
} {
  const {t} = useTranslation()
  const withLoadingOverlay = useSetAtom(withLoadingOverlayAtom)
  const setBackupFileToRestore = useSetAtom(backupFileToRestoreAtom)
  const [errorMessage, setErrorMessage] = useState<string>()
  const pickingRef = useRef(false)

  const pick = (): void => {
    if (pickingRef.current) return
    pickingRef.current = true
    setErrorMessage(undefined)

    void Effect.runPromise(
      pickBackupFileUri().pipe(
        Effect.flatMap(
          Option.match({
            onNone: () => Effect.succeedNone,
            // Reading a large file takes a moment.
            onSome: (uri) =>
              withLoadingOverlay()(readBackupFile(uri)).pipe(Effect.asSome),
          })
        ),
        Effect.match({
          onSuccess: (picked) => {
            if (Option.isNone(picked)) return
            setBackupFileToRestore(picked)
            onPicked(picked.value)
          },
          onFailure: (e) => {
            if (e._tag === 'InvalidBackupFileError') {
              setErrorMessage(
                t(`loginFlow.restoreFromBackup.errors.${e.reason}`)
              )
              return
            }
            reportError('warn', new Error('Error reading backup file'), {
              errorTag: e._tag,
            })
            setErrorMessage(t('common.somethingWentWrong'))
          },
        })
      )
    ).finally(() => {
      pickingRef.current = false
    })
  }

  return {pick, errorMessage}
}
