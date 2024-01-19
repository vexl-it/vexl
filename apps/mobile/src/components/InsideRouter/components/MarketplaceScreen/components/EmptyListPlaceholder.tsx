import {Text, YStack} from 'tamagui'
import Button from '../../../../Button'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useNavigation} from '@react-navigation/native'
import Image from '../../../../Image'
import anonymousAvatarSvg from '../../../../images/anonymousAvatarSvg'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {reachNumberAtom} from '../../../../../state/connections/atom/connectionStateAtom'
import {
  importedContactsCountAtom,
  initializeMinutesTillOffersDisplayedActionAtom,
  minutesTillOffersDisplayedAtom,
} from '../../../../../state/contacts'
import {
  addMoreContactsSuggestionVisibleAtom,
  createOfferSuggestionVisibleAtom,
  resetFilterSuggestionVisibleAtom,
} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {
  isFilterActiveAtom,
  resetFilterInStorageActionAtom,
} from '../../../../../state/marketplace/filterAtoms'
import EmptyMarketplaceSuggestions from './EmptyMarketplaceSuggestions'
import MarketplaceSuggestion from './MarketplaceSuggestion'
import {useEffect} from 'react'
import {triggerOffersRefreshAtom} from '../../../../../state/marketplace'
import {ScrollView} from 'react-native'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'

const REACH_NUMBER_THRESHOLD = 30

interface EmptyListWrapperProps {
  buttonText: string
  children: React.ReactNode
  onButtonPress: () => void
}

function EmptyListWrapper({
  buttonText,
  children,
  onButtonPress,
}: EmptyListWrapperProps): JSX.Element {
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  return (
    <ScrollView contentContainerStyle={{paddingBottom: tabBarEndsAt + 25}}>
      <YStack f={1} ai="center" jc="center" py="$4" space="$4">
        <Image source={anonymousAvatarSvg} />
        {children}
        <Button
          text={buttonText}
          variant="primary"
          size="small"
          onPress={onButtonPress}
        />
      </YStack>
    </ScrollView>
  )
}

function EmptyListPlaceholder(): JSX.Element {
  const navigation = useNavigation()
  const {t} = useTranslation()
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)
  const importedContactsCount = useAtomValue(importedContactsCountAtom)
  const filterActive = useAtomValue(isFilterActiveAtom)
  const reachNumber = useAtomValue(reachNumberAtom)
  const [minutesTillOffersDisplayed, setMinutesTillOffersDisplayed] = useAtom(
    minutesTillOffersDisplayedAtom
  )
  const resetFilterInStorage = useSetAtom(resetFilterInStorageActionAtom)
  const initializeMinutesTillOffersDisplayed = useSetAtom(
    initializeMinutesTillOffersDisplayedActionAtom
  )
  const createOfferSuggestionVisible = useAtomValue(
    createOfferSuggestionVisibleAtom
  )
  const addMoreContactsSuggestionVisible = useAtomValue(
    addMoreContactsSuggestionVisibleAtom
  )
  const [resetFilterSuggestionVisible, setResetFilterSuggestionVisible] =
    useAtom(resetFilterSuggestionVisibleAtom)

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

  if (filterActive) {
    return resetFilterSuggestionVisible ? (
      <MarketplaceSuggestion
        mt="$4"
        buttonText={t('offer.resetFilter')}
        onButtonPress={resetFilterAndSaveIt}
        onClosePress={() => {
          setResetFilterSuggestionVisible(false)
        }}
        text={t('offer.noOffersToMatchFilter')}
      />
    ) : (
      <EmptyListWrapper
        buttonText={t('offer.resetFilter')}
        onButtonPress={resetFilterAndSaveIt}
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
        <Button
          text={t('myOffers.addNewOffer')}
          variant="secondary"
          size="small"
          onPress={() => {
            navigation.navigate('CreateOffer')
          }}
        />
      </EmptyListWrapper>
    )
  }

  if (importedContactsCount === 0 || reachNumber < REACH_NUMBER_THRESHOLD) {
    return addMoreContactsSuggestionVisible || createOfferSuggestionVisible ? (
      <EmptyMarketplaceSuggestions />
    ) : (
      <EmptyListWrapper
        buttonText={t('suggestion.addMoreContacts')}
        onButtonPress={() => {
          navigation.navigate('SetContacts', {})
        }}
      >
        <Text
          textAlign="center"
          col="$greyOnWhite"
          fos={20}
          ff="$body600"
        >
          {importedContactsCount === 0
            ? t('offer.notImportedAnyContacts')
            : t('offer.socialNetworkTooSmall')}
        </Text>
      </EmptyListWrapper>
    )
  }

  if (reachNumber >= REACH_NUMBER_THRESHOLD) {
    return (
      <EmptyListWrapper
        buttonText={t('offer.emptyAction')}
        onButtonPress={() => {
          navigation.navigate('CreateOffer')
        }}
      >
        {minutesTillOffersDisplayed > 0 ? (
          <Text
            textAlign="center"
            col="$greyOnWhite"
            fos={20}
            ff="$body600"
          >
            {t('offer.offersAreLoadingAndShouldBeReady', {
              minutes: minutesTillOffersDisplayed,
            })}
          </Text>
        ) : (
          <Text
            textAlign="center"
            col="$greyOnWhite"
            fos={20}
            ff="$body600"
          >
            {t('offer.marketplaceEmpty')}
          </Text>
        )}
      </EmptyListWrapper>
    )
  }

  return <></>
}

export default EmptyListPlaceholder
