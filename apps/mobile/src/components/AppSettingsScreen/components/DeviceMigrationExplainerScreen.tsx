import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {type AppSettingsStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {startSourceMigrationUi} from '../../DeviceMigrationRoot/coordinator'

export default function DeviceMigrationExplainerScreen({
  navigation,
}: AppSettingsStackScreenProps<'DeviceMigrationExplainer'>): React.ReactElement {
  const {t} = useTranslation()
  const points = [
    t('deviceMigration.explainer.sameVersion'),
    t('deviceMigration.explainer.keepOpen'),
    t('deviceMigration.explainer.sourceStops'),
    t('deviceMigration.explainer.erasure'),
    t('deviceMigration.explainer.cancelSafe'),
  ]
  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('deviceMigration.explainer.title')}
          leftAction={{icon: ChevronLeft, onPress: navigation.goBack}}
        />
      }
    >
      <YStack flex={1} gap="$6" py="$4">
        <YStack gap="$4">
          {points.map((point, index) => (
            <YStack key={point} flexDirection="row" gap="$3">
              <Typography variant="heading3" color="$accentYellowPrimary">
                {index + 1}.
              </Typography>
              <Typography
                variant="paragraph"
                color="$foregroundPrimary"
                flex={1}
              >
                {point}
              </Typography>
            </YStack>
          ))}
        </YStack>
        <Button size="large" variant="primary" onPress={startSourceMigrationUi}>
          {t('deviceMigration.explainer.action')}
        </Button>
      </YStack>
    </Screen>
  )
}
