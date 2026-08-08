import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {createI18nInstance, i18nAtom} from '../utils/localization/I18nProvider'
import {preferencesAtom} from '../utils/preferences'

export function useSetAppLanguageFromStore(): void {
  const preferences = useAtomValue(preferencesAtom)
  const setI18n = useSetAtom(i18nAtom)

  useEffect(() => {
    if (preferences?.appLanguage) {
      setI18n(createI18nInstance(preferences.appLanguage))
    }
  }, [preferences.appLanguage, setI18n])
}
