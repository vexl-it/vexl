'use client'

import {Button, PageSection, TitleBlock} from '@vexl-next/ui'
import React from 'react'
import {useLocale} from '../components/LocaleProvider'
import {SiteLink} from '../components/SiteLink'

export function NotFoundView(): React.JSX.Element {
  const {t, path} = useLocale()
  return (
    <PageSection alignItems="center" minHeight="60vh" justifyContent="center">
      <TitleBlock
        title={t.notFound.title}
        text={t.notFound.text}
        align="center"
      />
      <SiteLink href={path('/')}>
        <Button role="none">{t.notFound.home}</Button>
      </SiteLink>
    </PageSection>
  )
}
