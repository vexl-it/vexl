'use client'

import React from 'react'
import {useLocale} from './LocaleProvider'
import {MarketplaceScreen} from './mock/MarketplaceScreen'
import {PhoneFrame} from './PhoneFrame'

/** The app's marketplace in a phone, as a picture. */
export function AppPreview(): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PhoneFrame label={t.home.mock.label}>
      {/* Nothing inside takes clicks or focus */}
      <div
        inert
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        <MarketplaceScreen />
      </div>
    </PhoneFrame>
  )
}
