'use client'

import {Button, PageSection, Typography, YStack} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {useLocale} from '../../components/LocaleProvider'
import {SiteLink} from '../../components/SiteLink'

export function CommunitySection(): React.JSX.Element {
  const {t, path} = useLocale()
  const copy = t.home.community

  return (
    <PageSection $lg={{flexDirection: 'row', alignItems: 'center'}}>
      <YStack
        flex={1}
        gap="$5"
        alignItems="flex-start"
        $lg={{flexBasis: 0, maxWidth: 440}}
      >
        <Typography tag="h2" variant="heading1" color="$foregroundPrimary">
          {copy.title}
        </Typography>
        <Typography variant="paragraph" color="$foregroundSecondary">
          {copy.text}
        </Typography>
        <SiteLink href={path('/community')}>
          <Button role="none" size="medium" variant="secondary">
            {copy.action}
          </Button>
        </SiteLink>
      </YStack>
      <YStack flex={1} borderRadius="$8" overflow="hidden" $lg={{flexBasis: 0}}>
        <Image
          src="/images/community-gallery.webp"
          alt={copy.imageAlt}
          width={2000}
          height={1050}
          sizes="(min-width: 1024px) 680px, 100vw"
          style={{width: '100%', height: 'auto'}}
        />
      </YStack>
    </PageSection>
  )
}
