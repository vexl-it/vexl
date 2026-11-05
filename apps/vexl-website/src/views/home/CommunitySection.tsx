'use client'

import {Button, PageSection, Typography, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {useLocale} from '../../components/LocaleProvider'
import {Photo} from '../../components/Photo'
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
        $lg={{flexBasis: 0, maxWidth: 400}}
      >
        <Typography tag="h2" variant="heading1" color="$foregroundPrimary">
          {copy.title}
        </Typography>
        <Typography variant="paragraph" color="$foregroundSecondary">
          {copy.text}
        </Typography>
        <SiteLink href={path('/community')}>
          <Button role="none" size="medium" variant="tertiary">
            {copy.action}
          </Button>
        </SiteLink>
      </YStack>
      <XStack
        flex={1}
        gap="$4"
        height={320}
        $md={{height: 440}}
        $lg={{flexBasis: 0, flexGrow: 1.6}}
      >
        <Photo
          photo="talk"
          alt={copy.photos.talk}
          focus="30% center"
          sizes="(min-width: 1024px) 420px, 60vw"
          flex={1.4}
        />
        <YStack flex={1} gap="$4">
          <Photo
            photo="signLaughing"
            alt={copy.photos.sign}
            sizes="(min-width: 1024px) 300px, 40vw"
            flex={1}
          />
          <Photo
            photo="mask"
            alt={copy.photos.mask}
            sizes="(min-width: 1024px) 300px, 40vw"
            flex={1}
          />
        </YStack>
      </XStack>
    </PageSection>
  )
}
