import {useNavigation} from '@react-navigation/native'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {Text} from 'tamagui'
import {reachNumberAtom} from '../../../../../state/connections/atom/connectionStateAtom'
import {
  initializeMinutesTillOffersDisplayedActionAtom,
  minutesTillOffersDisplayedAtom,
} from '../../../../../state/contacts'
import {importedContactsCountAtom} from '../../../../../state/contacts/atom/contactsStore'
import {triggerOffersRefreshAtom} from '../../../../../state/marketplace'
import {
  isFilterActiveAtom,
  isTextFilterActiveAtom,
  resetFilterInStorageActionAtom,
} from '../../../../../state/marketplace/atoms/filterAtoms'
import {offersToSeeInMarketplaceCountAtom} from '../../../../../state/marketplace/atoms/filteredOffersCountAtoms'
import {refocusMapActionAtom} from '../../../../../state/marketplace/atoms/map/focusedOffer'
import marketplaceLayoutModeAtom from '../../../../../state/marketplace/atoms/map/marketplaceLayoutModeAtom'
import {
  addMoreContactsSuggestionVisibleAtom,
  createOfferSuggestionVisibleAtom,
  resetFilterSuggestionVisibleAtom,
} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {areThereOffersToSeeInMarketplaceWithoutFiltersAtom} from '../../../../../state/marketplace/atoms/offersToSeeInMarketplace'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import EmptyListWrapper from '../../../../EmptyListWrapper'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'
import EmptyMarketplaceSuggestions from './EmptyMarketplaceSuggestions'

const REACH_NUMBER_THRESHOLD = 30

interface Props {
  refreshing: boolean
  onRefresh?: () => Promise<void>
}

function EmptyListPlaceholder({refreshing, onRefresh}: Props): JSX.Element {
  const navigation = useNavigation()
  const {t} = useTranslation()

  const importedContactsCount = useAtomValue(importedContactsCountAtom)
  const filterActive = useAtomValue(isFilterActiveAtom)
  const isTextFilterActive = useAtomValue(isTextFilterActiveAtom)
  const marketplaceLayout = useAtomValue(marketplaceLayoutModeAtom)
  const offersToSeeInMarketplaceCount = useAtomValue(
    offersToSeeInMarketplaceCountAtom
  )
  const reachNumber = useAtomValue(reachNumberAtom)
  const createOfferSuggestionVisible = useAtomValue(
    createOfferSuggestionVisibleAtom
  )
  const addMoreContactsSuggestionVisible = useAtomValue(
    addMoreContactsSuggestionVisibleAtom
  )
  const areThereOffersToSeeInMarketplaceWithoutFilters = useAtomValue(
    areThereOffersToSeeInMarketplaceWithoutFiltersAtom
  )

  const refocusMap = useSetAtom(refocusMapActionAtom)
  const initializeMinutesTillOffersDisplayed = useSetAtom(
    initializeMinutesTillOffersDisplayedActionAtom
  )
  const resetFilterInStorage = useSetAtom(resetFilterInStorageActionAtom)
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)

  const [resetFilterSuggestionVisible, setResetFilterSuggestionVisible] =
    useAtom(resetFilterSuggestionVisibleAtom)
  const [minutesTillOffersDisplayed, setMinutesTillOffersDisplayed] = useAtom(
    minutesTillOffersDisplayedAtom
  )

  function resetFilterAndSaveIt(): void {
    resetFilterInStorage()
    setResetFilterSuggestionVisible(true)
  }

  useEffect(() => {
    if (reachNumber >= REACH_NUMBER_THRESHOLD) {
      const interval = setInterval(() => {
        if (minutesTillOffersDisplayed > 0) {
          setMinutesTillOffersDisplayed(minutesTillOffersDisplayed - 1)
        }
        void refreshOffers()
      }, 60000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [
    minutesTillOffersDisplayed,
    reachNumber,
    refreshOffers,
    setMinutesTillOffersDisplayed,
  ])

  useEffect(() => {
    initializeMinutesTillOffersDisplayed()
  }, [initializeMinutesTillOffersDisplayed])

  if (marketplaceLayout === 'map' && offersToSeeInMarketplaceCount > 0) {
    return (
      <MarketplaceSuggestion
        mt="$4"
        buttonText={t('map.showOffersOnMap')}
        onButtonPress={() => {
          refocusMap({focusAllOffers: true})
        }}
        text={t('map.noOffersInSelectedRegion')}
      />
    )
  }

  if (filterActive || isTextFilterActive) {
    return (
      <>
        <MarketplaceSuggestion
          mt="$4"
          buttonText={t('offer.resetFilter')}
          onButtonPress={resetFilterAndSaveIt}
          text={t('offer.noOffersToMatchFilter')}
          visibleStateAtom={resetFilterSuggestionVisibleAtom}
        />
        {!resetFilterSuggestionVisible && (
          <EmptyListWrapper
            inScrollView
            refreshing={refreshing}
            onRefresh={onRefresh}
            buttonText={t('myOffers.addNewOffer')}
            onButtonPress={() => {
              navigation.navigate('CreateOffer')
            }}
          >
            <Text
              textAlign="center"
              col="$greyOnWhite"
              fos={20}
              ff="$body600"
              adjustsFontSizeToFit
              numberOfLines={4}
            >
              {t('offer.createOfferNudge')}
            </Text>
          </EmptyListWrapper>
        )}
      </>
    )
  }

  if (importedContactsCount === 0 || reachNumber < REACH_NUMBER_THRESHOLD) {
    return addMoreContactsSuggestionVisible || createOfferSuggestionVisible ? (
      <EmptyMarketplaceSuggestions
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    ) : (
      <EmptyListWrapper
        inScrollView
        refreshing={refreshing}
        onRefresh={onRefresh}
        buttonText={t('suggestion.addMoreContacts')}
        onButtonPress={() => {
          navigation.navigate('SetContacts', {})
        }}
      >
        <Text textAlign="center" col="$greyOnWhite" fos={20} ff="$body600">
          {importedContactsCount === 0
            ? t('offer.notImportedAnyContacts')
            : t('offer.socialNetworkTooSmall')}
        </Text>
      </EmptyListWrapper>
    )
  }

  if (reachNumber >= REACH_NUMBER_THRESHOLD) {
    if (areThereOffersToSeeInMarketplaceWithoutFilters) {
      return (
        <EmptyListWrapper
          inScrollView
          refreshing={refreshing}
          onRefresh={onRefresh}
          buttonText={t('offer.emptyAction')}
          onButtonPress={() => {
            navigation.navigate('CreateOffer')
          }}
        >
          <Text textAlign="center" col="$greyOnWhite" fos={20} ff="$body600">
            {t('offer.thereAreNoOfferForSelectedCategory')}
          </Text>
        </EmptyListWrapper>
      )
    }

    if (minutesTillOffersDisplayed > 0) {
      return (
        <EmptyListWrapper
          inScrollView
          refreshing={refreshing}
          onRefresh={onRefresh}
        >
          <Text textAlign="center" col="$greyOnWhite" fos={20} ff="$body600">
            {t('offer.offersAreLoadingAndShouldBeReady', {
              minutes: minutesTillOffersDisplayed,
            })}
          </Text>
        </EmptyListWrapper>
      )
    }

    return (
      <EmptyListWrapper
        inScrollView
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <Text textAlign="center" col="$greyOnWhite" fos={20} ff="$body600">
          {t('offer.marketplaceEmpty')}
        </Text>
      </EmptyListWrapper>
    )
  }

  return <></>
}

export default EmptyListPlaceholder
