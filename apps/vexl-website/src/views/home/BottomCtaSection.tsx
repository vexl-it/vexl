'use client'

import {PageSection, Typography, XStack, YStack} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {DownloadCta} from '../../components/DownloadCta'
import {useLocale} from '../../components/LocaleProvider'

export function BottomCtaSection(): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PageSection>
      <YStack
        borderRadius="$8"
        backgroundColor="$accentYellowPrimary"
        overflow="hidden"
        $md={{flexDirection: 'row', alignItems: 'center'}}
      >
        <XStack
          flex={1}
          justifyContent="center"
          paddingTop="$9"
          paddingHorizontal="$7"
          height={360}
          $md={{height: 520}}
        >
          <Image
            src="/images/cta-phone.webp"
            alt=""
            width={1080}
            height={1878}
            sizes="(min-width: 768px) 320px, 60vw"
            style={{width: 'auto', height: '120%', objectFit: 'contain'}}
          />
        </XStack>
        <YStack flex={1} gap="$7" padding="$7">
          <Typography tag="h2" variant="heading2" color="$black100">
            {t.home.cta.title}
          </Typography>
          <DownloadCta tone="light" />
        </YStack>
      </YStack>
    </PageSection>
  )
}
