import {useNavigation} from '@react-navigation/native'
import {type YStackProps} from 'tamagui'
import {shouldDisplaySuggestionToAddListingTypeAtom} from '../../../../../state/marketplace/atoms/myOffers'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'

function AddListingTypeToOffersSuggestion(
  props: YStackProps
): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()

  return (
    <MarketplaceSuggestion
      buttonText={t('suggestion.addListingType')}
      onButtonPress={() => {
        navigation.navigate('MyOffers')
      }}
      text={t('suggestion.addListingTypeToYourOffers')}
      visibleStateAtom={shouldDisplaySuggestionToAddListingTypeAtom}
      {...props}
    />
  )
}

export default AddListingTypeToOffersSuggestion
