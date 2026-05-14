import {
  Button,
  NavigationBar,
  Screen,
  SelectableItem,
  useVexlTheme,
  XmarkCancelClose,
  YStack,
  type ThemeMode,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useState} from 'react'
import {type AppSettingsStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {appThemeModeAtom} from '../../../utils/preferences'

const appearanceModes: readonly ThemeMode[] = ['light', 'dark', 'system']

function AppSettingsAppearanceScreen({
  navigation,
}: AppSettingsStackScreenProps<'AppSettingsAppearance'>): React.ReactElement {
  const {t} = useTranslation()
  const savedThemeMode = useAtomValue(appThemeModeAtom)
  const setSavedThemeMode = useSetAtom(appThemeModeAtom)
  const {setMode} = useVexlTheme()
  const [tempSelection, setTempSelection] = useState<ThemeMode>(savedThemeMode)

  const close = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const save = useCallback(() => {
    setSavedThemeMode(tempSelection)
    setMode(tempSelection)
    close()
  }, [close, setMode, setSavedThemeMode, tempSelection])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('appSettings.appearanceTitle')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: close,
            },
          ]}
        />
      }
      footer={<Button onPress={save}>{t('common.save')}</Button>}
    >
      <YStack>
        {pipe(
          appearanceModes,
          Array.map((mode) => (
            <SelectableItem
              key={mode}
              label={t(`appSettings.appearance.${mode}`)}
              selected={mode === tempSelection}
              onPress={() => {
                setTempSelection(mode)
              }}
            />
          ))
        )}
      </YStack>
    </Screen>
  )
}

export default AppSettingsAppearanceScreen
