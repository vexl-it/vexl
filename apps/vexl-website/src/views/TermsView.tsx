'use client'

import {PageSection, YStack} from '@vexl-next/ui'
import React from 'react'
import {EnglishOnlyNote} from '../components/EnglishOnlyNote'
import {useLocale} from '../components/LocaleProvider'
import {PageHero} from '../components/PageHero'
import {TableOfContents} from '../components/TableOfContents'
import {type MarkdownHeading} from '../content/headings'

export function TermsView({
  documents,
  body,
}: {
  readonly documents: readonly MarkdownHeading[]
  readonly body: React.ReactNode
}): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PageSection maxWidth={800} gap="$5">
      <PageHero title={t.terms.title} />
      <EnglishOnlyNote text={t.terms.englishOnly} />
      <YStack
        padding="$5"
        borderRadius="$5"
        backgroundColor="$backgroundSecondary"
      >
        <TableOfContents title={t.terms.onThisPage} headings={documents} />
      </YStack>
      {body}
    </PageSection>
  )
}
