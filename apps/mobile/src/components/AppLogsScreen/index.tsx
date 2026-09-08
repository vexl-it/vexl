import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  Stack,
  Switch,
  Typography,
  XStack,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Alert} from 'react-native'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {showErrorAlert} from '../ErrorAlert'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'
import {appLogsEmptyAtom, appLogsEnabledAtom} from './atoms'
import LogsList from './components/LogsList'
import saveLogsToDirectoryAndShare from './utils/saveLogsToDirectory'
import {clearLogs} from './utils/storage'

function AppLogsScreen(): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const setLoading = useSetAtom(loadingOverlayDisplayedAtom)
  const isAppLogsEmpty = useAtomValue(appLogsEmptyAtom)

  const exportLogs = useCallback(() => {
    Alert.alert(
      t('AppLogs.anonymizeAlert.title'),
      t('AppLogs.anonymizeAlert.text'),
      [
        {
          text: t('common.no'),
          onPress: () => {
            setLoading(true)
            saveLogsToDirectoryAndShare(false)()
              .catch((e) => {
                showErrorAlert({
                  title: t('AppLogs.errorExporting'),
                  description: t('common.somethingWentWrongDescription'),
                  error: e,
                })
              })
              .finally(() => {
                setLoading(false)
              })
          },
        },
        {
          text: t('common.yes'),
          onPress: () => {
            setLoading(true)
            saveLogsToDirectoryAndShare(true)()
              .catch((e) => {
                showErrorAlert({
                  title: t('AppLogs.errorExporting'),
                  description: t('common.somethingWentWrongDescription'),
                  error: e,
                })
              })
              .finally(() => {
                setLoading(false)
              })
          },
        },
      ]
    )
  }, [setLoading, t])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('AppLogs.title')}
          leftAction={{
            icon: ChevronLeft,
            onPress: goBack,
          }}
        />
      }
      footer={
        isAppLogsEmpty ? undefined : (
          <XStack gap="$3">
            <Button flex={1} variant="destructive" onPress={clearLogs}>
              {t('AppLogs.clear')}
            </Button>
            <Button flex={1} variant="primary" onPress={exportLogs}>
              {t('AppLogs.export')}
            </Button>
          </XStack>
        )
      }
    >
      <Stack flex={1} gap="$5">
        <XStack
          alignItems="center"
          backgroundColor="$backgroundTertiary"
          borderRadius="$5"
          gap="$4"
          justifyContent="space-between"
          padding="$5"
        >
          <Stack flex={1} gap="$2">
            <Typography
              color="$foregroundPrimary"
              letterSpacing={0}
              variant="paragraph"
            >
              {t('AppLogs.enable')}
            </Typography>
            <Typography
              color="$foregroundSecondary"
              letterSpacing={0}
              variant="micro"
            >
              {t('AppLogs.warningShort')}
            </Typography>
          </Stack>
          <Stack alignItems="center">
            <Switch valueAtom={appLogsEnabledAtom} />
          </Stack>
        </XStack>

        {isAppLogsEmpty ? null : (
          <Typography
            color="$foregroundPrimary"
            letterSpacing={0}
            variant="paragraphDemibold"
          >
            {t('AppLogs.logs')}
          </Typography>
        )}

        <Stack flex={1}>
          <LogsList />
        </Stack>
      </Stack>
    </Screen>
  )
}

export default AppLogsScreen
