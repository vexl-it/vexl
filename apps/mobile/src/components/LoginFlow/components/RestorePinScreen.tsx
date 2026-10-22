import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {decryptBackupToRestoreActionAtom} from '../../../state/backup/backupToRestore'
import {startRestoreFromBackupActionAtom} from '../../../state/backup/restoreFromBackup'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../utils/dismissKeyboardPromise'
import {
  useTranslation,
  type TFunction,
} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import BackupPinScreen from '../../BackupPinScreen'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'

type Props = LoginFlowStackScreenProps<'RestorePin'>

const decryptErrorMessage = (
  e: {readonly _tag: string},
  t: TFunction
): string => {
  if (e._tag === 'BackupFileWrongPinError')
    return t('loginFlow.restoreFromBackup.pin.wrongPin')
  if (e._tag === 'BackupFileCorruptedError')
    return t('loginFlow.restoreFromBackup.errors.corrupted')

  reportError('error', new Error('Error decrypting backup'), {
    errorTag: e._tag,
  })
  return t('common.somethingWentWrong')
}

export default function RestorePinScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const decryptBackupToRestore = useSetAtom(decryptBackupToRestoreActionAtom)
  const startRestoreFromBackup = useSetAtom(startRestoreFromBackupActionAtom)
  const [pin, setPin] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()
  const [decrypting, setDecrypting] = useState(false)
  const loadingOverlay = useShowLoadingOverlay()

  return (
    <BackupPinScreen
      title={t('loginFlow.restoreFromBackup.pin.title')}
      text={t('loginFlow.restoreFromBackup.pin.text')}
      pin={pin}
      onPinChange={(newPin) => {
        setPin(newPin)
        setErrorMessage(undefined)
      }}
      errorMessage={errorMessage}
      buttonLabel={t('loginFlow.restoreFromBackup.pin.restore')}
      busy={decrypting}
      onSubmit={(validPin) => {
        setDecrypting(true)
        loadingOverlay.show()
        void Effect.runPromise(
          decryptBackupToRestore(validPin).pipe(
            Effect.tap(() =>
              Effect.promise(dismissKeyboardAndResolveOnLayoutUpdate)
            ),
            Effect.match({
              onSuccess: (backup) => {
                navigation.navigate('RestoreFromBackup')
                void Effect.runPromise(startRestoreFromBackup(backup))
              },
              onFailure: (e) => {
                setPin('')
                setErrorMessage(decryptErrorMessage(e, t))
              },
            })
          )
        ).finally(() => {
          setDecrypting(false)
          loadingOverlay.hide()
        })
      }}
      onBack={navigation.goBack}
    />
  )
}
