'use client'

import {PageSection, Typography, YStack} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {useLocale} from '../../components/LocaleProvider'

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
      <Typography tag="h2" variant="display" color="$foregroundSecondary">
        {t.home.claim.title}
      </Typography>
    </PageSection>
  )
}
