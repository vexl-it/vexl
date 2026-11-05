'use client'

import {
  AnimatedNavigationBar,
  ArrowsHorizontal,
  BellNotification,
  Button,
  ChatBubbles,
  FabButton,
  FilterBar,
  GraphicHeaderDecoration,
  Map,
  MathCalculate,
  NavButton,
  PeopleUsers,
  PlusAdd,
  SearchBar,
  TabBar,
  Tabs,
  TuneSettings,
  Typography,
  UserProfile,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React from 'react'
import {useSharedValue} from 'react-native-reanimated'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useLocale} from '../../../components/LocaleProvider'
import {DemoOfferCard} from './DemoOfferCard'

const noop = (): void => {}
const noInsets = {
  frame: {x: 0, y: 0, width: 0, height: 0},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
}
const heroAvatars = [0, 2, 1] as const

/**
 * The app's marketplace tab, put together from the same components and
 * strings the app uses (apps/mobile MarketplaceScreen), with example offers.
 * The labels in `home.mock.app` copy packages/localization keys (common.*,
 * marketplaceFilter.*, marketplace.*, offerForm.myNewOffer, tabBar.*); the
 * full locale files are too big to ship to the browser.
 */
export function MarketplaceScreen(): React.JSX.Element {
  const {t} = useLocale()
  const mock = t.home.mock
  const app = mock.app
  const scrollY = useSharedValue(0)
  // Buying bitcoin shows the offers of people who sell it
  const sellOffers = pipe(
    mock.offers,
    Array.filter((offer) => offer.side === 'sell')
  )

  return (
    <SafeAreaProvider initialMetrics={noInsets}>
      <YStack flex={1} backgroundColor="$backgroundPrimary">
        <GraphicHeaderDecoration />
        <AnimatedNavigationBar
          scrollY={scrollY}
          rightActions={[
            {icon: BellNotification, onPress: noop, badge: true},
            {icon: MathCalculate, onPress: noop},
            {icon: UserProfile, onPress: noop},
          ]}
        />
        <YStack paddingLeft="$5">
          <Tabs
            tabs={[
              {label: app.allOffers, value: 'all'},
              {label: app.myOffers, value: 'mine'},
            ]}
            activeTab="all"
            onTabPress={noop}
            // The app's large tabs scroll sideways; a picture can't, so both fit
            size="small"
          />
        </YStack>
        <YStack paddingTop="$7" paddingBottom="$5">
          <YStack gap="$4" paddingBottom="$7">
            <FilterBar
              items={pipe(
                app.filters,
                Array.map((label) => ({label, value: label}))
              )}
              selectedValues={new Set([app.filters[0]])}
              onSelectedValuesChange={noop}
              containerStyle={{marginLeft: '$5'}}
            />
            <XStack gap="$3" paddingHorizontal="$5">
              <SearchBar
                variant="dummy"
                placeholder={app.search}
                onPress={noop}
                flex={1}
              />
              <NavButton variant="secondary" size="large" icon={TuneSettings} />
            </XStack>
          </YStack>
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="$5"
          >
            <Typography variant="description" color="$foregroundSecondary">
              {app.offersCount}
            </Typography>
            <Button variant="link" size="small" icon={Map}>
              {app.showOnMap}
            </Button>
          </XStack>
        </YStack>
        <YStack flex={1} gap="$5" overflow="hidden">
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            paddingHorizontal="$5"
          >
            {app.browseOffers}
          </Typography>
          {sellOffers.map((offer, i) => (
            <YStack key={offer.id} paddingHorizontal="$5">
              <DemoOfferCard
                offer={offer}
                avatar={heroAvatars[i % heroAvatars.length] ?? 0}
              />
            </YStack>
          ))}
          <FabButton floating icon={PlusAdd} label={app.newOffer} />
        </YStack>
        <TabBar
          tabs={[
            {label: app.marketplace, value: 'market', icon: ArrowsHorizontal},
            {label: app.chats, value: 'chats', icon: ChatBubbles, badge: true},
            {label: app.community, value: 'community', icon: PeopleUsers},
          ]}
          activeTab="market"
          onTabPress={noop}
        />
      </YStack>
    </SafeAreaProvider>
  )
}
