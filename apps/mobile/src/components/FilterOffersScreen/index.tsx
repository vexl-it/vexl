import {spokenLanguagesOptions} from '@vexl-next/domain/src/general/offers'
import {
  ChevronLeft,
  Collapse,
  Divider,
  InfoBox,
  NavigationBar,
  Screen,
  SectionHeader,
  Stack,
  Switch,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {runAfterTwoAnimationFrames} from '../../utils/runAfterAnimationFrames'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {useOpenChangeCurrency} from '../ChangeCurrency'
import ClubSelectionList from '../ClubSelectionList'
import DeferredContent from '../DeferredContent'
import AmountOfTransaction from '../OfferForm/components/AmountOfTransaction'
import FriendLevel from '../OfferForm/components/FriendLevel'
import {
  amountBottomLimitForRangeInputAtom,
  amountFilterEnabledAtom,
  amountTopLimitForRangeInputAtom,
  btcPricesReadyForFilterAtom,
  clubsFilterEnabledAtom,
  createSelectClubInFilterAtom,
  currencyAtom,
  initializeOffersFilterOnDisplayActionAtom,
  intendedConnectionLevelAtom,
  resetFilterOmitTextFilterActionAtom,
  saveFilterActionAtom,
  updateCurrencyLimitsAtom,
} from './atom'
import BtcPriceInfo from './components/BtcPriceInfo'
import FilterOffersFooter from './components/FilterOffersFooter'
import LocationSection from './components/LocationSection'
import LookingToSection from './components/LookingToSection'
import NetworkSection from './components/NetworkSection'
import ProductCategorySection from './components/ProductCategorySection'
import ShowOffersSection from './components/ShowOffersSection'
import Sorting from './components/Sorting'
import SpokenLanguageTag from './components/SpokenLanguageTag'

function FilterOffersScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const saveFilter = useSetAtom(saveFilterActionAtom)
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
  const amountContentVisible = amountFilterEnabled && !!currency

  const resetOfferForm = useCallback(() => {
    resetFilterOmitTextFilter()
  }, [resetFilterOmitTextFilter])

  const handleSave = useCallback(() => {
    safeGoBack()
    runAfterTwoAnimationFrames(saveFilter)
  }, [safeGoBack, saveFilter])

  useEffect(() => {
    initializeOffersFilterOnDisplay()
  }, [initializeOffersFilterOnDisplay])

  return (
    <Screen
      noHorizontalPadding
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('filterOffers.filters')}
          leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
          rightActions={[
            {label: t('filterOffers.clearAll'), onPress: resetOfferForm},
          ]}
        />
      }
      footer={<FilterOffersFooter onPress={handleSave} />}
    >
      <DeferredContent>
        <YStack paddingHorizontal="$5" gap="$3">
          <LookingToSection />

          <Divider marginVertical="$5" />

          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            paddingVertical="$3"
          >
            {t('filterOffers.sortBy')}
          </Typography>
          <Sorting />

          <Divider marginVertical="$5" />

          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            paddingVertical="$3"
          >
            {t('filterOffers.showOffers')}
          </Typography>
          <ShowOffersSection />

          <ProductCategorySection />

          <Divider marginVertical="$5" />

          <SectionHeader
            paddingVertical="$3"
            title={t('offerForm.amountOfTransaction.amountOfTransaction')}
            description={t('filterOffers.amountDescription')}
            trailing={<Switch valueAtom={amountFilterEnabledAtom} />}
          />
          <Collapse expanded={amountContentVisible}>
            <YStack gap="$3">
              {amountContentVisible && !amountPricesReady ? (
                <InfoBox variant="naked" loading paddingHorizontal="$4">
                  {t('offerForm.loadingExchangeRate')}
                </InfoBox>
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
          </Collapse>

          <Divider marginVertical="$5" />

          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            paddingVertical="$3"
          >
            {t('offerForm.location.location')}
          </Typography>
          <LocationSection />

          <Divider marginVertical="$5" />

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

          <Divider marginVertical="$5" />

          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            paddingVertical="$3"
          >
            {t('offerForm.network.network')}
          </Typography>
          <NetworkSection />

          <Divider marginVertical="$5" />

          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            paddingVertical="$3"
          >
            {t('filterOffers.connection')}
          </Typography>
          <FriendLevel
            hideSubtitle
            allowDeselect
            onDeselect={() => {
              setIntendedConnectionLevel(undefined)
            }}
            intendedConnectionLevelAtom={intendedConnectionLevelAtom}
          />

          <Divider marginVertical="$5" />

          <SectionHeader
            paddingVertical="$3"
            title={t('filterOffers.showClubOffers')}
            description={t('filterOffers.clubsDescription')}
            trailing={<Switch valueAtom={clubsFilterEnabledAtom} />}
          />
          <Collapse expanded={clubsFilterEnabled}>
            <ClubSelectionList
              createSelectClubAtom={createSelectClubInFilterAtom}
            />
          </Collapse>
        </YStack>
      </DeferredContent>
    </Screen>
  )
}

export default FilterOffersScreen
