'use client'

import React, {createContext, useContext} from 'react'
import {type Messages} from '../i18n/en'
import {localizedPath, messages, type Locale} from '../i18n/locales'

interface LocaleContextValue {
  readonly locale: Locale
  readonly t: Messages
  readonly path: (path: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  locale,
  children,
}: {
  readonly locale: Locale
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <LocaleContext.Provider
      value={{
        locale,
        t: messages[locale],
        path: (path) => localizedPath(locale, path),
      }}
    >
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be used within LocaleProvider')
  return value
}
