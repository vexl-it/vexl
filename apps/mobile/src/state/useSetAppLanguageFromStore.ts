import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {getNewI18n} from '../utils/getNewI18n'
import {i18nAtom} from '../utils/localization/I18nProvider'
import {preferencesAtom} from '../utils/preferences'

export function useSetAppLanguageFromStore(): void {
  const preferences = useAtomValue(preferencesAtom)
  const setI18n = useSetAtom(i18nAtom)

  useEffect(() => {
    if (!__DEV__ && preferences?.appLanguage) {
      setI18n(getNewI18n(preferences.appLanguage))
    }
  }, [preferences.appLanguage, setI18n])
}
