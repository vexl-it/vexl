'use client'

import {
  Button,
  ChatBubble,
  PageSection,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {useLocale} from '../../components/LocaleProvider'
import {SiteLink} from '../../components/SiteLink'
import {externalLinks} from '../../config/links'

export function OpenSourceSection(): React.JSX.Element {
  const {t} = useLocale()
  const copy = t.home.openSource

  return (
    <PageSection>
      <YStack
        gap="$7"
        padding="$7"
        borderRadius="$8"
        backgroundColor="$backgroundSecondary"
        $md={{flexDirection: 'row', alignItems: 'center', padding: '$10'}}
      >
        <YStack flex={1} gap="$5" alignItems="flex-start">
          <Typography tag="h2" variant="heading2" color="$foregroundPrimary">
            {copy.title}
          </Typography>
          <SiteLink href={externalLinks.github}>
            <Button role="none" size="medium">
              {copy.github}
            </Button>
          </SiteLink>
        </YStack>
        <XStack flex={1} alignItems="center" gap="$5">
          <YStack flex={1}>
            <ChatBubble text={copy.text} isMine={false} />
          </YStack>
          <Image
            src="/images/open-source-avatar.webp"
            alt=""
            width={68}
            height={90}
          />
        </XStack>
      </YStack>
    </PageSection>
  )
}
