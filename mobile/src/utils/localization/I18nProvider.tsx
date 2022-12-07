import React, {useMemo} from 'react'
import {I18n} from 'i18n-js'
import i18n from './i18n'

interface TranslationContext {
  t: I18n['t']
}

const translationContext = React.createContext<TranslationContext>({
  t: () => '',
})

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const contextValue = useMemo(() => ({t: i18n.t.bind(i18n)}), [])

  return (
    <translationContext.Provider value={contextValue}>
      {children}
    </translationContext.Provider>
  )
}

export function useTranslation(): TranslationContext {
  return React.useContext(translationContext)
}
