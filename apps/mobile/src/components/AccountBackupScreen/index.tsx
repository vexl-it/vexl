import {
  AccountBackupGraphic,
  Button,
  ChevronLeft,
  InfoBox,
  InfoPoint,
  Lock,
  NavigationBar,
  QuestionmarkCircle,
  RefreshArrowsRectangle,
  Screen,
  Stack,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'

type Props = RootStackScreenProps<'AccountBackup'>

export default function AccountBackupScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('accountBackup.title')}
          leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
        />
      }
      footer={
        <Button
          onPress={() => {
            navigation.navigate('AccountBackupPin')
          }}
        >
          {t('accountBackup.createButton')}
        </Button>
      }
    >
      <YStack gap="$7" paddingBottom="$5">
        <Stack alignItems="center">
          <AccountBackupGraphic animate height={171} width={147} />
        </Stack>
        <YStack gap="$3">
          <Typography color="$foregroundPrimary" variant="heading3">
            {t('accountBackup.heading')}
          </Typography>
          <Typography color="$foregroundSecondary" variant="paragraphSmall">
            {t('accountBackup.description')}
          </Typography>
        </YStack>
        <InfoBox variant="pink">{t('accountBackup.warning')}</InfoBox>
        <YStack gap="$4">
          <InfoPoint icon={Lock}>{t('accountBackup.storeSafely')}</InfoPoint>
          <InfoPoint icon={QuestionmarkCircle}>
            {t('accountBackup.forgotPin')}
          </InfoPoint>
          <InfoPoint icon={RefreshArrowsRectangle}>
            {t('accountBackup.onlyOnce')}
          </InfoPoint>
        </YStack>
      </YStack>
    </Screen>
  )
}
