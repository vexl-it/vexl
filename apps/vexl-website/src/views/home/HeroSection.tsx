'use client'

import {
  ChevronDown,
  FilterBar,
  PageSection,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import Image from 'next/image'
import React, {useState} from 'react'
import {useTheme} from 'tamagui'
import {DownloadCta} from '../../components/DownloadCta'
import {useLocale} from '../../components/LocaleProvider'
import {PhoneFrame} from '../../components/PhoneFrame'
import {SiteLink} from '../../components/SiteLink'
import {DemoOfferCard} from './mock/DemoOfferCard'

type Side = 'buy' | 'sell'

// Buying shows the offers of people who sell, and the other way round
const offerSideFor = {buy: 'sell', sell: 'buy'} as const

function MarketplaceMock(): React.JSX.Element {
  const {t} = useLocale()
  const mock = t.home.mock
  const [sides, setSides] = useState<ReadonlySet<Side>>(new Set())
  const visibleOffers = pipe(
    mock.offers,
    Array.filter(
      (offer) =>
        sides.size === 0 ||
        pipe(
          [...sides],
          Array.some((side) => offerSideFor[side] === offer.side)
        )
    )
  )

  return (
    <PhoneFrame label={mock.label}>
      <YStack gap="$5" paddingTop="$7">
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          paddingHorizontal="$5"
        >
          {mock.marketplace}
        </Typography>
        <FilterBar<Side>
          items={[
            {label: mock.buy, value: 'buy'},
            {label: mock.sell, value: 'sell'},
          ]}
          selectedValues={sides}
          onSelectedValuesChange={setSides}
        />
        <YStack gap="$3" paddingHorizontal="$3">
          {visibleOffers.map((offer, i) => (
            <YStack key={offer.id} className="vexl-enter">
              <DemoOfferCard offer={offer} avatar={i % 2 === 0 ? 0 : 2} />
            </YStack>
          ))}
        </YStack>
      </YStack>
    </PhoneFrame>
  )
}

export function HeroSection(): React.JSX.Element {
  const {t, path} = useLocale()
  const theme = useTheme()

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
        <XStack alignItems="center" gap="$8" flexWrap="wrap">
          <DownloadCta />
          <SiteLink href={`${path('/')}#how-it-works`}>
            <XStack
              role="none"
              alignItems="center"
              gap="$2"
              hoverStyle={{opacity: 0.7}}
            >
              <Typography
                variant="paragraphSmallBold"
                color="$foregroundPrimary"
              >
                {t.home.hero.howItWorks}
              </Typography>
              <ChevronDown size={20} color={theme.accentYellowPrimary.get()} />
            </XStack>
          </SiteLink>
        </XStack>
      </YStack>
      <XStack
        flex={1}
        justifyContent="center"
        paddingTop="$9"
        borderRadius="$8"
        backgroundColor="$accentYellowPrimary"
        overflow="hidden"
        height={560}
        $lg={{flexBasis: 0, height: 640}}
      >
        <MarketplaceMock />
      </XStack>
    </PageSection>
  )
}
