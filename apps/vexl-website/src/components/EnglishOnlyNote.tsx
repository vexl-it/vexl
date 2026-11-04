'use client'

import {InfoBox} from '@vexl-next/ui'
import React from 'react'
import {useLocale} from './LocaleProvider'

/** Shown on translated pages whose content exists only in English. */
export function EnglishOnlyNote({
  text,
}: {
  readonly text: string
}): React.JSX.Element | null {
  const {locale} = useLocale()
  if (locale === 'en') return null
  return <InfoBox>{text}</InfoBox>
}
