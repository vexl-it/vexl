'use client'

import {
  Disclosure,
  DotSeparatedRow,
  PageSection,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {useLocale} from '../components/LocaleProvider'
import {PageHero} from '../components/PageHero'
import {SiteLink} from '../components/SiteLink'

export interface FaqViewCategory {
  readonly id: string
  readonly title: string
  readonly items: ReadonlyArray<{
    readonly question: string
    readonly answer: React.ReactNode
  }>
}

export function FaqView({
  categories,
}: {
  readonly categories: readonly FaqViewCategory[]
}): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PageSection maxWidth={880}>
      <PageHero title={t.faq.title}>
        <DotSeparatedRow>
          {categories.map((category) => (
            <SiteLink key={category.id} href={`#${category.id}`}>
              <Typography
                variant="paragraphSmallBold"
                color="$foregroundPrimary"
                hoverStyle={{color: '$accentHighlightSecondary'}}
              >
                {category.title}
              </Typography>
            </SiteLink>
          ))}
        </DotSeparatedRow>
      </PageHero>
      {categories.map((category) => (
        <YStack
          key={category.id}
          id={category.id}
          gap="$3"
          style={{scrollMarginTop: 96}}
        >
          <Typography
            tag="h2"
            variant="heading2"
            color="$foregroundPrimary"
            marginBottom="$3"
          >
            {category.title}
          </Typography>
          {category.items.map((item) => (
            <YStack
              key={item.question}
              paddingHorizontal="$5"
              paddingVertical="$2"
              borderRadius="$4"
              backgroundColor="$backgroundSecondary"
            >
              <Disclosure title={item.question}>{item.answer}</Disclosure>
            </YStack>
          ))}
        </YStack>
      ))}
    </PageSection>
  )
}
