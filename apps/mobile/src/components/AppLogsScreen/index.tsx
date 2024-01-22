import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useState} from 'react'
import {Alert} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import showErrorAlert from '../../utils/showErrorAlert'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import IconButton from '../IconButton'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import Switch from '../Switch'
import closeSvg from '../images/closeSvg'
import {appLogsEmptyAtom} from './atoms'
import LogsList from './components/LogsList'
import saveLogsToDirectoryAndShare from './utils/saveLogsToDirectory'
import {setupAppLogs} from './utils/setupAppLogs'
import {
  clearLogs,
  getCustomLoggingEnabled,
  setCustomLoggingEnabled,
} from './utils/storage'

function AppLogsScreen(): JSX.Element {
  const {t} = useTranslation()
  const [enabled, setEnabled] = useState(getCustomLoggingEnabled())
  const setLoading = useSetAtom(loadingOverlayDisplayedAtom)
  const safeGoBack = useSafeGoBack()
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
    <Screen>
      <Stack mx="$2" my="$4" f={1}>
        <ScreenTitle text={t('AppLogs.title')}>
          <>
            <Switch
              value={enabled}
              onValueChange={(enabled) => {
                setEnabled(enabled)
                setCustomLoggingEnabled(enabled)
                setupAppLogs()
              }}
              style={{marginRight: 5}}
            />
            <IconButton icon={closeSvg} onPress={safeGoBack} />
          </>
        </ScreenTitle>
        <Text mb="$3" ff="$body600" color="$white">
          {t('AppLogs.warning')}
        </Text>

        <Stack f={1} my="$1">
          <LogsList />
        </Stack>
        <XStack space="$2">
          <Button
            fullSize
            size="small"
            variant="primary"
            onPress={clearLogs}
            text={t('AppLogs.clear')}
            disabled={isAppLogsEmpty}
          />

          <Button
            fullSize
            size="small"
            variant="secondary"
            onPress={exportLogs}
            text={t('AppLogs.export')}
            disabled={isAppLogsEmpty}
          />
        </XStack>
      </Stack>
    </Screen>
  )
}

export default AppLogsScreen
