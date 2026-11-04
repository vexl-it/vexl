'use client'

import {
  ChevronDown,
  FilterBar,
  PageSection,
  ScrollView,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import Image from 'next/image'
import React, {useState} from 'react'
import {useTheme} from 'tamagui'
import {DownloadCta} from '../../components/DownloadCta'
import {useLocale} from '../../components/LocaleProvider'
import {PhoneFrame} from '../../components/PhoneFrame'
import {SiteLink} from '../../components/SiteLink'
import {formatMessage} from '../../i18n/locales'
import {DemoOfferCard} from './mock/DemoOfferCard'
import {OPEN_DEMO_EVENT} from './TradeSection'

type Side = 'buy' | 'sell'

const heroAvatars = [0, 2, 1] as const

// Buying shows the offers of people who sell, and the other way round
const offerSideFor = {buy: 'sell', sell: 'buy'} as const

function MarketplaceMock(): React.JSX.Element {
  const {t, path} = useLocale()
  const mock = t.home.mock
  const [side, setSide] = useState<Side>('buy')
  const visibleOffers = pipe(
    mock.offers,
    Array.filter((offer) => offer.side === offerSideFor[side])
  )

  return (
    <PhoneFrame label={mock.label}>
      <YStack flex={1} gap="$5" paddingTop="$7">
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          paddingHorizontal="$5"
        >
          {mock.marketplace}
        </Typography>
        {/* The filter scrolls sideways; without this it also grows tall */}
        <YStack flexGrow={0}>
          <FilterBar<Side>
            items={[
              {label: mock.buy, value: 'buy'},
              {label: mock.sell, value: 'sell'},
            ]}
            selectedValues={new Set([side])}
            // One side is always shown, like the app's buy/sell switch
            onSelectedValuesChange={(values) => {
              const picked = pipe(
                [...values],
                Array.findFirst((value) => value !== side)
              )
              if (Option.isSome(picked)) setSide(picked.value)
            }}
          />
        </YStack>
        <ScrollView flex={1} contentContainerStyle={{flexGrow: 1}}>
          <YStack gap="$3" paddingHorizontal="$3" paddingBottom="$3">
            {visibleOffers.map((offer, i) => (
              <SiteLink
                key={offer.id}
                href={`${path('/')}#how-it-works`}
                label={formatMessage(mock.openInDemo, {
                  price: offer.price,
                  place: offer.place,
                })}
                // The walkthrough's script is about the first offer only
                onPress={(event) => {
                  // The walkthrough scrolls once its new step has rendered
                  event.preventDefault()
                  window.history.pushState(null, '', event.currentTarget.href)
                  window.dispatchEvent(
                    new CustomEvent(OPEN_DEMO_EVENT, {
                      detail:
                        offer.id === mock.offers[0]?.id ? 'friends' : 'offer',
                    })
                  )
                }}
              >
                <YStack
                  role="none"
                  className="vexl-enter"
                  pressStyle={{opacity: 0.7}}
                >
                  <DemoOfferCard
                    offer={offer}
                    avatar={heroAvatars[i % heroAvatars.length] ?? 0}
                  />
                </YStack>
              </SiteLink>
            ))}
          </YStack>
        </ScrollView>
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
      $lg={{paddingTop: '$9'}}
      // Two columns only once the headline column fits Czech "Obchodujte"
      $xl={{flexDirection: 'row', alignItems: 'center'}}
    >
      <YStack flex={1} gap="$7" $xl={{flexBasis: 0, flexGrow: 1.3}}>
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
        paddingVertical="$9"
        borderRadius="$8"
        backgroundColor="$accentYellowPrimary"
        $xl={{flexBasis: 0}}
      >
        <MarketplaceMock />
      </XStack>
    </PageSection>
  )
}
