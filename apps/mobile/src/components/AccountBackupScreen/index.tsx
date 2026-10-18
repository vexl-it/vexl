import {
  AccountBackupGraphic,
  Button,
  ChevronLeft,
  InfoBox,
  InfoPoint,
  Lock,
  NavigationBar,
  RefreshArrowsRectangle,
  Screen,
  Stack,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {exportAccountBackupActionAtom} from '../../state/backup/exportAccountBackupActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'

export default function AccountBackupScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const exportAccountBackup = useSetAtom(exportAccountBackupActionAtom)
  const [exporting, setExporting] = useState(false)

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
          variant={exporting ? 'disabled' : 'primary'}
          onPress={() => {
            setExporting(true)
            void Effect.runPromise(exportAccountBackup()).finally(() => {
              setExporting(false)
            })
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
          <InfoPoint icon={RefreshArrowsRectangle}>
            {t('accountBackup.onlyOnce')}
          </InfoPoint>
        </YStack>
      </YStack>
    </Screen>
  )
}
