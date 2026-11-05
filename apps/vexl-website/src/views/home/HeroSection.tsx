'use client'

import {
  Button,
  ChevronDown,
  PageSection,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {AppPreview} from '../../components/AppPreview'
import {useLocale} from '../../components/LocaleProvider'
import {SiteLink} from '../../components/SiteLink'

export function HeroSection(): React.JSX.Element {
  const {t, path} = useLocale()

  return (
    <PageSection
      paddingTop="$7"
      $lg={{flexDirection: 'row', alignItems: 'center', paddingTop: '$9'}}
    >
      <YStack flex={1} gap="$7" $lg={{flexBasis: 0, flexGrow: 1.3}}>
        <Image src="/images/glasses-black.webp" alt="" width={56} height={25} />
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
        <XStack alignItems="center" gap="$3" flexWrap="wrap">
          <SiteLink href={path('/download')}>
            <Button role="none">{t.downloadVexl}</Button>
          </SiteLink>
          <SiteLink href={`${path('/')}#how-it-works`}>
            <Button role="none" variant="link" icon={ChevronDown}>
              {t.home.hero.howItWorks}
            </Button>
          </SiteLink>
        </XStack>
      </YStack>
      <XStack
        flex={1}
        justifyContent="center"
        paddingVertical="$9"
        borderRadius="$8"
        backgroundColor="$accentYellowPrimary"
        $lg={{flexBasis: 0}}
      >
        <AppPreview />
      </XStack>
    </PageSection>
  )
}
