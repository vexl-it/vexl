'use client'

import {Button, PageSection, TitleBlock, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {useLocale} from '../components/LocaleProvider'
import {Photo} from '../components/Photo'
import {SiteLink} from '../components/SiteLink'

export function NotFoundView(): React.JSX.Element {
  const {t, path} = useLocale()
  return (
    <PageSection alignItems="center" minHeight="60vh" justifyContent="center">
      <YStack width="100%" maxWidth={360}>
        <Photo photo="blownKiss" alt={t.notFound.photo} sizes="360px" />
      </YStack>
      <TitleBlock
        title={t.notFound.title}
        text={t.notFound.text}
        align="center"
      />
      <XStack gap="$3" flexWrap="wrap" justifyContent="center">
        <SiteLink href={path('/')}>
          <Button role="none" size="medium">
            {t.notFound.home}
          </Button>
        </SiteLink>
        <SiteLink href={path('/download')}>
          <Button role="none" size="medium" variant="tertiary">
            {t.downloadVexl}
          </Button>
        </SiteLink>
      </XStack>
    </PageSection>
  )
}
