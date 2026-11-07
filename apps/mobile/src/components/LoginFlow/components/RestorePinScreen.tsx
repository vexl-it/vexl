import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {
  backupKeyPairAtom,
  decryptBackupToRestoreActionAtom,
  isBackupForKeyPair,
} from '../../../state/backup/backupToRestore'
import {startRestoreFromBackupActionAtom} from '../../../state/backup/restoreFromBackup'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../utils/dismissKeyboardPromise'
import {
  useTranslation,
  type TFunction,
} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import BackupPinScreen from '../../BackupPinScreen'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import {usePickBackupFile} from '../utils/usePickBackupFile'

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
  const [fileCorrupted, setFileCorrupted] = useState(false)
  const loadingOverlay = useShowLoadingOverlay()
  const keyPair = useAtomValue(backupKeyPairAtom)
  const {pick, errorMessage: pickErrorMessage} = usePickBackupFile((file) => {
    if (Option.exists(keyPair, (one) => isBackupForKeyPair(file, one))) {
      setFileCorrupted(false)
      setErrorMessage(undefined)
    } else navigation.replace('RestoreWrongPhoneNumber')
  })

  return (
    <BackupPinScreen
      title={t('loginFlow.restoreFromBackup.pin.title')}
      text={t('loginFlow.restoreFromBackup.pin.text')}
      pin={pin}
      onPinChange={(newPin) => {
        setPin(newPin)
        setErrorMessage(undefined)
      }}
      errorMessage={pickErrorMessage ?? errorMessage}
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
                setFileCorrupted(e._tag === 'BackupFileCorruptedError')
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
      secondaryAction={
        fileCorrupted
          ? {
              label: t(
                'loginFlow.restoreFromBackup.wrongPhoneNumber.chooseAnotherFile'
              ),
              onPress: pick,
            }
          : undefined
      }
    />
  )
}
