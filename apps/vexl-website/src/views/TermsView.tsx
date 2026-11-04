'use client'

import {PageSection} from '@vexl-next/ui'
import React from 'react'
import {EnglishOnlyNote} from '../components/EnglishOnlyNote'
import {useLocale} from '../components/LocaleProvider'
import {PageHero} from '../components/PageHero'

export function TermsView({
  body,
}: {
  readonly body: React.ReactNode
}): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PageSection maxWidth={800} gap="$5">
      <PageHero title={t.terms.title} />
      <EnglishOnlyNote text={t.terms.englishOnly} />
      {body}
    </PageSection>
  )
}
