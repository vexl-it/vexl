'use client'

import {
  Button,
  ChevronDown,
  FadeGradient,
  FilterBar,
  PageSection,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import Image from 'next/image'
import React from 'react'
import {useLocale} from '../../components/LocaleProvider'
import {PhoneFrame} from '../../components/PhoneFrame'
import {SiteLink} from '../../components/SiteLink'
import {DemoOfferCard} from './mock/DemoOfferCard'

const heroAvatars = [0, 2, 1] as const

function MarketplaceMock(): React.JSX.Element {
  const {t} = useLocale()
  const mock = t.home.mock
  // Buying shows the offers of people who sell
  const sellOffers = pipe(
    mock.offers,
    Array.filter((offer) => offer.side === 'sell')
  )

  return (
    <PhoneFrame label={mock.label}>
      <YStack flex={1} gap="$5" paddingTop="$7" pointerEvents="none">
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          paddingHorizontal="$5"
        >
          {mock.marketplace}
        </Typography>
        {/* The filter scrolls sideways; without this it collapses */}
        <YStack flexShrink={0}>
          <FilterBar
            items={[
              {label: mock.buy, value: 'buy'},
              {label: mock.sell, value: 'sell'},
            ]}
            selectedValues={new Set(['buy'])}
            onSelectedValuesChange={() => {}}
          />
        </YStack>
        <YStack gap="$3" paddingHorizontal="$3">
          {sellOffers.map((offer, i) => (
            <DemoOfferCard
              key={offer.id}
              offer={offer}
              avatar={heroAvatars[i % heroAvatars.length] ?? 0}
            />
          ))}
        </YStack>
        <YStack position="absolute" left={0} right={0} bottom={0} height={120}>
          <FadeGradient solidEdge="bottom" />
        </YStack>
      </YStack>
    </PhoneFrame>
  )
}

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
            <Button role="none" variant="secondary" icon={ChevronDown}>
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
        <MarketplaceMock />
      </XStack>
    </PageSection>
  )
}
