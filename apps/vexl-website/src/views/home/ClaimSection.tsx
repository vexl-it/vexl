'use client'

import {PageSection, Typography, YStack} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {useLocale} from '../../components/LocaleProvider'
import {ScrollRevealText} from '../../components/ScrollRevealText'

export function ClaimSection(): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PageSection>
      <YStack gap="$4">
        <Image
          src="/images/glasses-yellow.webp"
          alt=""
          width={46}
          height={22}
        />
        <Typography
          variant="paragraphSmallBold"
          color="$accentYellowPrimary"
          maxWidth={320}
        >
          {t.home.claim.eyebrow}
        </Typography>
      </YStack>
      <ScrollRevealText>{t.home.claim.title}</ScrollRevealText>
    </PageSection>
  )
}
