import {
  Button,
  ChevronLeft,
  InfoBox,
  NavigationBar,
  Screen,
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
      <YStack gap="$5">
        <Typography variant="paragraph" color="$foregroundPrimary">
          {t('accountBackup.description')}
        </Typography>
        <YStack gap="$2">
          <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
            {t('accountBackup.warningTitle')}
          </Typography>
          <InfoBox variant="pink">{t('accountBackup.warning')}</InfoBox>
        </YStack>
        <Typography variant="paragraphSmall" color="$foregroundSecondary">
          {t('accountBackup.storeSafely')}
        </Typography>
        <Typography variant="paragraphSmall" color="$foregroundSecondary">
          {t('accountBackup.onlyOnce')}
        </Typography>
      </YStack>
    </Screen>
  )
}
