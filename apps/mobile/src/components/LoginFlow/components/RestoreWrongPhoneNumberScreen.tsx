import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  ScreenHeading,
  YStack,
} from '@vexl-next/ui'
import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import React, {useState} from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {
  backupKeyPairAtom,
  isBackupForKeyPair,
} from '../../../state/backup/backupToRestore'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import InlineErrorText from '../../InlineErrorText'
import {usePickBackupFile} from '../utils/usePickBackupFile'

type Props = LoginFlowStackScreenProps<'RestoreWrongPhoneNumber'>

export default function RestoreWrongPhoneNumberScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const keyPair = useAtomValue(backupKeyPairAtom)
  const [pickedAnotherWrongFile, setPickedAnotherWrongFile] = useState(false)
  const {pick, errorMessage} = usePickBackupFile((file) => {
    if (Option.exists(keyPair, (one) => isBackupForKeyPair(file, one)))
      navigation.replace('RestorePin')
    else setPickedAnotherWrongFile(true)
  })

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          leftAction={{icon: ChevronLeft, onPress: navigation.goBack}}
        />
      }
      footer={
        <YStack gap="$4">
          <InlineErrorText>
            {errorMessage ??
              (pickedAnotherWrongFile
                ? t(
                    'loginFlow.restoreFromBackup.wrongPhoneNumber.fileAlsoWrong'
                  )
                : undefined)}
          </InlineErrorText>
          <Button
            onPress={() => {
              setPickedAnotherWrongFile(false)
              pick()
            }}
          >
            {t(
              'loginFlow.restoreFromBackup.wrongPhoneNumber.chooseAnotherFile'
            )}
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              navigation.popTo('PhoneNumber', {restore: true})
            }}
          >
            {t('loginFlow.restoreFromBackup.wrongPhoneNumber.useAnotherNumber')}
          </Button>
        </YStack>
      }
    >
      <YStack paddingVertical="$5">
        <ScreenHeading
          title={t('loginFlow.restoreFromBackup.wrongPhoneNumber.title')}
          text={t('loginFlow.restoreFromBackup.wrongPhoneNumber.text')}
        />
      </YStack>
    </Screen>
  )
}
