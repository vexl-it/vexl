'use client'

import {PageSection, Typography, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {DownloadCta} from '../../components/DownloadCta'
import {useLocale} from '../../components/LocaleProvider'
import {DemoAvatar, type DemoAvatarIndex} from './mock/DemoAvatar'

const crowd: readonly DemoAvatarIndex[] = [0, 1, 2, 3, 4]

export function BottomCtaSection(): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PageSection>
      <YStack
        gap="$9"
        padding="$7"
        borderRadius="$8"
        backgroundColor="$accentYellowPrimary"
        $md={{padding: '$12'}}
        $lg={{flexDirection: 'row', alignItems: 'center'}}
      >
        <YStack flex={1} gap="$5" $lg={{flexBasis: 0}}>
          <Typography tag="h2" variant="display" color="$black100">
            {t.home.cta.title}
          </Typography>
          <Typography variant="paragraph" color="$black100">
            {t.home.cta.text}
          </Typography>
        </YStack>
        <YStack gap="$7" $lg={{alignItems: 'flex-end'}}>
          <XStack aria-hidden>
            {crowd.map((index) => (
              <YStack
                key={index}
                marginLeft={index === 0 ? 0 : -16}
                borderRadius="$11"
                borderWidth={3}
                borderColor="$accentYellowPrimary"
              >
                <DemoAvatar index={index} size={64} />
              </YStack>
            ))}
          </XStack>
          <DownloadCta tone="light" />
        </YStack>
      </YStack>
    </PageSection>
  )
}
