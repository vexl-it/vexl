import {ScrollView} from 'react-native'
import MarketplaceSuggestion from './MarketplaceSuggestion'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  addMoreContactsSuggestionVisibleAtom,
  createOfferSuggestionVisibleAtom,
} from '../../../../../state/marketplace/atom'
import {useAtom} from 'jotai'
import {useNavigation} from '@react-navigation/native'
import {YStack} from 'tamagui'

function EmptyMarketplaceSuggestions(): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const [createOfferSuggestionVisible, setCreateOfferSuggestionVisible] =
    useAtom(createOfferSuggestionVisibleAtom)
  const [
    addMoreContactsSuggestionVisible,
    setAddMoreContactsSuggestionVisible,
  ] = useAtom(addMoreContactsSuggestionVisibleAtom)

  return (
    <ScrollView>
      <YStack mt={'$4'} space={'$4'}>
        {createOfferSuggestionVisible && (
          <MarketplaceSuggestion
            buttonText={t('myOffers.addNewOffer')}
            onButtonPress={() => {
              navigation.navigate('CreateOffer')
            }}
            onClosePress={() => {
              setCreateOfferSuggestionVisible(false)
            }}
            text={t('suggestion.createYourFirstOffer')}
          />
        )}
        {addMoreContactsSuggestionVisible && (
          <MarketplaceSuggestion
            buttonText={t('suggestion.addMoreContacts')}
            onButtonPress={() => {
              navigation.navigate('SetContacts')
            }}
            onClosePress={() => {
              setAddMoreContactsSuggestionVisible(false)
            }}
            text={t('suggestion.noOffersFromOthersYet')}
          />
        )}
      </YStack>
    </ScrollView>
  )
}

export default EmptyMarketplaceSuggestions
