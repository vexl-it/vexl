import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {Stack, Text, XStack} from 'tamagui'
import Switch from '../Switch'
import {useCallback, useState} from 'react'
import {
  clearLogs,
  getCustomLoggingEnabled,
  setCustomLoggingEnabled,
} from './utils/storage'
import LogsList from './components/LogsList'
import Button from '../Button'
import saveLogsToDirectoryAndShare from './utils/saveLogsToDirectory'
import {useSetAtom} from 'jotai'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'
import {Alert} from 'react-native'
import {setupAppLogs} from './utils/setupAppLogs'

function AppLogsScreen(): JSX.Element {
  const {t} = useTranslation()
  const [enabled, setEnabled] = useState(getCustomLoggingEnabled())
  const setLoading = useSetAtom(loadingOverlayDisplayedAtom)

  const exportLogs = useCallback(() => {
    setLoading(true)
    saveLogsToDirectoryAndShare()()
      .catch(() => {
        Alert.alert(t('AppLogs.errorExporting'))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [setLoading, t])

  return (
    <Screen>
      <Stack mx="$2" f={1}>
        <ScreenTitle text={t('AppLogs.title')}>
          <Switch
            value={enabled}
            onValueChange={(enabled) => {
              setEnabled(enabled)
              setCustomLoggingEnabled(enabled)
              setupAppLogs()
            }}
          />
        </ScreenTitle>
        <Text mb="$3" ff={'$body600'} color="white">
          {t('AppLogs.warning')}
        </Text>

        <Stack f={1} my={2}>
          <LogsList />
        </Stack>
      </Stack>
      <XStack>
        <Button
          fullSize
          size={'small'}
          variant={'primary'}
          onPress={clearLogs}
          text={t('AppLogs.clear')}
        />

        <Button
          fullSize
          size={'small'}
          variant={'secondary'}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onPress={exportLogs}
          text={t('AppLogs.export')}
        />
      </XStack>
    </Screen>
  )
}

export default AppLogsScreen
