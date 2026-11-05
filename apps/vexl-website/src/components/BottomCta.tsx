'use client'

import {PageSection, Typography, YStack} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {AppPreview} from './AppPreview'
import {DownloadCta} from './DownloadCta'
import {useLocale} from './LocaleProvider'

// How much of the phone shows above the card's bottom edge
const PHONE_PEEK = {phone: 360, desktop: 500}

export function BottomCta(): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PageSection>
      <YStack
        borderRadius="$8"
        overflow="hidden"
        backgroundColor="$accentYellowPrimary"
        flexDirection="column-reverse"
        $lg={{flexDirection: 'row', alignItems: 'center'}}
      >
        <YStack
          aria-hidden
          // The card's rounded edge crops the rest of the phone
          height={PHONE_PEEK.phone}
          alignItems="center"
          $lg={{
            height: PHONE_PEEK.desktop,
            paddingLeft: '$12',
            paddingTop: '$11',
            alignSelf: 'flex-end',
          }}
        >
          <AppPreview />
        </YStack>
        <YStack
          flex={1}
          gap="$7"
          padding="$7"
          $md={{padding: '$12'}}
          $lg={{flexBasis: 0}}
        >
          <Image
            src="/images/glasses-black.webp"
            alt=""
            width={56}
            height={25}
          />
          <YStack gap="$5">
            <Typography tag="h2" variant="display" color="$black100">
              {t.home.cta.title}
            </Typography>
            <Typography variant="paragraph" color="$black100">
              {t.home.cta.text}
            </Typography>
          </YStack>
          <DownloadCta onYellow />
        </YStack>
      </YStack>
    </PageSection>
  )
}
