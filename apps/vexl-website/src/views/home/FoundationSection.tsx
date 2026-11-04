'use client'

import {
  ArrowRight,
  PageSection,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from '../../components/LocaleProvider'
import {SiteLink} from '../../components/SiteLink'
import {externalLinks} from '../../config/links'

export function FoundationSection(): React.JSX.Element {
  const {t} = useLocale()
  const theme = useTheme()

  return (
    <PageSection>
      <SiteLink href={externalLinks.foundation}>
        <YStack
          role="none"
          gap="$7"
          padding="$7"
          borderRadius="$8"
          backgroundColor="$backgroundSecondary"
          hoverStyle={{backgroundColor: '$backgroundTertiary'}}
          $md={{flexDirection: 'row', alignItems: 'center', padding: '$10'}}
        >
          <YStack flex={1} gap="$5">
            <Image
              src="/images/foundation-logo.svg"
              alt="Vexl Foundation"
              width={220}
              height={18}
            />
            <Image
              src="/images/foundation-heart.webp"
              alt=""
              width={200}
              height={175}
            />
          </YStack>
          <YStack flex={1} gap="$4">
            <XStack
              justifyContent="space-between"
              alignItems="flex-start"
              gap="$4"
            >
              <Typography
                tag="h2"
                variant="heading2"
                color="$foregroundPrimary"
              >
                {t.home.foundation.title}
              </Typography>
              <ArrowRight size={32} color={theme.foregroundPrimary.get()} />
            </XStack>
            <Typography variant="paragraphSmall" color="$foregroundSecondary">
              {t.home.foundation.text}
            </Typography>
          </YStack>
        </YStack>
      </SiteLink>
    </PageSection>
  )
}
