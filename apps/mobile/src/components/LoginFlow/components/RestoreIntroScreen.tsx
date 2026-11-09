import {
  AccountBackupGraphic,
  Button,
  CellPhoneMobileDevice,
  ChevronLeft,
  DocumentsFiles,
  InfoPoint,
  Lock,
  NavigationBar,
  Screen,
  ScreenHeading,
  Stack,
  YStack,
} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {clearBackupToRestoreActionAtom} from '../../../state/backup/backupToRestore'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import InlineErrorText from '../../InlineErrorText'
import {usePickBackupFile} from '../utils/usePickBackupFile'

type Props = LoginFlowStackScreenProps<'RestoreIntro'>

export default function RestoreIntroScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const clearBackupToRestore = useSetAtom(clearBackupToRestoreActionAtom)
  // Leaving the restore flow must not keep the backup's private key in memory.
  useEffect(() => clearBackupToRestore, [clearBackupToRestore])
  const {pick, errorMessage} = usePickBackupFile(() => {
    navigation.navigate('PhoneNumber', {restore: true})
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
          <InlineErrorText>{errorMessage}</InlineErrorText>
          <Button onPress={pick}>
            {t('loginFlow.restoreFromBackup.intro.chooseFile')}
          </Button>
        </YStack>
      }
    >
      <YStack flex={1} justifyContent="center" gap="$7" paddingVertical="$5">
        <Stack alignItems="center">
          <AccountBackupGraphic animate height={171} width={147} />
        </Stack>
        <ScreenHeading
          title={t('loginFlow.restoreFromBackup.intro.title')}
          text={t('loginFlow.restoreFromBackup.intro.text')}
        />
        <YStack gap="$4">
          <InfoPoint icon={CellPhoneMobileDevice}>
            {t('loginFlow.restoreFromBackup.intro.phoneNumber')}
          </InfoPoint>
          <InfoPoint icon={DocumentsFiles}>
            {t('loginFlow.restoreFromBackup.intro.file')}
          </InfoPoint>
          <InfoPoint icon={Lock}>
            {t('loginFlow.restoreFromBackup.intro.pin')}
          </InfoPoint>
        </YStack>
      </YStack>
    </Screen>
  )
}
