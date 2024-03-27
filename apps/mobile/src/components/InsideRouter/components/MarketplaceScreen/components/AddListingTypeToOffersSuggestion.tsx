import {useNavigation} from '@react-navigation/native'
import {useAtom, useAtomValue} from 'jotai'
import {type YStackProps} from 'tamagui'
import {
  hideSuggestionToAddListingTypeToMyOffersAtom,
  isThereAnyOfferWithoutListingTypeAtom,
} from '../../../../../state/marketplace/atoms/myOffers'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import MarketplaceSuggestion from './MarketplaceSuggestion'

function AddListingTypeToOffersSuggestion(
  props: YStackProps
): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()

  const isThereAnyOfferWithoutListingType = useAtomValue(
    isThereAnyOfferWithoutListingTypeAtom
  )
  const [
    hideSuggestionToAddListingTypeToMyOffers,
    setHideSuggestionToAddListingTypeToMyOffers,
  ] = useAtom(hideSuggestionToAddListingTypeToMyOffersAtom)

  return !!isThereAnyOfferWithoutListingType &&
    !hideSuggestionToAddListingTypeToMyOffers ? (
    <MarketplaceSuggestion
      buttonText={t('suggestion.addListingType')}
      onButtonPress={() => {
        navigation.navigate('MyOffers')
      }}
      onClosePress={() => {
        setHideSuggestionToAddListingTypeToMyOffers(true)
      }}
      text={t('suggestion.addListingTypeToYourOffers')}
      {...props}
    />
  ) : null
}

export default AddListingTypeToOffersSuggestion
