'use client'

import {PageSection, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {DownloadCta} from './DownloadCta'
import {useLocale} from './LocaleProvider'

export function BottomCta(): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PageSection>
      <YStack
        gap="$9"
        padding="$7"
        borderRadius="$8"
        backgroundColor="$accentYellowPrimary"
        $md={{padding: '$12'}}
        $xl={{flexDirection: 'row', alignItems: 'center'}}
      >
        <YStack flex={1} gap="$5" $xl={{flexBasis: 0}}>
          <Typography tag="h2" variant="display" color="$black100">
            {t.home.cta.title}
          </Typography>
          <Typography variant="paragraph" color="$black100">
            {t.home.cta.text}
          </Typography>
        </YStack>
        <DownloadCta tone="light" />
      </YStack>
    </PageSection>
  )
}
