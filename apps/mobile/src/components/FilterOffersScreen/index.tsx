import {spokenLanguagesOptions} from '@vexl-next/domain/src/general/offers'
import {
  Button,
  ChevronLeft,
  Loader,
  NavButton,
  Screen,
  Separator,
  Stack,
  Switch,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo} from 'react'
import {reportFrontendEventActionAtom} from '../../state/analytics/atoms'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import numberOfFriendsAtom from '../CRUDOfferFlow/atoms/numberOfFriendsAtom'
import {useOpenChangeCurrency} from '../ChangeCurrency'
import DeferredContent from '../DeferredContent'
import AmountOfTransaction from '../OfferForm/components/AmountOfTransaction'
import FriendLevel from '../OfferForm/components/FriendLevel'
import {
  amountBottomLimitForRangeInputAtom,
  amountFilterEnabledAtom,
  amountTopLimitForRangeInputAtom,
  btcPricesReadyForFilterAtom,
  clubsFilterEnabledAtom,
  currencyAtom,
  filteredOffersPreviewCountAtom,
  initializeOffersFilterOnDisplayActionAtom,
  intendedConnectionLevelAtom,
  resetFilterOmitTextFilterActionAtom,
  saveFilterActionAtom,
  updateCurrencyLimitsAtom,
} from './atom'
import AnimatedCollapse from './components/AnimatedCollapse'
import BtcPriceInfo from './components/BtcPriceInfo'
import ClubsSection from './components/ClubsSection'
import LocationSection from './components/LocationSection'
import LookingToSection from './components/LookingToSection'
import NetworkSection from './components/NetworkSection'
import ProductCategorySection from './components/ProductCategorySection'
import Sorting from './components/Sorting'
import SpokenLanguageTag from './components/SpokenLanguageTag'

function runAfterTwoAnimationFrames(callback: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback)
  })
}

function FilterOffersScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const saveFilter = useSetAtom(saveFilterActionAtom)
  const reportFrontendEvent = useSetAtom(reportFrontendEventActionAtom)
  const resetFilterOmitTextFilter = useSetAtom(
    resetFilterOmitTextFilterActionAtom
  )
  const initializeOffersFilterOnDisplay = useSetAtom(
    initializeOffersFilterOnDisplayActionAtom
  )
  const updateCurrencyLimits = useSetAtom(updateCurrencyLimitsAtom)
  const setIntendedConnectionLevel = useSetAtom(intendedConnectionLevelAtom)
  const openChangeCurrency = useOpenChangeCurrency()
  const currency = useAtomValue(currencyAtom)
  const amountFilterEnabled = useAtomValue(amountFilterEnabledAtom)
  const amountPricesReady = useAtomValue(btcPricesReadyForFilterAtom)
  const clubsFilterEnabled = useAtomValue(clubsFilterEnabledAtom)
  const numberOfFriends = useAtomValue(numberOfFriendsAtom)
  const filteredOffersCount = useAtomValue(filteredOffersPreviewCountAtom)
  const amountContentVisible = amountFilterEnabled && !!currency

  const connectionSubtitles = useMemo(() => {
    if (numberOfFriends.state !== 'success') return undefined
    const fmt = Intl.NumberFormat()
    return {
      first: t('filterOffers.reachPeople', {
        connectionsCount: fmt.format(numberOfFriends.firstLevelFriendsCount),
      }),
      second: t('filterOffers.reachPeople', {
        connectionsCount: fmt.format(
          numberOfFriends.firstAndSecondLevelFriendsCount
        ),
      }),
    }
  }, [numberOfFriends, t])

  const resetOfferForm = useCallback(() => {
    resetFilterOmitTextFilter()
  }, [resetFilterOmitTextFilter])

  const handleSave = useCallback(() => {
    reportFrontendEvent('offerSearchPerformed')
    safeGoBack()
    runAfterTwoAnimationFrames(saveFilter)
  }, [reportFrontendEvent, safeGoBack, saveFilter])

  useEffect(() => {
    initializeOffersFilterOnDisplay()
  }, [initializeOffersFilterOnDisplay])

  return (
    <Screen
      noHorizontalPadding
      scrollable
      navigationBar={
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$5"
          paddingVertical="$4"
        >
          <XStack flex={1} alignItems="center">
            <NavButton
              variant="highlighted"
              icon={ChevronLeft}
              onPress={safeGoBack}
            />
          </XStack>
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {t('filterOffers.filters')}
          </Typography>
          <XStack flex={1} justifyContent="flex-end">
            <NavButton type="text" variant="normal" onPress={resetOfferForm}>
              {t('filterOffers.clearAll')}
            </NavButton>
          </XStack>
        </XStack>
      }
      footer={
        <Button variant="primary" size="large" onPress={handleSave}>
          {t('filterOffers.seeOffers', {count: filteredOffersCount})}
        </Button>
      }
    >
      <DeferredContent>
        <YStack paddingHorizontal="$5" gap="$3">
          <LookingToSection />

          <Separator marginVertical="$5" borderColor="$backgroundTertiary" />

          {/* Sort by */}
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            paddingVertical="$3"
          >
            {t('filterOffers.sortBy')}
          </Typography>
          <Sorting />

          <ProductCategorySection />

          <Separator marginVertical="$5" borderColor="$backgroundTertiary" />

          {/* Amount */}
          <XStack alignItems="center" gap="$4" paddingVertical="$3">
            <YStack flex={1} gap="$1">
              <Typography variant="titlesSmall" color="$foregroundPrimary">
                {t('offerForm.amountOfTransaction.amountOfTransaction')}
              </Typography>
              <Typography variant="description" color="$foregroundSecondary">
                {t('filterOffers.amountDescription')}
              </Typography>
            </YStack>
            <Switch valueAtom={amountFilterEnabledAtom} />
          </XStack>
          <AnimatedCollapse expanded={amountContentVisible}>
            <YStack gap="$3">
              {amountContentVisible && !amountPricesReady ? (
                <XStack alignItems="center" gap="$3" paddingHorizontal="$4">
                  <Loader size="small" />
                  <Typography
                    variant="description"
                    color="$foregroundSecondary"
                  >
                    {t('offerForm.loadingExchangeRate')}
                  </Typography>
                </XStack>
              ) : null}
              {amountContentVisible ? (
                <>
                  <Stack
                    opacity={amountPricesReady ? 1 : 0.5}
                    pointerEvents={amountPricesReady ? 'auto' : 'none'}
                  >
                    <AmountOfTransaction
                      amountTopLimitAtom={amountTopLimitForRangeInputAtom}
                      amountBottomLimitAtom={amountBottomLimitForRangeInputAtom}
                      currencyAtom={currencyAtom}
                      onCurrencyPress={() => {
                        openChangeCurrency({
                          selectedCurrencyCode: currency,
                          onSave: (currency) => {
                            updateCurrencyLimits({currency})
                          },
                        })
                      }}
                      maxLabel={t('offerForm.max')}
                    />
                  </Stack>
                  <BtcPriceInfo />
                </>
              ) : null}
            </YStack>
          </AnimatedCollapse>

          <Separator marginVertical="$5" borderColor="$backgroundTertiary" />

          {/* Location */}
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            paddingVertical="$3"
          >
            {t('offerForm.location.location')}
          </Typography>
          <LocationSection />

          <Separator marginVertical="$5" borderColor="$backgroundTertiary" />

          {/* Preferred language */}
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            paddingVertical="$3"
          >
            {t('filterOffers.preferredLanguage')}
          </Typography>
          <XStack flexWrap="wrap" gap="$3">
            {spokenLanguagesOptions.map((language) => (
              <SpokenLanguageTag key={language} language={language} />
            ))}
          </XStack>

          <Separator marginVertical="$5" borderColor="$backgroundTertiary" />

          {/* Network */}
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            paddingVertical="$3"
          >
            {t('offerForm.network.network')}
          </Typography>
          <NetworkSection />

          <Separator marginVertical="$5" borderColor="$backgroundTertiary" />

          {/* Connection */}
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            paddingVertical="$3"
          >
            {t('filterOffers.connection')}
          </Typography>
          <FriendLevel
            allowDeselect
            onDeselect={() => {
              setIntendedConnectionLevel(undefined)
            }}
            subtitles={connectionSubtitles}
            intendedConnectionLevelAtom={intendedConnectionLevelAtom}
          />

          <Separator marginVertical="$5" borderColor="$backgroundTertiary" />

          {/* Show club offers */}
          <XStack alignItems="center" gap="$4" paddingVertical="$3">
            <YStack flex={1} gap="$1">
              <Typography variant="titlesSmall" color="$foregroundPrimary">
                {t('filterOffers.showClubOffers')}
              </Typography>
              <Typography variant="description" color="$foregroundSecondary">
                {t('filterOffers.clubsDescription')}
              </Typography>
            </YStack>
            <Switch valueAtom={clubsFilterEnabledAtom} />
          </XStack>
          <AnimatedCollapse expanded={clubsFilterEnabled}>
            <ClubsSection />
          </AnimatedCollapse>
        </YStack>
      </DeferredContent>
    </Screen>
  )
}

export default FilterOffersScreen
