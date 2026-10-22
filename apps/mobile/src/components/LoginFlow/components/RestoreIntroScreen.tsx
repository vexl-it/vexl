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
  Stack,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import InlineErrorText from '../../InlineErrorText'
import {usePickBackupFile} from '../utils/usePickBackupFile'

type Props = LoginFlowStackScreenProps<'RestoreIntro'>

export default function RestoreIntroScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
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
      <YStack gap="$7" paddingBottom="$5">
        <Stack alignItems="center">
          <AccountBackupGraphic animate height={171} width={147} />
        </Stack>
        <YStack gap="$3">
          <Typography color="$foregroundPrimary" variant="heading3">
            {t('loginFlow.restoreFromBackup.intro.title')}
          </Typography>
          <Typography color="$foregroundSecondary" variant="paragraphSmall">
            {t('loginFlow.restoreFromBackup.intro.text')}
          </Typography>
        </YStack>
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
