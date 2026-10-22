import {type BackupPin} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Effect, Option} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {exportAccountBackupActionAtom} from '../../state/backup/exportAccountBackupActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import BackupPinScreen from '../BackupPinScreen'

type Props = RootStackScreenProps<'AccountBackupPin'>

export default function AccountBackupPinScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const exportAccountBackup = useSetAtom(exportAccountBackupActionAtom)
  const [pin, setPin] = useState('')
  const [chosenPin, setChosenPin] = useState<Option.Option<BackupPin>>(
    Option.none()
  )
  const [errorMessage, setErrorMessage] = useState<string>()
  const [exporting, setExporting] = useState(false)

  if (Option.isNone(chosenPin))
    return (
      <BackupPinScreen
        key="choose"
        title={t('accountBackup.pin.title')}
        text={t('accountBackup.pin.text')}
        pin={pin}
        onPinChange={setPin}
        buttonLabel={t('common.continue')}
        onSubmit={(newPin) => {
          setChosenPin(Option.some(newPin))
          setPin('')
        }}
        onBack={navigation.goBack}
      />
    )

  return (
    <BackupPinScreen
      key="confirm"
      title={t('accountBackup.pin.confirmTitle')}
      text={t('accountBackup.pin.confirmText')}
      pin={pin}
      onPinChange={(newPin) => {
        setPin(newPin)
        setErrorMessage(undefined)
      }}
      errorMessage={errorMessage}
      buttonLabel={t('accountBackup.createButton')}
      busy={exporting}
      onSubmit={(confirmedPin) => {
        if (confirmedPin !== chosenPin.value) {
          setErrorMessage(t('accountBackup.pin.mismatch'))
          setPin('')
          return
        }

        setExporting(true)
        void Effect.runPromise(exportAccountBackup(confirmedPin)).then(
          (exported) => {
            setExporting(false)
            if (exported) navigation.goBack()
          }
        )
      }}
      onBack={() => {
        setChosenPin(Option.none())
        setPin('')
        setErrorMessage(undefined)
      }}
    />
  )
}
