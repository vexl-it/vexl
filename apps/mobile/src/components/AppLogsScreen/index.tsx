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
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import useSafeGoBack from '../../utils/useSafeGoBack'

function AppLogsScreen(): JSX.Element {
  const {t} = useTranslation()
  const [enabled, setEnabled] = useState(getCustomLoggingEnabled())
  const setLoading = useSetAtom(loadingOverlayDisplayedAtom)
  const safeGoBack = useSafeGoBack()

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
              .catch(() => {
                Alert.alert(t('AppLogs.errorExporting'))
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
              .catch(() => {
                Alert.alert(t('AppLogs.errorExporting'))
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
            />
            <IconButton icon={closeSvg} onPress={safeGoBack} />
          </>
        </ScreenTitle>
        <Text mb="$3" ff={'$body600'} color="$white">
          {t('AppLogs.warning')}
        </Text>

        <Stack f={1} my="$1">
          <LogsList />
        </Stack>
        <XStack space="$2">
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
            onPress={exportLogs}
            text={t('AppLogs.export')}
          />
        </XStack>
      </Stack>
    </Screen>
  )
}

export default AppLogsScreen
