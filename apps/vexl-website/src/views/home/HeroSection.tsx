'use client'

import {PageSection, Typography, XStack, YStack} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {DownloadCta} from '../../components/DownloadCta'
import {useLocale} from '../../components/LocaleProvider'

export function HeroSection(): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PageSection
      paddingTop="$7"
      $lg={{flexDirection: 'row', alignItems: 'center', paddingTop: '$9'}}
    >
      <YStack flex={1} gap="$7" $lg={{flexBasis: 0}}>
        <Image src="/images/glasses-white.webp" alt="" width={56} height={25} />
        <Typography tag="h1" variant="display" color="$foregroundPrimary">
          {t.home.hero.title}
        </Typography>
        <Typography
          variant="paragraph"
          color="$foregroundSecondary"
          maxWidth={480}
        >
          {t.home.hero.text}
        </Typography>
        <DownloadCta />
      </YStack>
      <XStack
        flex={1}
        backgroundColor="$accentYellowPrimary"
        borderRadius="$8"
        justifyContent="center"
        paddingTop="$9"
        overflow="hidden"
        height={420}
        $lg={{height: 600, flexBasis: 0}}
      >
        <Image
          src="/images/hero-phone.webp"
          alt=""
          width={1080}
          height={1699}
          priority
          sizes="(min-width: 1024px) 400px, 70vw"
          style={{width: 'auto', height: '115%', objectFit: 'contain'}}
        />
      </XStack>
    </PageSection>
  )
}
